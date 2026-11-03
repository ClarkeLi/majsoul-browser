"""客户端发出的操作请求（只读识别用）：用来确认“点击已被游戏消费”，以及识别用户手动操作。

注意：这里只做**识别**，绝不构造或发送这些请求。
"""
OPERATION_METHODS = frozenset({
    ".lq.FastTest.inputOperation",
    ".lq.FastTest.inputChiPengGang",
})
