# Pattern 支持矩阵

## 语法

该条目不新增 surface syntax，而是汇总 pattern 在不同位置的合法集合：

- `match`
- `if let`
- `let`
- function parameter

## 语义

level-1 不必要求所有位置共享完全相同的 pattern 能力。

当前方向应明确区分：

- `match`：支持 DFT pattern，嵌套深度任意
- `let`：支持 tuple / record destruct 的 DFT pattern，嵌套深度任意
- `if let`：支持 DFT pattern，嵌套深度任意
- function parameter：不因 `match` / `let` / `if let` 支持 DFT 就自动获得同等能力

在当前方向下，`name @ pattern` 的 at pattern 至少进入：

- `match`
- `let`
- `if let`
- `else if let`

嵌套 at pattern 也属于合法组合；被禁止的只有同一位置连续出现的链式写法，例如 `a @ b @ Foo(x)`。

## Usage

```chiba
match expr {
	Foo(x) => use(x)
	_ => fallback()
}

if let whole @ Foo(x) = expr {
	use2(whole, x)
} else {
	fallback()
}

match expr {
	a @ B(c @ D(e)) => use3(a, c, e)
	_ => fallback()
}

let { x, y } = point
```

注释：这一组例子并列展示矩阵中的三个典型位置：`match` 支持 refutable pattern 与嵌套 at pattern，`if let` 支持 refutable pattern 加 at pattern，`let` 则只展示 tuple/record destruct 一类 irrefutable 子集。

## 边界

需要单独明确：

- 哪些位置先只支持 irrefutable pattern
- function parameter 等其他位置是否首发不支持 record / nested pattern，或只支持受限深度
- `let` 是否明确排除 constructor / literal pattern
