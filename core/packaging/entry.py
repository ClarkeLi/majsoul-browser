"""PyInstaller 入口：冻结后的 soul-core 可执行文件。"""
import sys

from soul_core.main import entry

if __name__ == "__main__":
    sys.exit(entry())
