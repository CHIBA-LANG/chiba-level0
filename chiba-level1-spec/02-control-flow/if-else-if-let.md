# `if else if let`

## 语法

`else if` 分支允许直接引入 `if let` 形式。

## 语义

这允许在条件链中混合布尔条件与 pattern-based 条件。

当 `else if` 分支使用 `if let` 时，也继承 `if let` 的 DFT pattern 与 at pattern 能力。

例如：

```chiba
if cond {
	...
} else if let whole @ Foo(x) = expr {
	...
} else {
	...
}
```

这里 `whole @ Foo(x)` 的语义与普通 `if let` 中完全一致。

由于 `if let` 自身要求显式 `else`，因此条件链中的 `else if let` 也必须继续通向后续 `else if ...` 或最终 `else { ... }`，不能在成功分支外悬空结束。

## Usage

```chiba
if cond {
	use_a()
} else if let whole @ Foo(x) = expr {
	use_pair(whole, x)
} else {
	use_b()
}
```

注释：这个例子展示布尔条件和 pattern 条件可以出现在同一条条件链里，而 `whole @ Foo(x)` 的绑定只在命中的分支内可见。

## 边界

需要单独明确：

- `if let` 分支绑定的作用域
- 与普通 `else if` 的优先级和语义是否完全一致
- at pattern 绑定在条件链中的作用域边界
