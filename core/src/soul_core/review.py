"""复盘：由对局记录计算一致率与 q 值损失。"""
from __future__ import annotations

import json
from pathlib import Path

_SELF_ACTIONS = {"dahai", "chi", "pon", "daiminkan", "ankan", "kakan", "reach", "hora", "ryukyoku"}
_REC_TO_MJAI = {"discard": "dahai", "riichi": "reach", "chi": "chi", "pon": "pon", "daiminkan": "daiminkan",
                "ankan": "ankan", "kakan": "kakan", "tsumo": "hora", "ron": "hora", "kyuushu": "ryukyoku", "pass": "none"}


def load(path: str | Path) -> list[dict]:
    return [json.loads(l) for l in Path(path).read_text(encoding="utf-8").splitlines() if l.strip()]


def decisions(rows: list[dict]) -> list[dict]:
    """逐个决策点：推荐 vs 你的实际动作，附 q 值损失。"""
    seat = next((r["seat"] for r in rows if r["k"] == "start"), None)
    out = []
    for i, r in enumerate(rows):
        if r["k"] != "rec":
            continue
        rec, alts = r["rec"], r["alts_all"]
        # 一致率对照模型第一名：风格（掷骰 / 爱赌）改过的推荐用模型原本的选择
        st = rec.get("style") or {}
        kind, tile = (st.get("model_kind"), st.get("model_tile")) if st.get("model_kind") else (rec.get("kind"), rec.get("tile"))
        want = _REC_TO_MJAI.get(kind, "none")
        actual = None
        for nxt in rows[i + 1:]:
            if nxt["k"] == "rec":
                actual = {"type": "none"}          # 下一个推荐出现前你没有行动 = 过
                break
            if nxt["k"] != "event":
                continue
            ev = nxt["ev"]
            if ev.get("actor") == seat and ev.get("type") in _SELF_ACTIONS:
                actual = ev
                break
            if ev.get("type") in ("end_kyoku", "end_game") or (ev.get("type") == "tsumo" and ev.get("actor") != seat and want != "dahai"):
                actual = {"type": "none"}
                break
        if actual is None:
            continue
        same = actual.get("type") == want and (want != "dahai" or actual.get("pai") == tile)
        qmap = {a["id"]: a["q"] for a in alts}
        loss = None
        if actual.get("type") == "dahai" and alts:
            qa = qmap.get(actual["pai"]) if actual["pai"] in qmap else qmap.get(actual["pai"].replace("r", "") + "r")
            loss = round(max(qmap.values()) - qa, 4) if qa is not None else None
        out.append({"rev": r["rev"], "kind": kind, "tile": tile, "style": st.get("kind"), "confidence": rec.get("confidence"),
                    "actual": actual.get("pai") or actual.get("type"), "agree": same, "q_loss": loss,
                    "latency_ms": rec.get("latency_ms")})
    return out


def summarize(path: str | Path) -> dict:
    rows = load(path)
    ds = decisions(rows)
    judged = len(ds)
    agree = sum(1 for d in ds if d["agree"])
    losses = sorted((d for d in ds if d["q_loss"]), key=lambda d: -d["q_loss"])
    start = next((r for r in rows if r["k"] == "start"), {})
    return {"file": Path(path).name, "uuid": start.get("uuid"), "started": start.get("t"), "decisions": judged,
            "agree": agree, "agree_rate": round(agree / judged, 4) if judged else None,
            "total_q_loss": round(sum(d["q_loss"] or 0 for d in ds), 4), "top_mistakes": losses[:5], "items": ds}


def list_games(directory: str | Path) -> list[dict]:
    d = Path(directory)
    if not d.exists():
        return []
    out = []
    for p in sorted(d.glob("*.jsonl"), reverse=True):
        try:
            s = summarize(p)
            out.append({k: s[k] for k in ("file", "uuid", "started", "decisions", "agree", "agree_rate", "total_q_loss")})
        except Exception:  # noqa: BLE001 - 坏文件不影响列表
            continue
    return out


def _game_stats(rows: list[dict]) -> dict:
    seat = next((r["seat"] for r in rows if r["k"] == "start"), None)
    rounds, wins, deal_ins, riichi, called_rounds = set(), 0, 0, 0, set()
    cur = None
    for r in rows:
        if r["k"] != "event":
            continue
        ev = r["ev"]
        if ev["type"] == "start_kyoku":
            cur = (ev["bakaze"], ev["kyoku"], ev["honba"])
            rounds.add(cur)
        elif ev.get("actor") == seat:
            if ev["type"] == "hora":
                wins += 1
            elif ev["type"] == "reach":
                riichi += 1
            elif ev["type"] in ("chi", "pon", "daiminkan"):
                called_rounds.add(cur)
        if ev["type"] == "hora" and ev.get("target") == seat and ev.get("actor") != seat:
            deal_ins += 1
    rank = next((r["rank"] for r in rows if r["k"] == "result"), None)
    ds = decisions(rows)
    return {"rounds": len(rounds), "wins": wins, "deal_ins": deal_ins, "riichi": riichi, "called_rounds": len(called_rounds),
            "rank": rank, "agree": sum(1 for d in ds if d["agree"]), "judged": len(ds)}


def stats(directory: str | Path | None, limit: int = 20) -> dict:
    """汇总最近 limit 局：平均名次、和了率、放铳率、AI 一致率，以及趋势与分布。"""
    files = sorted(Path(directory).glob("*.jsonl")) if directory and Path(directory).exists() else []
    per = []
    for p in files[-limit:]:
        try:
            per.append(_game_stats(load(p)))
        except Exception:  # noqa: BLE001
            continue
    rounds = sum(g["rounds"] for g in per)
    ranks = [g["rank"] for g in per if g["rank"]]
    judged = sum(g["judged"] for g in per)
    div = lambda a, b: round(a / b, 4) if b else None
    return {
        "games": len(per),
        "avg_rank": round(sum(ranks) / len(ranks), 2) if ranks else None,
        "win_rate": div(sum(g["wins"] for g in per), rounds),
        "deal_in_rate": div(sum(g["deal_ins"] for g in per), rounds),
        "agree_rate": div(sum(g["agree"] for g in per), judged),
        "trend": {"agree": [div(g["agree"], g["judged"]) for g in per], "rank": [g["rank"] for g in per]},
        "dist": {"riichi": div(sum(g["riichi"] for g in per), rounds), "call": div(sum(g["called_rounds"] for g in per), rounds),
                 "win": div(sum(g["wins"] for g in per), rounds)},
    }
