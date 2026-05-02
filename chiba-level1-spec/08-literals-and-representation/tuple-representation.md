# Tuple Value Representation

## 语法

该条目不新增 surface syntax，描述 tuple 的值表示。

## 语义

tuple 是固定元数、固定顺序的聚合值；其运行时表示可与 record、ADT 或 asm 多输出语义关联。

tuple representation 必须保留元素顺序与固定元数信息；这使它既能支撑普通 tuple literal，也能支撑 asm 多输出与多返回值风格的值承载。

## Usage

```chiba
let p = (1, 2)
let (a, b) = p
```

注释：tuple representation 首先服务普通 tuple 值；asm 或多返回值只是在语言层复用同一 tuple 语义。

## 边界

小 tuple 的布局优化可由实现决定；但与 multi-return 的关系在语言层已固定为“复用同一 tuple 值语义”。
