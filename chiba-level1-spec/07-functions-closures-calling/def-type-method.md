# `def Type.method(...)`

## 语法

该条目描述 method-style 定义在函数系统中的位置。

## 语义

它把顶层定义和 receiver shape 绑定起来，最终进入 method resolution 表。

## 边界

需要单独明确：

- `Type` 的结构性 receiver 表达力
- 与普通同名顶层函数的冲突
