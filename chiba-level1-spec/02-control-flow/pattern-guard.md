# Pattern Guard

## 语法

pattern guard 为 `match` arm 或其他 pattern 分支附加额外布尔条件。

## 语义

guard 只有在 pattern 本身匹配成功后才继续求值。

pattern guard 是 level-1 正式能力。

guard 中可见当前 arm 已绑定的 pattern 变量。

guard 不会把本来非穷尽的 `match` 变成穷尽；exhaustiveness 分析对带 guard 的 arm 保持保守。

## Usage

```chiba
match expr {
	Point(x, y) if x == y => on_diag(x)
	Point(x, y) => off_diag(x, y)
}
```

注释：guard 中可以使用 pattern 已经引入的 `x`、`y`，但 guard 的求值发生在 pattern 匹配成功之后。

## 边界

guard 只出现在已经完成 pattern match 的分支位置，不引入独立控制流语法。
