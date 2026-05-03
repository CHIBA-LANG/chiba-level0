# Interpolation / Format String

## 语法

该条目描述字符串插值与格式字符串表面语法。

## 语义

在当前方向下，字符串字面量会走 handler / desugar 路线，因此 interpolation 更适合作为字符串协议的一部分，而不是单独 runtime 特判。

## 边界

需要单独明确：

- 插值表达式的边界
- raw string 与 interpolation 是否可组合
