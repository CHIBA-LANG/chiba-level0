# Trailing Closure

## 语法

当函数调用的最后一个实参是 lambda 时，允许把该 lambda 从调用括号中移出，直接写在调用之后。

这是一种仅在 call-site 出现的专用语法糖，而不是通用 standalone lambda 语法。

例如：

```chiba
fileops(path) {|file|
  body
}

map(xs) {|x|
  x + 1
}
```

其语义分别等价于：

```chiba
fileops(path, (file: File): Unit => {
  body
})

map(xs, (x: T): U => {
  x + 1
})
```

首发规则：

- 只允许一个 trailing closure
- 只允许附着到最近的 call expression
- 只允许附着到已经由 `(...)` 明确闭合的 call expression；不允许附着到裸 callee、field access、variable reference 或其他非调用表达式后面
- 只有在 call 之后，`{|args| body }` 才作为 trailing closure 入口尝试解析
- `|...|` 是 trailing closure 的参数头锚点；`{|` 一旦出现，就不再进入 record update 分支
- trailing closure 入口要求 `{|` 后先读到 parameter binder 列表，并由成对的 `|...|` 结束参数头
- 脱离 call-site 后，`{|args| body }` 不构成默认 lambda 表达式
- trailing closure 的 `body` 首发总按 block 解析，而不是按单表达式解析
- call expression 与 trailing closure 之间不允许通过行结束继续粘连；若 call 后已出现 `;`、`\n` 或 `\r\n`，则该 call 已经终止，后续 `{|args| body }` 不再视为 trailing closure

为降低歧义，level-1 首发进一步限制 trailing closure 的 parameter header：

- 允许空参数：`f() {||
  body
}`
- 允许单个 binder：`f() {|x|
  body
}`
- 多参数时允许普通 binder 列表：`f() {|x, y|
  body
}`
- 若需要类型，写成：`f() {|x: Tx, y: Ty|
  body
}`

因此，trailing closure 的歧义解法不是限制无类型多参数，而是把参数头固定成 `|...|` 这一独立锚点。

## 语义

trailing closure 是纯表面语法糖。

它不改变：

- 参数求值顺序
- closure capture 规则
- 调用的隐式 `reset`
- 最后一个参数的类型检查方式

因此：

```chiba
f(a) {|x|
  body
}
```

可以视为单个调用表达式；而：

```chiba
f(a)
{|x|
  body
}
```

在 level-1 中应先于行结束终止前一个 statement，后续大括号不再自动并入前一个 call。

它的主要作用是为 callback-heavy 场景提供更紧凑的调用表面，例如 iter、async、RAII use-site。

## 边界

与 method call / pipe 的更细优先级仍可继续细化；但大括号入口歧义在 level-1 先按“显式闭合 call 优先，且 trailing closure 必须以 `{|` 起手”处理。