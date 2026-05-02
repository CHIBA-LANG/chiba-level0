# `return` 作为 Escape 点

## 语法

该条目描述 `return` 的内存和类型后果。

## 语义

`return` 会把某个值带出当前函数对应的隐式 `reset`，因此是典型 escape 点。

## 边界

需要单独明确：

- 返回 `Ref[T]`、continuation、closure 时的附加规则
