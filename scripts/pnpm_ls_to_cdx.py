"""把 `pnpm ls --prod --depth Infinity --json` 转成 CycloneDX 1.5。用法：pnpm ls ... | python3 pnpm_ls_to_cdx.py"""
import json
import sys
from urllib.parse import quote

tree = json.load(sys.stdin)[0]
seen: set[tuple[str, str]] = set()


def walk(deps):
    for name, d in (deps or {}).items():
        seen.add((name, d["version"]))
        walk(d.get("dependencies"))


walk(tree.get("dependencies"))
comps = [{"type": "library", "name": n, "version": v, "purl": f"pkg:npm/{quote(n, safe='/')}@{v}"} for n, v in sorted(seen)]
json.dump({"bomFormat": "CycloneDX", "specVersion": "1.5", "version": 1,
           "metadata": {"component": {"type": "application", "name": "majsoul-browser-desktop", "version": tree["version"]}},
           "components": comps}, sys.stdout, indent=2, ensure_ascii=False)
