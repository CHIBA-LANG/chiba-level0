# 返回值不能引用 Callee 局部 Arena

## 语法

该条目描述 legality 规则，不新增语法。

## 语义

函数返回值不得保留对已经失效的 callee 局部 arena 数据的悬空引用。

## 边界

需要单独明确：

- 何时视为间接引用 callee arena
- caller region promotion 是否足以修复
