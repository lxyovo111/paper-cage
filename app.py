# app.py — 魔搭创空间入口。
# 游戏本体是纯前端（index.html 自包含）。这里做两件事：
#   1) 创空间外壳页永远在 / 上渲染 Gradio 并抓 /config，所以 Gradio 挂在根路径，游戏本体放在 /play，
#      由 Blocks 的 js 参数在页面加载后跳过去；直接把 index.html 顶到 / 是没用的（平台会劫持 /）。
#   2) 同一个 Gradio 暴露 /gradio_api/call/npc 给前端调语言模型。
# 判定全在 JS 规则引擎里；LLM 只做「编译规矩」和「挑一条漏洞」，超时/失败自动降级。
import json
import os
import threading

import gradio as gr
import requests
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

MODEL = os.environ.get("NPC_MODEL", "Qwen/Qwen3.8-27B")
# 免费端点上的 Qwen3.8 默认开思维链：同一条编译提示词要 25s+（容器侧 30s 读超时直接失败）。
# 显式关掉后实测编译 1.6–2.0s、夜间一句话 0.8s、挑路 0.5s，质量不变。
# 想复现「开着思维链」的对照，把环境变量 NPC_THINK 设成 1。
THINK = os.environ.get("NPC_THINK", "0") == "1"
API = "https://api-inference.modelscope.cn/v1/chat/completions"
TOKEN = os.environ.get("MODELSCOPE_API_KEY", "").strip()
HERE = os.path.dirname(os.path.abspath(__file__))

SYSTEM = """你是监狱题材小游戏《纸上牢笼》的语言层。你只做两件事：
1. 把玩家写的一句「规矩」翻译成可执行的判定字段；
2. 把游戏引擎算出的漏洞清单，说成一句囚犯口吻的低语。
你不做判定，不编造事实，不输出解释。只输出 JSON。"""


def _chat(messages, timeout=20.0, max_tokens=220, temperature=0.7):
    if not TOKEN:
        raise RuntimeError("no token")
    r = requests.post(
        API,
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
        json=_body(messages, temperature, max_tokens),
        timeout=timeout,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _body(messages, temperature, max_tokens):
    body = {"model": MODEL, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
    if not THINK:
        body["chat_template_kwargs"] = {"enable_thinking": False}
    return body


def _json(text):
    a, b = text.find("{"), text.rfind("}")
    if a < 0 or b <= a:
        raise ValueError("no json")
    return json.loads(text[a:b + 1])


ROOM_IDS = ["cell1", "cell2", "cell3", "corridor", "workshop", "medical", "dining", "laundry", "storage", "yard"]
ROOM_CAT = "[cell1]一号牢房、[cell2]二号牢房、[cell3]三号牢房、[corridor]走廊、[workshop]工具间、[medical]医务室、[dining]食堂、[laundry]洗衣房、[storage]储藏室、[yard]放风区"
ACT_IDS = ["MOVE", "TAKE", "BREAK", "CLIMB", "CONFRONT"]
ACT_CAT = "[MOVE]位移、[TAKE]取物、[BREAK]破坏、[CLIMB]攀爬、[CONFRONT]冲突"
ITEM_CAT = "iron（医务室窗的铁条）/sheet（洗衣房的床单）/rope（储藏室的麻绳）/knife（食堂的刀）/key（狱警的钥匙）"


def _norm_lang(L, text):
    """把模型输出收进引擎的合法域：房间 id 只能是白名单，动作只能是大写 id，时间窗必须是真区间。
    模型越界就纠正；纠不了就抛错，让前端用本地规则 —— 宁可降级，不要让一条坏规矩进游戏。"""
    if not isinstance(L, dict):
        raise ValueError("no lang")
    w = L.get("window") or {}
    a = int(w.get("from", -1))
    b = int(w.get("to", -1))
    night_words = any(k in text for k in ("夜", "入夜", "晚上", "熄灯"))
    always_words = any(k in text for k in ("任何时候", "全时段", "全天", "白天", "一直"))
    if not (0 <= a <= 1440 and 0 <= b <= 1440) or a == b:
        # 空窗或越界：按句意补成「夜里」或「全时段」
        a, b = (1320, 300) if night_words else (0, 1439)
    elif b < a:
        b += 1440  # 跨夜
    # 句子里明说了「夜里」，就以句子为准：模型经常把夜里写成 22:00–23:59，午夜后等于没有规矩
    if night_words and not always_words:
        a, b = 1320, 300
    elif always_words and not night_words:
        a, b = 0, 1439
    if b > 1440:
        b -= 1440
    if b == 1440:
        b = 1439
    # 引擎的时间窗支持跨夜（from > to），所以允许 a > b，只禁止空窗
    if not (0 <= a <= 1439 and 0 <= b <= 1439) or a == b:
        raise ValueError("bad window")

    z = L.get("zones")
    if z == "ALL" or z is None:
        zones = "ALL"
    else:
        zones = [str(x) for x in z if str(x) in ROOM_IDS]
        zones = zones or "ALL"

    acts = [str(x).upper() for x in (L.get("actions") or [])]
    acts = [x for x in dict.fromkeys(acts) if x in ACT_IDS]
    if not acts:
        raise ValueError("no action")
    # 模型容易把「不许进入洗衣房」写成五个动作全禁；按句子语义收窄，只保留真正被禁止的动作
    OBJ_ACTS = [
        (("窗", "通风口", "围墙", "墙", "闸门", "铁门"), ("TAKE", "BREAK", "CLIMB")),
        (("后门", "药柜"), ("TAKE", "BREAK")),
    ]
    VERB_ACTS = [
        ("MOVE", ("进入", "离开", "走进", "走到", "走动", "待在", "回房")),
        ("TAKE", ("取走", "拿走", "带走", "取", "拿", "带", "碰", "使用", "偷", "摸")),
        ("BREAK", ("破坏", "撬", "砸", "拆", "锯", "挖", "凿")),
        ("CLIMB", ("翻", "爬", "攀", "上墙", "越")),
        ("CONFRONT", ("冲突", "袭击", "打", "抢", "动手")),
    ]
    narrowed = None
    for words, allowed in OBJ_ACTS:
        if any(k in text for k in words):
            narrowed = allowed
            break
    if narrowed is None:
        hinted = [a for a, ws in VERB_ACTS if any(k in text for k in ws)]
        if hinted:
            narrowed = tuple(hinted)
    if narrowed:
        keep = [x for x in acts if x in narrowed]
        acts = keep or [x for x in narrowed if x in ACT_IDS]

    item = L.get("item")
    item = item if item in ("iron", "sheet", "rope", "knife", "key") else None
    return {"window": {"from": a, "to": b}, "zones": zones,
            "actions": acts, "escort": bool(L.get("escort")), "item": item}


def _compile(payload):
    text = payload.get("text", "")[:80]
    prompt = """把玩家写的一句监狱规矩，翻译成可执行的判定字段：
「%s」

可选区域（只能用这些 id）：%s
可选动作（只能用这些 id）：%s
可选物品（没有就 null）：%s

时间用「当天的分钟数」表示：夜里 = 1320 到 300（跨夜），全时段 = 0 到 1439。
from 必须小于 to，绝对不要输出 from 等于 to。

只输出 JSON，不要解释：
{"lang":{"window":{"from":分钟,"to":分钟},"zones":"ALL"或["区域id"],"actions":["动作id"],"escort":true/false,"item":null}}

一句话没提到的区域不要擅自扩大，宁可窄。""" % (text, ROOM_CAT, ACT_CAT, ITEM_CAT)
    raw = _chat([
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": prompt},
    ], timeout=20.0, max_tokens=160, temperature=0.2)
    return {"ok": True, "lang": _norm_lang(_json(raw).get("lang"), text)}


def _choose(payload):
    holes = payload.get("holes", [])[:6]
    lines = "\n".join("- id=%s 名字=%s：进度 %s/%s，卡在 %s" % (h.get("id"), h.get("name"), h.get("depth"), h.get("total"), h.get("blockedAt") or "没卡住") for h in holes)
    prompt = "今晚这些越狱路线都是通的或试过的：\n%s\n\n挑一条他今晚最可能去试的，只输出 JSON：{\"id\":\"路线id\"}（id 必须是上面列出的 id 之一）" % lines
    raw = _chat([{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}], timeout=12.0, max_tokens=60)
    got = str(_json(raw).get("id") or "").strip()
    # 模型有时回中文名字：映射回合法 id，仍不合法的交给前端按本地顺序兜底。
    for h in holes:
        if got in (h.get("id"), h.get("name")):
            return {"ok": True, "id": h.get("id")}
    return {"ok": True, "id": None}


def _remark(payload):
    """夜里的一句话：他今晚做了什么、被哪条规矩拦过。只写一句，不下判断。"""
    st = payload.get("state", {})
    rules = st.get("rules") or []
    rule_txt = "；".join([r.get("text", "") for r in rules[:6]]) or "（他还没看到任何规矩）"
    route = st.get("route") or "某条路"
    outcome = st.get("outcome") or "unknown"
    blocked = st.get("blocked") or ""
    prompt = """这是最后一夜之前的一夜。
玩家（监狱长）写的规矩：%s
囚犯今晚走的是：%s
今晚的结果：%s
拦住他的那条规矩：%s

用一句中文写囚犯此刻的样子或心里的想法（不超过 30 字，允许沉默、允许不完整）。
要求：
1. 必须具体到一个动作或一件东西，不许抽象总结。
2. 不要说「他决定」「他意识到」这类解释。
3. 不要提到「AI」「系统」「玩家」「规矩」这些词，也不要评价。
4. 只输出 JSON：{"line":"……"}""" % (rule_txt, route, outcome, blocked or "没有")
    raw = _chat([
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": prompt},
    ], timeout=12.0, max_tokens=70, temperature=0.9)
    line = str(_json(raw).get("line") or "").strip()
    return {"ok": True, "line": line[:40]}


def _warm():
    """免费推理端点会冷启动（首包可到 10s+）。进程起来就先戳一下，玩家写第一条规矩时模型是热的。"""
    try:
        _chat([{"role": "user", "content": "ping"}], timeout=40.0, max_tokens=4)
    except Exception:  # noqa: BLE001
        pass


def npc(payload_json: str) -> str:
    """前端唯一入口：传入 JSON 字符串，返回 JSON 字符串。任何异常都返回 {"ok": false} 让前端降级。"""
    try:
        payload = json.loads(payload_json) if isinstance(payload_json, str) else payload_json
        task = payload.get("task")
        if task == "warm":
            # 不要让预热占着 Gradio 的事件队列：玩家第一条规矩会排在它后面等 30 秒。
            threading.Thread(target=_warm, daemon=True).start()
            out = {"ok": True}
        elif task == "compile":
            out = _compile(payload)
        elif task == "choose":
            out = _choose(payload)
        elif task == "remark":
            out = _remark(payload)
        else:
            out = {"ok": False, "error": "unknown task"}
        return json.dumps(out, ensure_ascii=False)
    except Exception as e:  # noqa: BLE001
        return json.dumps({"ok": False, "error": str(e)[:120]}, ensure_ascii=False)


demo = gr.Blocks(title="纸上牢笼", js="() => { try { window.location.replace('/play'); } catch (e) {} }")
with demo:
    gr.HTML("<div style='font:16px/1.8 serif;padding:32px'>正在载入 · 纸上牢笼</div>")
    _in = gr.Textbox(value="{}", visible=False)
    _out = gr.Textbox(value="", visible=False)
    _btn = gr.Button(visible=False)
    _btn.click(npc, _in, _out, api_name="npc", concurrency_limit=None)

app = FastAPI()


@app.get("/healthz")
def _health():
    return {"ok": True}


@app.get("/play")
def _play():
    """游戏本体：自包含静态页。放在 /play，因为它必须在真正的 HTML 文档里跑 ——
    创空间的外壳页永远在 / 上渲染 Gradio，不能直接把 index.html 顶到 /。"""
    for p in (os.path.join(HERE, "index.html"), os.path.join(HERE, "dist", "index.html")):
        if os.path.exists(p):
            return FileResponse(p)
    return JSONResponse({"error": "index.html missing"}, status_code=500)


app.mount("/static", StaticFiles(directory=HERE), name="static")
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    import uvicorn

    threading.Thread(target=_warm, daemon=True).start()  # 后台预热，不阻塞启动
    uvicorn.run(app, host="0.0.0.0", port=7860)