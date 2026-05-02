# `extern "c"`

## 语法

`extern "c"` 声明使用 C ABI 的外部函数或定义。

## 语义

它把语言内的调用约定与 C ABI 对齐。

## 边界

需要单独明确：

- 参数与返回值类型限制
- layout 与 `cstr` / `Ptr[T]` / `CBI` 的关系
