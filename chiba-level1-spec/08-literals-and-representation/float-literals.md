# Float Literal

## 语法

该条目描述未来浮点字面量的词法和后缀。

## 语义

浮点字面量需要独立于整数的默认推断与常量语义。

level-1 保留 float literal 作为正式 surface 的一部分；它不与整数 literal 共用同一默认类型推断故事。

## Usage

```chiba
let x = 1.0
let y = 6.02e23
let z = 3.14f32
```

注释：十进制小数、科学计数法与显式后缀都属于 float literal 路线，而不是整数 literal 的变体。

## 边界

十进制与科学计数法都进入 float literal；默认浮点类型与后缀细则仍可继续细化，但不改变其作为独立 literal 类别的地位。
