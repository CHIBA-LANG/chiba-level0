# `if let`

## 语法

`if let pattern = expr { ... } else { ... }`

## 语义

`if let` 通过 pattern 匹配决定是否进入成功分支，并在成功分支中引入绑定。

level-1 的 `if let` 支持 DFT（depth-first destructuring）pattern。

这意味着 `if let` 中的 pattern 可以沿 tuple、constructor、record 等结构继续向内递归，且首发不人为限制嵌套深度。

因此，`if let` 与 `match` 在 nested pattern 的深度能力上保持一致。

与 `let` 不同，`if let` 也承担 data constructor pattern 与 literal pattern 的 refutable 匹配职责。

`if let` 也支持 at pattern：

```chiba
if let whole @ Foo(x) = expr { ... } else { ... }
```

其作用是在匹配 `Foo(x)` 成功时，同时把完整匹配值绑定为 `whole`。

level-1 的 `if let` 与普通 `if` 一样，要求显式 `else` 分支。

## Usage

```chiba
if let Some(x) = value {
	use(x)
} else {
	use_default()
}
```

注释：这是最基本的 refutable pattern 条件，成功时引入 `x`，失败时进入显式 `else`。

```chiba
if let whole @ Foo(Bar(x), y) = expr {
	use3(whole, x, y)
} else {
	use_default()
}
```

注释：第二个例子展示 `if let` 支持 DFT 递归 pattern，并且可以用 at pattern 保留整个匹配值。

## 边界

需要单独明确：

- irrefutable / refutable pattern 的职责边界
- 失败分支是否允许写成专门的简写形式
- 与 `match` 的职责边界
