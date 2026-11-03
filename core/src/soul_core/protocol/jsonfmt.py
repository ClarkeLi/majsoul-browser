"""MessageToDict 的统一封装：保留字段名、输出默认值（兼容 protobuf 4–7）。"""
from google.protobuf.json_format import MessageToDict


def to_dict(msg) -> dict:
    try:
        return MessageToDict(msg, preserving_proto_field_name=True,
                             always_print_fields_with_no_presence=True)
    except TypeError:  # protobuf < 5
        return MessageToDict(msg, preserving_proto_field_name=True,
                             including_default_value_fields=True)
