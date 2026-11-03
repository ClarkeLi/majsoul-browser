"""maturin 把扩展放在 libriichi.libriichi，而 Mortal 的代码期望 ``from libriichi.consts import ...``。
这里把子模块别名到包顶层，保持与官方 libriichi.so 相同的导入路径。"""
import sys as _sys

from . import libriichi as _ext
from .libriichi import *  # noqa: F401,F403

for _n in ("consts", "state", "dataset", "arena", "stat", "mjai"):
    _m = getattr(_ext, _n)
    globals()[_n] = _m
    _sys.modules[f"{__name__}.{_n}"] = _m
__version__ = _ext.__version__
