# Wildcard Pattern

## 语法

wildcard pattern 使用 `_`。

## 语义

它匹配任意值，但不引入绑定。

`_` 在 pattern 世界里始终表示 wildcard，而不是 variable。

因此：

- `_` 不会引入局部名字
- `_` 不能被读取
- `_` 也不应被解释成一个名为 `_` 的普通绑定变量

## Usage

```chiba
match pair {
	(x, _) => use(x)
}
```

注释：这里 `_` 只表示“这个位置匹配任意值但我不要绑定”，因此后续只能读取 `x`，不能读取 `_`。

## 边界

需要单独明确：

- `_` 在 `let`、`if let`、`match` 中是否完全同义
- 是否允许重复使用 `_` 而不触发冲突
