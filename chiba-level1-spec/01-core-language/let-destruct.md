# `let` Destruct

## 语法

`let` destruct 支持 tuple / record destruct，以及它们的递归嵌套组合。

## 语义

level-1 的 `let` destruct 只接纳可在类型期证明为合法的 irrefutable destruct 形式。

constructor pattern、literal pattern 等 refutable pattern 不进入 `let` destruct；它们由 `if let` 与 `match` 承担。

## Usage

```chiba
let (x, (y, z)) = triple
let { point: { x, y }, color } = shape
```

注释：`let` destruct 允许任意深度的 tuple/record DFT destruct，但不把 refutable pattern 当作首发能力。

## 边界

`let` destruct 的约束点在“是否属于允许的 destruct 域”，而不是嵌套深度。
