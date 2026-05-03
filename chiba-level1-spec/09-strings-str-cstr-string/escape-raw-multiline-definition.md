# 字符串 Escape / Raw String / Multiline String 的正式定义

## 语法

该条目描述字符串词法最核心的正式规则。

## 语义

它定义哪些字符被解释、哪些被保留，以及字符串如何终止。

## Usage

```chiba
let escaped = "line1\nline2"
let raw = r#"line1\nline2"#
let multi = "first line
second line"
```

注释：`escaped` 中的 `\n` 参与 escape 解释，`raw` 保留反斜杠文本，`multi` 展示普通字符串也可以跨行但仍受普通字符串规则约束。

## 边界

需要单独明确：

- raw 与非 raw 的差异
- multiline 终止符与缩进策略
