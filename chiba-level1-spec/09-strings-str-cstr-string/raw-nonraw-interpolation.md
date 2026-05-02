# Raw / Non-Raw 与 Interpolation 的组合规则

## 语法

该条目描述 raw 标记、普通字符串与插值的组合语法。

## 语义

不同模式组合会改变 escape、插值与终止条件。

## Usage

```chiba
let name = "chiba"
let plain = "hello ${name}"
let raw_text = r#"hello ${name}"#
```

注释：`plain` 展示普通字符串允许插值，`raw_text` 则展示 raw 形式可以把 `${name}` 当作普通文本保留；若未来允许 raw interpolation，需要在此条明确新的组合规则。

## 边界

需要单独明确：

- raw string 是否完全禁止 interpolation
- prefix 参与时的优先顺序
