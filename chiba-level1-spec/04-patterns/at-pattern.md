# At Pattern `name@pattern`

## 语法

at pattern 使用：

```chiba
name @ pattern
```

其中：

- `name` 是前绑定名
- `pattern` 是后续需要继续匹配的子 pattern

例如：

```chiba
head @ Foo(x)
node @ Bar(Baz(y))
whole @ { x: Some(v), y: z }
a @ B(c @ D(e))
```

## 语义

at pattern 先按右侧 `pattern` 做正常匹配。

若匹配成功，则：

- 按右侧子 pattern 引入其中的局部绑定
- 同时把整个被匹配值以前绑定名 `name` 绑定到当前作用域

因此：

```chiba
whole @ Foo(x)
```

的语义是：

- 值必须匹配 `Foo(x)`
- `x` 绑定到内部字段
- `whole` 绑定到完整的原始匹配值

at pattern 不改变原有 pattern 的匹配成功条件，它只在成功后额外引入“整个值”的别名绑定。

level-1 对 at pattern 采用下面两条硬规则：

- 同一 pattern 内不允许重复绑定同名变量
- 不允许同一位置连续写成链式 at pattern

因此下面这些形式都应视为不合法：

```chiba
x @ Foo(x)
a @ b @ Foo(x)
```

第一种会在同一 pattern 中重复绑定 `x`；第二种会在同一 pattern 位置连续堆叠前绑定。

但嵌套 at pattern 仍然合法，只要它出现在右侧子 pattern 的更深层位置，例如：

```chiba
a @ B(c @ D(e))
```

这里外层 `a @ ...` 与内层 `c @ ...` 分属不同 pattern 层级，因此不属于被禁止的链式同位前绑定。

## Usage

```chiba
match expr {
	whole @ Foo(x) => use2(whole, x)
	_ => fallback()
}
```

注释：`whole @ Foo(x)` 先要求值匹配 `Foo(x)`，成功后再把整个匹配值绑定到 `whole`。

```chiba
match expr {
	a @ B(c @ D(e)) => use3(a, c, e)
	_ => fallback()
}
```

注释：第二个例子展示嵌套 at pattern 是合法的，因为内层 `c @ D(e)` 位于外层 `B(...)` 的子 pattern 内，而不是直接写成 `a @ c @ ...` 这种同位链式形式。

## 边界

需要单独明确：

- 重复绑定的诊断文本与报错位置
- `name` 是否允许带类型标注
- at pattern 在 `match` / `let` / `if let` / parameter 中的支持矩阵