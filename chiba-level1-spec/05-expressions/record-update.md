# Record Update

## 语法

当前方向复用既有语法：

```chiba
{base | field: value}
```

record update 只在普通表达式位置尝试进入；若某个已经由 `(...)` 闭合的 call expression 紧跟 `{ ... }`，则 parser 先尝试 trailing closure 分支。

反过来，一旦 parser 已经进入 record update 分支，则 `|` 右侧必须按字段更新列表解析，而不是再回退成 trailing closure body。

## 语义

它从 `base` 派生新 record 值，并覆写或扩展字段。

多行 record update 可以在未闭合的 `{` `}` 内部跨行继续；行结束不会在 update 内部自动终止表达式。

level-1 允许 record update 引入新字段；因此它既可以覆写已有字段，也可以在 row 语义允许时扩展记录。

## Usage

```chiba
let p = { x: 1, y: 2 }
let q = {p | y: 3}
let r = {p | z: 4}
```

注释：`q` 展示覆写，`r` 展示扩展；是否允许扩展由 record update 的语言承诺直接给出，而不是留给实现自由决定。

## 边界

record update 允许引入新字段；更细的 row polymorphism 类型表示可继续在类型层文档展开，但不改变其表面语义。

为避免与 trailing closure 混淆，record update 的 `|` 右侧首发要求满足 `field: value` 更新项形态，而不是任意 block body。
