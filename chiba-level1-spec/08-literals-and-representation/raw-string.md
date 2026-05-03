# Raw String

## 语法

raw string 通过 `#` 或同类标记关闭普通 escape 解释。

## 语义

raw string 保留字面文本内容，不做常规转义处理。

level-1 采用 `r` 前缀表示 raw string。

raw string 可与 `#` 组合以容纳更自由的引号内容；非 `r` 字符串也允许通过 `#` 参与更宽松的 multiline / delimiter 方案。

这一方向接近 docsend 风格的“带 delimiter 的字符串 surface”，但 raw 与 non-raw 仍保持区分：是否禁用普通转义，由 `r` 决定。

## Usage

```chiba
let a = r"\\n"
let b = r#"say "hi""#
let c = r##"
multi line
"##
```

注释：`r` 决定 raw 语义；`#` 决定 delimiter 容量。非 `r` 的带 `#` 字符串仍可保留 interpolation / 普通文本规则。

## 边界

raw string 可与 multiline 组合；是否做 interpolation 由是否为 raw 决定，raw 默认不做普通 interpolation。
