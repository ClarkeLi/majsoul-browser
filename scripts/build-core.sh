#!/usr/bin/env bash
# 冻结 Python Core（PyInstaller one-dir）→ <仓库>/dist/soul-core/
#
# 用法：
#   scripts/build-core.sh                 # 本机架构
#   scripts/build-core.sh --mac-x64       # 在 Apple Silicon 上构建 Intel 版（需要 Rosetta 2 与 rustup target x86_64-apple-darwin）
#
# 需要：uv、Rust 工具链（从 vendor/mortal/libriichi 源码构建 libriichi）。
# 可选：.toolchain/env.sh（不进 Git）里放你自己的缓存目录等环境变量，存在时会自动加载。
set -euo pipefail
R="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$R/.toolchain/env.sh" ] && source "$R/.toolchain/env.sh"

MAC_X64=0
[ "${1:-}" = "--mac-x64" ] && MAC_X64=1

cd "$R/core"
if [ "$MAC_X64" = 1 ]; then
  # 独立的 x86_64 虚拟环境；libriichi 交叉编译到 x86_64，torch 等用 x86_64 轮子
  export UV_PROJECT_ENVIRONMENT="$R/core/.venv-x86_64"
  export CARGO_BUILD_TARGET=x86_64-apple-darwin
  export ARCHFLAGS="-arch x86_64"
  PY="cpython-3.12-macos-x86_64-none"
  rustup target add x86_64-apple-darwin >/dev/null 2>&1 || true
  uv sync --frozen --python "$PY"
  RUN=(arch -x86_64 "$UV_PROJECT_ENVIRONMENT/bin/python")
else
  # Apple Silicon 上明确要 arm64 的 Python：机器上同时装着 x86_64 版（构建 Intel 包用）时 uv 可能挑错
  if [ "$(uname -s)" = Darwin ] && [ "$(uname -m)" = arm64 ]; then export UV_PYTHON=cpython-3.12-macos-aarch64-none; fi
  uv sync --frozen
  RUN=(uv run --frozen python)
fi

rm -rf "$R/dist/soul-core"
"${RUN[@]}" -m PyInstaller --noconfirm --clean --onedir --name soul-core \
  --paths src --collect-data soul_core --collect-submodules soul_core \
  --collect-all libriichi \
  --exclude-module tkinter --exclude-module matplotlib --exclude-module IPython --exclude-module pytest \
  --exclude-module tensorboard --exclude-module torch.utils.tensorboard \
  --distpath "$R/dist" --workpath "$R/build/pyinstaller" --specpath "$R/build/pyinstaller" \
  packaging/entry.py
echo "Core → $R/dist/soul-core"
