# `let`

## 语法

当前大纲至少包括：

- `let x = expr`
- `let x: T = expr`
- record destruct
- tuple destruct


`let` 允许部分 pattern 出现在左侧，例如：

- tuple destruct
- wildcard destruct

## 语义

level-1 的 `let` 不是默认 `let rec`。

`let` 在当前作用域引入新绑定。
`let` 的 shadowing 规则: 顺序shadow

若带类型标注，则初始化表达式需与标注类型兼容。

`let` 在 level-1 中只承担：

- 普通变量绑定
- tuple / record destruct

单纯为了丢弃表达式结果，不要求也不推荐写成 `let _ = expr`；应直接使用 expression statement。


destruct 会把右值分解为多个局部绑定，并要求右值形状与左侧 pattern 匹配。

`let` 不承担运行期匹配失败语义。

当前方向是：

- `let` 只允许进入其类型检查可先行证明为合法的 destruct 形式
- 因此合法的 `let` destruct 不会在运行期以“匹配失败”方式失败

level-1 的 `let` destruct 采用 DFT（depth-first destructuring）方向。

这意味着 `let` 左侧 pattern 可以递归进入 tuple 与 record 子结构，且语义上不设固定嵌套深度上限。

对 `let` 而言，限制点不在“是否允许深度递归”，而在“该 pattern 是否属于 `let` 允许的 destruct 语义范围”。

因此，level-1 的 `let` 不以 data constructor、literal pattern、字符串/数字字面量 pattern 作为首发 destruct 入口；这类 refutable 匹配交由 `if let` 与 `match`。


`let` 在 level-1 中支持 DFT destruct，嵌套深度任意。

也就是说，`let` 不再因为深度或 nested 组合而弱于 `match` / `if let` 的递归能力。

`let` 仍可与 `match` / `if let` 保持区别，但区别点应主要落在：

- destruct 域是否只限于 tuple / record
- 是否允许 refutable pattern
- 类型期能否先行证明 destruct 合法
- 是否要求 irrefutable binding

当前方向是：

- `let` 允许变量绑定、tuple destruct、record destruct，以及其中递归嵌套的 wildcard / at pattern / var pattern
- `let` 不把 data constructor、字符串字面量、数字字面量等 refutable pattern 作为首发 destruct 入口
- 合法 `let` 不存在运行期“匹配失败”；不合法形式应在类型期直接拒绝

## Usage

```chiba
let x = 1
let y: i32 = x + 1
let (a, b) = pair
let { name, age } = user
```

注释：`let` 负责普通绑定与 tuple/record destruct；它不承担 refutable pattern 的运行期匹配职责。

