#!/usr/bin/env bash
# 一条命令打出当前平台的发布包：冻结 Core → 构建前端 → electron-builder → <仓库>/release/
#
# 用法：scripts/package.sh mac-arm64 | mac-x64 | win | linux
#   mac-x64 可以在 Apple Silicon 上构建（Rosetta 2）；win / linux 必须在对应系统上构建
#   （PyInstaller 不能交叉编译）。也可以用 GitHub Actions 的 release 工作流一次打出四个平台。
set -euo pipefail
R="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$R/.toolchain/env.sh" ] && source "$R/.toolchain/env.sh"
T="${1:?用法：scripts/package.sh mac-arm64|mac-x64|win|linux}"
case "$T" in
  mac-x64) if [ "$(uname -m)" = x86_64 ]; then "$R/scripts/build-core.sh"; else "$R/scripts/build-core.sh" --mac-x64; fi ;;
  mac-arm64|win|linux) "$R/scripts/build-core.sh" ;;
  *) echo "未知目标：$T" >&2; exit 2 ;;
esac
cd "$R/apps/desktop"
pnpm install --frozen-lockfile
pnpm "package:$T"
ls -lh "$R/release" | grep -E '\.(zip|AppImage|tar\.gz)$' || true
