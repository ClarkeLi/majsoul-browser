"""子进程命令构造：源码运行用 ``python -m``，PyInstaller 冻结后用 ``<exe> <子命令>``。"""
import sys


def self_command(module: str, subcommand: str) -> list[str]:
    """module 如 'soul_core.inference.runner'，subcommand 如 'runner'。"""
    if getattr(sys, "frozen", False):
        return [sys.executable, subcommand]
    return [sys.executable, "-m", module]
