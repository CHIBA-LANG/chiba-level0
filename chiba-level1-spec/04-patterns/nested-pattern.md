# Nested Pattern

## 语法

nested pattern 表示 pattern 内继续包含多层子 pattern。

## 语义

它允许一次匹配同时解构多层数据。

在 level-1 中，`match` 位置的 nested pattern 采用 DFT（depth-first destructuring）方向。

其含义是：

- pattern 可以继续向 tuple、constructor、record 等子结构递归
- 语言规范不对 `match` 中的嵌套深度设置固定上限
- 任意深度的 nested pattern 应在 `match` 中被视为同一套 pattern 语义的递归展开

at pattern：

```chiba
name @ pattern
```

也属于这套递归 pattern 语义的一部分，可出现在 nested pattern 的任意层级，用于保留当前层的整体绑定。

这不自动推出 `let`、`if let`、function parameter 等其他位置也支持同等深度与同等组合能力。

## Usage

```chiba
match value {
	Foo(Bar(x), { y: Baz(z) }) => use2(x, z)
	_ => fallback()
}
```

注释：这个例子展示 nested pattern 可以在 constructor 和 record 之间继续向内递归，不需要在一层后停下。

## 边界

需要单独明确：

- `match` 之外的位置是否收紧嵌套深度或组合种类
- nested pattern 对 exhaustiveness 的影响
- at pattern 对绑定重复检查与错误信息的影响
