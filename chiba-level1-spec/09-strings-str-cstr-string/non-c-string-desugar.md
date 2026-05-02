# 除 `c""` 外的字符串字面量 Desugar 为函数调用

## 语法

该条目描述普通字符串字面量的 desugar 方向。

## 语义

除 `c""` 外，普通字符串字面量不直接绑定 `mk_str` 一类硬编码入口，而是走 handler / method / protocol 路线。

## Usage

```chiba
let a = "plain text"
let b = html"<b>safe</b>"
```

注释：`a` 走普通字符串字面量处理路径，`b` 则展示 prefix handler 可以接管非 `c""` 字面量的 desugar 结果。

## 边界

需要单独明确：

- desugar 发生在 parser 后还是 typecheck 中
- 与 prefix handler 的组合顺序
