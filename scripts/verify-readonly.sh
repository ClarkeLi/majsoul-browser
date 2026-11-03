#!/usr/bin/env bash
# 只读守护：任何写协议/改网络的代码都不允许出现在 apps/ 与 core/ 里。
set -u
cd "$(dirname "$0")/.."
fail=0
dirs=()
for d in apps core; do [ -d "$d" ] && dirs+=("$d"); done
[ ${#dirs[@]} -eq 0 ] && { echo "no apps/core"; exit 0; }
EXCL=(--glob '!**/.venv/**' --glob '!**/node_modules/**')

if rg -n "inject\.websocket|message\.drop\(|ssl_insecure|Network\.(setRequestInterception|continueInterceptedRequest)|Fetch\.|Runtime\.evaluate|\.send\(.*WebSocket" "${EXCL[@]}" "${dirs[@]}"; then
  echo "FAIL: 发现写协议/改网络相关代码"; fail=1
fi
# inputOperation / inputChiPengGang 只允许在 core/protocol（只读解析）和测试里
if rg -n "inputOperation|inputChiPengGang" "${EXCL[@]}" \
     --glob '!core/src/soul_core/protocol/**' --glob '!**/tests/**' "${dirs[@]}"; then
  echo "FAIL: 协议写入字样出现在 protocol/ 与测试之外"; fail=1
fi
[ $fail -eq 0 ] && echo "verify-readonly: OK"
exit $fail
