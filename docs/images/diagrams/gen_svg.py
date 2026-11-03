"""生成技术文档里的精确示意图（SVG）。数值全部抄自源码常量，改了代码要重新生成。
用法：python3 gen_svg.py <输出目录>
"""
import math
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
FONT = "PingFang SC, Microsoft YaHei, Noto Sans CJK SC, Helvetica, Arial, sans-serif"

# ---- apps/desktop/src/shared/ui-map.ts
TEHAI_X = [2.23125, 3.021875, 3.8125, 4.603125, 5.39375, 6.184375, 6.975, 7.765625, 8.55625, 9.346875, 10.1375,
           10.928125, 11.71875, 12.509375]
TEHAI_Y = 8.3625
TRUMO_SPACE = 0.246875
BUTTONS = [[10.875, 7], [8.6375, 7], [6.4, 7], [10.875, 5.9], [8.6375, 5.9], [6.4, 5.9],
           [10.875, 4.8], [8.6375, 4.8], [6.4, 4.8]]
CANDIDATES = [[3.6625, 6.3], [4.49625, 6.3], [5.33, 6.3], [6.16375, 6.3], [6.9975, 6.3], [7.83125, 6.3],
              [8.665, 6.3], [9.49875, 6.3], [10.3325, 6.3], [11.16625, 6.3], [12, 6.3]]
# ---- apps/desktop/src/renderer/hud/zones.ts
KEEP = [("牌桌与牌河", "Table &amp; rivers", 5.8, 1.9, 4.7, 3.3), ("操作按钮区", "Action buttons", 6.2, 6.4, 5.0, 1.0),
        ("读秒", "Timer", 11.8, 6.4, 2.2, 1.1), ("手牌行", "Hand row", 2.0, 7.72, 10.0, 1.28),
        ("自家头像", "Own avatar", 3.4, 5.8, 1.0, 1.0), ("右侧头像", "Right avatar", 14.2, 2.2, 1.1, 1.4),
        ("对家头像", "Top avatar", 11.3, 0.3, 1.0, 1.0), ("左侧头像", "Left avatar", 0.5, 2.2, 1.0, 1.3),
        ("宝牌框", "Dora box", 0.0, 0.2, 2.8, 2.0), ("右上按钮", "Menu buttons", 13.7, 0.2, 1.9, 0.9),
        ("左侧栏", "Left rail", 0.0, 3.7, 0.6, 3.2), ("右侧栏", "Right rail", 15.3, 4.1, 0.7, 1.7),
        ("对手手牌(右)", "Opp. hand (R)", 13.7, 1.9, 1.6, 4.9), ("对手手牌(上)", "Opp. hand (top)", 6.0, 0.0, 5.2, 0.7)]
# 信息层卡片（ZONES；高度取典型值）
CARDS = [("教练卡", "Coach card", 0.62, 7.52 - 3.2, 2.5, 3.2), ("对手卡", "Opponents card", 10.78, 1.5, 2.7, 4.6)]
CALLOUT = (7.7, 5.29)

T = {
    "zh": dict(title="16×9 游戏坐标系：点击目标与信息层版面", hand="手牌（排序后第 0–13 张）", drawn="摸牌（额外间隔）",
               btn="按钮槽位（0 = 跳过）", cand="吃 / 碰 / 杠 候选组合", keep="必须保持透明（e2e 逐像素检查）",
               card="信息层卡片", callout="事件横幅锚点", unit="1 格 = 画面宽 / 16"),
    "en": dict(title="16×9 game coordinates: click targets and overlay layout", hand="Hand tiles (sorted, index 0–13)", drawn="Drawn tile (extra gap)",
               btn="Button slots (0 = skip)", cand="Chi / pon / kan combinations", keep="Must stay transparent (pixel-checked by e2e)",
               card="Overlay cards", callout="Banner anchor", unit="1 cell = view width / 16"),
}


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="{FONT}">'
            f'<rect width="{w}" height="{h}" rx="14" fill="#ffffff"/>{body}</svg>')


def coords(lang):
    t = T[lang]
    S, X0, Y0 = 62, 40, 70          # 每格像素
    W, H = X0 * 2 + 16 * S, Y0 + 9 * S + 120
    b = [f'<text x="{X0}" y="38" font-size="20" font-weight="700" fill="#1d1b17">{t["title"]}</text>',
         f'<rect x="{X0}" y="{Y0}" width="{16*S}" height="{9*S}" fill="#2b4f7e"/>']
    for i in range(17):
        b.append(f'<line x1="{X0+i*S}" y1="{Y0}" x2="{X0+i*S}" y2="{Y0+9*S}" stroke="#ffffff" stroke-opacity="0.18"/>')
        b.append(f'<text x="{X0+i*S}" y="{Y0-6}" font-size="11" text-anchor="middle" fill="#6b665b">{i}</text>')
    for j in range(10):
        b.append(f'<line x1="{X0}" y1="{Y0+j*S}" x2="{X0+16*S}" y2="{Y0+j*S}" stroke="#ffffff" stroke-opacity="0.18"/>')
        b.append(f'<text x="{X0-8}" y="{Y0+j*S+4}" font-size="11" text-anchor="end" fill="#6b665b">{j}</text>')
    b.append('<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
             '<rect width="8" height="8" fill="#e5492f" fill-opacity="0.18"/><line x1="0" y1="0" x2="0" y2="8" stroke="#e5492f" stroke-width="3" stroke-opacity="0.55"/></pattern></defs>')
    for zh, en, x, y, w, h in KEEP:
        b.append(f'<rect x="{X0+x*S}" y="{Y0+y*S}" width="{w*S}" height="{h*S}" fill="url(#hatch)" stroke="#e5492f" stroke-width="1.5"/>')
        b.append(f'<text x="{X0+(x+0.08)*S}" y="{Y0+(y+0.28)*S}" font-size="11" fill="#fff7e8" font-weight="700">{zh if lang=="zh" else en}</text>')
    for zh, en, x, y, w, h in CARDS:
        b.append(f'<rect x="{X0+x*S}" y="{Y0+y*S}" width="{w*S}" height="{h*S}" rx="4" fill="#15171c" fill-opacity="0.85" stroke="#3fb27b" stroke-width="2"/>')
        b.append(f'<rect x="{X0+x*S}" y="{Y0+y*S}" width="{w*S}" height="5" fill="#3fb27b"/>')
        b.append(f'<text x="{X0+(x+w/2)*S}" y="{Y0+(y+h/2)*S}" font-size="14" text-anchor="middle" fill="#f3eee1" font-weight="700">{zh if lang=="zh" else en}</text>')
    cx, cy = CALLOUT
    b.append(f'<circle cx="{X0+cx*S}" cy="{Y0+cy*S}" r="6" fill="#f0b43a" stroke="#0b0c0f" stroke-width="2"/>')
    for i, x in enumerate(TEHAI_X[:13]):
        b.append(f'<rect x="{X0+(x-0.37)*S}" y="{Y0+7.72*S}" width="{0.74*S}" height="{1.1*S}" rx="4" fill="#f6f1e4" stroke="#0b0c0f"/>')
        b.append(f'<circle cx="{X0+x*S}" cy="{Y0+TEHAI_Y*S}" r="4" fill="#d93f28"/>')
        b.append(f'<text x="{X0+x*S}" y="{Y0+8.0*S}" font-size="11" text-anchor="middle" fill="#1d1b17">{i}</text>')
    dx = TEHAI_X[13] + TRUMO_SPACE
    b.append(f'<rect x="{X0+(dx-0.37)*S}" y="{Y0+7.72*S}" width="{0.74*S}" height="{1.1*S}" rx="4" fill="#f6f1e4" stroke="#f0b43a" stroke-width="3"/>')
    b.append(f'<circle cx="{X0+dx*S}" cy="{Y0+TEHAI_Y*S}" r="4" fill="#d93f28"/>')
    for k, (x, y) in enumerate(BUTTONS):
        b.append(f'<rect x="{X0+(x-0.95)*S}" y="{Y0+(y-0.32)*S}" width="{1.9*S}" height="{0.64*S}" rx="{0.32*S}" fill="#f0b43a" fill-opacity="{0.95 if k < 6 else 0.55}" stroke="#0b0c0f" stroke-width="1.5"/>')
        b.append(f'<text x="{X0+x*S}" y="{Y0+(y+0.1)*S}" font-size="15" text-anchor="middle" font-weight="800" fill="#0b0c0f">{k}</text>')
    for x, y in CANDIDATES:
        b.append(f'<circle cx="{X0+x*S}" cy="{Y0+y*S}" r="5" fill="#4f8fd0" stroke="#ffffff" stroke-width="1.5"/>')
    # 图例
    ly = Y0 + 9 * S + 34
    items = [("#f6f1e4", t["hand"], "rect"), ("#f0b43a", t["drawn"], "rect2"), ("#f0b43a", t["btn"], "pill"), ("#4f8fd0", t["cand"], "dot")]
    items2 = [("hatch", t["keep"]), ("card", t["card"]), ("callout", t["callout"])]
    x = X0
    for col, label, kind in items:
        if kind == "dot":
            b.append(f'<circle cx="{x+8}" cy="{ly-5}" r="6" fill="{col}"/>')
        elif kind == "pill":
            b.append(f'<rect x="{x}" y="{ly-14}" width="22" height="16" rx="8" fill="{col}" stroke="#0b0c0f"/>')
        else:
            b.append(f'<rect x="{x}" y="{ly-15}" width="16" height="18" rx="3" fill="#f6f1e4" stroke="{"#f0b43a" if kind=="rect2" else "#0b0c0f"}" stroke-width="{3 if kind=="rect2" else 1}"/>')
        b.append(f'<text x="{x+30}" y="{ly}" font-size="13" fill="#1d1b17">{label}</text>')
        x += 30 + len(label) * (13 if lang == "zh" else 7) + 26
    x, ly = X0, ly + 32
    for kind, label in items2:
        if kind == "hatch":
            b.append(f'<rect x="{x}" y="{ly-14}" width="22" height="16" fill="url(#hatch)" stroke="#e5492f"/>')
        elif kind == "card":
            b.append(f'<rect x="{x}" y="{ly-14}" width="22" height="16" rx="3" fill="#15171c" stroke="#3fb27b" stroke-width="2"/>')
        else:
            b.append(f'<circle cx="{x+10}" cy="{ly-6}" r="6" fill="#f0b43a" stroke="#0b0c0f" stroke-width="2"/>')
        b.append(f'<text x="{x+30}" y="{ly}" font-size="13" fill="#1d1b17">{label}</text>')
        x += 30 + len(label) * (13 if lang == "zh" else 7) + 26
    b.append(f'<text x="{X0+16*S}" y="{ly}" font-size="12" text-anchor="end" fill="#6b665b">{t["unit"]}</text>')
    return svg(W, H, "".join(b))


# ---- apps/desktop/src/main/layout.ts + shared/layout-fit.ts
def layout(lang):
    zh = lang == "zh"
    L = {
        "title": "主窗口布局（以 1600×900 为例，单位 px）" if zh else "Main window layout (1600×900 example, px)",
        "top": "顶栏 TopBar 44" if zh else "TopBar 44",
        "status": "状态栏 24" if zh else "Status bar 24",
        "side": "侧栏 Sidebar 340–520（默认 400，可折叠成 56）" if zh else "Sidebar 340–520 (default 400, collapses to 56)",
        "rt": "上信息栏（预留 34）" if zh else "Top info bar (reserved 34)",
        "rb": "下信息栏（预留 92）" if zh else "Bottom info bar (reserved 92)",
        "game": "游戏画面 WebContentsView（严格 16:9）" if zh else "Game WebContentsView (strict 16:9)",
        "ov": "信息层窗口（透明、点击穿透）覆盖整个游戏区" if zh else "Overlay window (transparent, click-through) covers the whole game area",
        "lr": "左右留白" if zh else "Letterbox",
    }
    W, H, S = 1600, 900, 0.62
    TOP, STATUS, SIDE, RT, RB = 44, 24, 400, 34, 92
    areaW, areaH = W - SIDE, H - TOP - STATUS
    innerH = areaH - RT - RB
    gw = areaW
    gh = math.floor(gw * 9 / 16)
    if gh > innerH:
        gh = innerH
        gw = math.floor(gh * 16 / 9)
    gx = (areaW - gw) // 2
    gy = TOP + RT + (innerH - gh) // 2
    ox, oy = 40, 64
    p = lambda v: v * S
    b = [f'<text x="{ox}" y="38" font-size="20" font-weight="700" fill="#1d1b17">{L["title"]}</text>',
         f'<rect x="{ox}" y="{oy}" width="{p(W)}" height="{p(H)}" rx="10" fill="#0e1116"/>',
         f'<rect x="{ox}" y="{oy}" width="{p(W)}" height="{p(TOP)}" rx="10" fill="#151a21"/>',
         f'<text x="{ox+16}" y="{oy+p(TOP)/2+5}" font-size="13" fill="#ece7de">{L["top"]}</text>',
         f'<rect x="{ox}" y="{oy+p(H-STATUS)}" width="{p(W)}" height="{p(STATUS)}" fill="#151a21"/>',
         f'<text x="{ox+16}" y="{oy+p(H-STATUS)+11}" font-size="11" fill="#a9a397">{L["status"]}</text>',
         f'<rect x="{ox+p(areaW)}" y="{oy+p(TOP)}" width="{p(SIDE)}" height="{p(areaH)}" fill="#1c222b"/>',
         f'<text x="{ox+p(areaW)+p(SIDE)/2}" y="{oy+p(TOP)+p(areaH)/2}" font-size="13" text-anchor="middle" fill="#ece7de">{L["side"].split("（")[0].split(" (")[0]}</text>',
         f'<text x="{ox+p(areaW)+p(SIDE)/2}" y="{oy+p(TOP)+p(areaH)/2+20}" font-size="11" text-anchor="middle" fill="#a9a397">{L["side"][len(L["side"].split("（")[0].split(" (")[0]):].strip()}</text>',
         f'<rect x="{ox}" y="{oy+p(TOP)}" width="{p(areaW)}" height="{p(RT)}" fill="#15171c" stroke="#3fb27b" stroke-dasharray="4 3"/>',
         f'<text x="{ox+12}" y="{oy+p(TOP)+p(RT)/2+4}" font-size="11" fill="#3fb27b">{L["rt"]}</text>',
         f'<rect x="{ox}" y="{oy+p(TOP+areaH-RB)}" width="{p(areaW)}" height="{p(RB)}" fill="#15171c" stroke="#3fb27b" stroke-dasharray="4 3"/>',
         f'<text x="{ox+12}" y="{oy+p(TOP+areaH-RB)+18}" font-size="11" fill="#3fb27b">{L["rb"]}</text>',
         f'<rect x="{ox+p(gx)}" y="{oy+p(gy)}" width="{p(gw)}" height="{p(gh)}" fill="#2b4f7e"/>',
         f'<text x="{ox+p(gx+gw/2)}" y="{oy+p(gy+gh/2)}" font-size="15" text-anchor="middle" font-weight="700" fill="#ffffff">{L["game"]}</text>',
         f'<text x="{ox+p(gx+gw/2)}" y="{oy+p(gy+gh/2)+22}" font-size="12" text-anchor="middle" fill="#dbe6f5">{gw}×{gh}</text>',
         f'<rect x="{ox+1}" y="{oy+p(TOP)+1}" width="{p(areaW)-2}" height="{p(areaH)-2}" fill="none" stroke="#f0b43a" stroke-width="2.5" stroke-dasharray="8 4"/>',
         f'<text x="{ox+p(areaW)-10}" y="{oy+p(TOP)+p(areaH)-p(RB)-8}" font-size="12" text-anchor="end" fill="#f0b43a">{L["ov"]}</text>']
    if gx > 4:
        b.append(f'<text x="{ox+p(gx)/2}" y="{oy+p(gy+gh/2)}" font-size="11" text-anchor="middle" fill="#a9a397">{L["lr"]}</text>')
    return svg(int(ox * 2 + p(W)), int(oy + p(H) + 30), "".join(b))


# ---- core/src/soul_core/decision/think.py
def think(lang):
    zh = lang == "zh"
    fast, slow, sure, bank_from = (1200.0, 2500.0), 4400.0, 0.95, 0.6
    tf, ta = 5000.0, 20000.0                      # 段位场常见 5+20
    base_cap = tf - 1500 - 420                    # hard_cap_ms(tf, 0, 1)
    bank = min(ta * 0.25, ta - 4000)
    cap_all = base_cap + bank
    W, H, X0, Y0, PW, PH = 780, 440, 70, 60, 660, 300
    YMAX = 9000
    title = "思考时间 vs 第一候选把握度（段位场 5+20 秒，不含 ±15% 随机）" if zh else "Think time vs. top-choice confidence (ranked 5+20 s, without ±15% jitter)"

    def target(top, close):
        if top >= sure:
            return None
        u = max(0.0, min(1.0, (sure - top) / (sure - 0.3)))
        if close:
            u = min(1.0, u + 0.15)
        t = fast[1] + u * (slow - fast[1])
        cap = base_cap
        if u >= bank_from:
            t += (u - bank_from) / (1 - bank_from) * (cap_all - base_cap)
            cap = cap_all
        return min(t, cap)

    xs = [0.3 + i * 0.0032 for i in range(204)]
    px = lambda v: X0 + (v - 0.3) / 0.7 * PW
    py = lambda ms: Y0 + PH - ms / YMAX * PH
    b = [f'<text x="{X0}" y="34" font-size="17" font-weight="700" fill="#1d1b17">{title}</text>',
         f'<rect x="{X0}" y="{Y0}" width="{PW}" height="{PH}" fill="#fbf9f4" stroke="#cfc8ba"/>']
    for ms in range(0, YMAX + 1, 1000):
        b.append(f'<line x1="{X0}" y1="{py(ms)}" x2="{X0+PW}" y2="{py(ms)}" stroke="#e4dfd4"/>')
        b.append(f'<text x="{X0-8}" y="{py(ms)+4}" font-size="11" text-anchor="end" fill="#6b665b">{ms/1000:g}s</text>')
    for v in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]:
        b.append(f'<text x="{px(v)}" y="{Y0+PH+18}" font-size="11" text-anchor="middle" fill="#6b665b">{int(v*100)}%</text>')
    b.append(f'<rect x="{px(sure)}" y="{py(fast[1])}" width="{px(1.0)-px(sure)}" height="{py(fast[0])-py(fast[1])}" fill="#3fb27b" fill-opacity="0.3" stroke="#3fb27b"/>')
    for close, col in [(False, "#2f6aa8"), (True, "#c93a22")]:
        pts = " ".join(f"{px(x):.1f},{py(target(x, close)):.1f}" for x in xs if target(x, close) is not None)
        b.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="3"/>')
    for cap, dash in [(base_cap, "6 4"), (cap_all, "2 4")]:
        b.append(f'<line x1="{X0}" y1="{py(cap)}" x2="{X0+PW}" y2="{py(cap)}" stroke="#b9810f" stroke-dasharray="{dash}" stroke-width="2"/>')
    lab = [("#2f6aa8", "前两名差距 ≥ 10%" if zh else "gap to #2 ≥ 10%"),
           ("#c93a22", "前两名差距 &lt; 10%（纠结度 +0.15）" if zh else "gap to #2 &lt; 10% (hesitation +0.15)"),
           ("#3fb27b", "把握 ≥ 95%：1.2–2.5 s 随机快出" if zh else "≥ 95% sure: fast 1.2–2.5 s"),
           ("#b9810f", (f"上限：基础 {base_cap/1000:.2f} s（虚线）/ 动用 25% 备用时间后 {cap_all/1000:.2f} s（点线）" if zh else f"caps: base {base_cap/1000:.2f} s (dashed) / with 25% bank {cap_all/1000:.2f} s (dotted)"))]
    for i, (c, s_) in enumerate(lab):
        y = Y0 + PH + 46 + i * 20
        b.append(f'<rect x="{X0}" y="{y-10}" width="18" height="6" fill="{c}"/><text x="{X0+26}" y="{y-2}" font-size="12" fill="#1d1b17">{s_}</text>')
    b.append(f'<text x="{X0+PW}" y="{Y0+PH+34}" font-size="11" text-anchor="end" fill="#6b665b">{"第一候选概率（softmax）→" if zh else "top-choice probability (softmax) →"}</text>')
    return svg(W, H + 70, "".join(b))


# ---- core/src/soul_core/protocol/liqi.py
def liqi(lang):
    zh = lang == "zh"
    W, H = 900, 330
    rows = [
        ("Notify", "#3fb27b", [("0x01", 1, "#e8f5ee"), ("BaseMessage { method_name, data }" if True else "", 9, "#f6f1e4")],
         "服务端主动推送（ActionPrototype 等）。内层 data 再经 9 字节密钥 XOR 混淆" if zh else "Server push (ActionPrototype …). Inner data is XOR-obfuscated with a 9-byte key"),
        ("Request", "#4f8fd0", [("0x02", 1, "#e6eef8"), ("index (u16 LE)", 2, "#e6eef8"), ("BaseMessage { method_name, data }", 7, "#f6f1e4")],
         "客户端请求。记下 index → 方法名，等待配对" if zh else "Client request. Remember index → method for pairing"),
        ("Response", "#f0b43a", [("0x03", 1, "#fbf1dc"), ("index (u16 LE)", 2, "#fbf1dc"), ("BaseMessage { data }", 7, "#f6f1e4")],
         "服务端响应。用 index 找回请求，从 liqi.json 查响应类型" if zh else "Server response. Pair by index, look up the response type in liqi.json"),
    ]
    b = [f'<text x="30" y="36" font-size="18" font-weight="700" fill="#1d1b17">{"雀魂 WebSocket 二进制帧（liqi 协议）" if zh else "Mahjong Soul WebSocket binary frame (liqi protocol)"}</text>']
    U = 70
    for r, (name, col, cells, desc) in enumerate(rows):
        y = 64 + r * 86
        b.append(f'<text x="30" y="{y+26}" font-size="15" font-weight="800" fill="{col}">{name}</text>')
        x = 130
        for label, w, fill in cells:
            b.append(f'<rect x="{x}" y="{y}" width="{w*U}" height="40" fill="{fill}" stroke="#1d1b17"/>')
            b.append(f'<text x="{x+w*U/2}" y="{y+25}" font-size="13" text-anchor="middle" fill="#1d1b17">{label}</text>')
            x += w * U
        b.append(f'<text x="130" y="{y+60}" font-size="12" fill="#6b665b">{desc}</text>')
    return svg(W, H, "".join(b))


for lang in ("zh", "en"):
    (OUT / f"coords.{lang}.svg").write_text(coords(lang), "utf-8")
    (OUT / f"layout.{lang}.svg").write_text(layout(lang), "utf-8")
    (OUT / f"think-time.{lang}.svg").write_text(think(lang), "utf-8")
    (OUT / f"liqi-frame.{lang}.svg").write_text(liqi(lang), "utf-8")
print("ok", sorted(p.name for p in OUT.glob("*.svg")))
