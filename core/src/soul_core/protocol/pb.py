"""动态加载 liqi.desc，按消息名暴露 protobuf 类（等价于旧的 liqi_pb2）。

用法：``from soul_core.protocol import pb`` 之后 ``pb.ActionNewRound``、``pb.get("ResSyncGame")``。
数据文件相对本包定位，不依赖当前工作目录。
"""
from importlib import resources

from google.protobuf import descriptor_pb2, descriptor_pool, message_factory

_pool = descriptor_pool.DescriptorPool()
_classes: dict[str, type] = {}


def _load() -> None:
    fds = descriptor_pb2.FileDescriptorSet()
    fds.ParseFromString(resources.files(__package__).joinpath("data/liqi.desc").read_bytes())
    for file in fds.file:
        _pool.Add(file)
    for file in fds.file:
        for message in file.message_type:
            full = f"{file.package}.{message.name}"
            _classes[message.name] = message_factory.GetMessageClass(
                _pool.FindMessageTypeByName(full)
            )


_load()


def get(name: str):
    """按短名取消息类；不存在返回 None。"""
    return _classes.get(name)


def __getattr__(name: str):
    try:
        return _classes[name]
    except KeyError:
        raise AttributeError(name) from None
