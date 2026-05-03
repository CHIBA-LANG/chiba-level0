# Tuple Literal

## 语法

tuple literal 使用圆括号包裹多个元素。

## 语义

它产生固定元数、固定顺序的值组合。

tuple literal 的元素顺序具有语义意义；`(a, b)` 与 `(b, a)` 不是同一值。

单元素 tuple 也属于 tuple literal，只是必须写成 `(a,)`。

## Usage

```chiba
let p = (1, 2)
let q = (name, age)
let r = (x,)
```

注释：tuple literal 与 call argument list 共用圆括号外形，但在没有 callee 的表达式位置，`(a, b)` 按 tuple 解析。

## 边界

单元素 tuple 与 grouped expr 通过尾随逗号区分；调用参数列表只有在已有 callee 时才成立，不单独构成值表达式。
