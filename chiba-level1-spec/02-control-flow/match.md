# `match`

## 语法

`match expr { ... }` 由被匹配表达式与若干 pattern arm 构成。

## 语义

`match` 是表达式，各 arm 结果类型需要统一。

它是 level-1 主要的多分支模式匹配结构。

level-1 的 `match` 支持 DFT（depth-first destructuring）pattern。

这意味着在 `match` arm 中，pattern 可以沿 tuple、constructor、record 等结构继续向内递归，且首发不人为限制嵌套深度。

与 `let` 不同，`match` 也是 level-1 中承载 data constructor pattern 与 literal pattern 的主要位置。

`match` arm 也支持 at pattern：

```chiba
name @ pattern
```

用于在匹配子结构的同时，把完整匹配值以前绑定名保留下来。

因此，下面这类多层 pattern 在 level-1 `match` 中应视为合法方向：

```chiba
match value {
	Foo(Bar(x, Baz { y: Qux(z) })) => ...
	head @ Foo(inner) => ...
	_ => ...
}
```

这里的“深度任意”表示语义上不设固定层数上限；实现可受常规编译资源限制，但语言规范不设专门的浅层限制。

## Usage

```chiba
let result = match expr {
	Some(x) => x
	None => 0
}
```

注释：这是最基本的 constructor match；所有 arm 一起决定整个 `match` 的结果类型。

```chiba
let result = match expr {
	whole @ Foo(Bar(x), { y, z: Baz }) => use4(whole, x, y, Baz)
	_ => fallback()
}
```

注释：第二个例子展示 level-1 `match` 允许深层 destructuring，并支持 `name @ pattern` 在匹配成功时保留完整值。

## 边界

需要单独明确：

- arm 语法
- guard 与 or-pattern 的接入方式
- exhaustiveness 是否在 level-1 首发强制检查
- DFT pattern 对错误信息与 lowering 的要求
