#!/usr/bin/env bash
# 生成 SBOM（CycloneDX 1.5）：core（uv export）与 desktop（pnpm ls → CycloneDX）。输出到 docs/sbom/
set -euo pipefail
R="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$R/.toolchain/env.sh" ] && source "$R/.toolchain/env.sh"
mkdir -p "$R/docs/sbom"
(cd "$R/core" && uv export --format cyclonedx1.5 --no-hashes -o "$R/docs/sbom/core.cdx.json" >/dev/null)
(cd "$R/apps/desktop" && pnpm ls --prod --depth Infinity --json) | python3 "$R/scripts/pnpm_ls_to_cdx.py" > "$R/docs/sbom/desktop.cdx.json"
for f in core desktop; do
  echo "SBOM $f: $(python3 -c "import json;print(len(json.load(open('$R/docs/sbom/$f.cdx.json'))['components']))") 个组件"
done
