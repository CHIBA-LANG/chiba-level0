# 1-Tuple Literal `(a,)`

## 语法

单元素 tuple 通过尾随逗号与 grouped expr 区分。

## 语义

`(a,)` 是一元 tuple，而不是分组表达式。

一元 tuple 与多元 tuple 属于同一 tuple literal 体系；尾随逗号是它与 grouped expr 的决定性区分标记。

## Usage

```chiba
let t = (1,)
let u = (name,)
```

注释：没有尾随逗号就是 grouped expr；有尾随逗号就是 1-tuple。

## 边界

parser 先按 tuple / grouped expr 的逗号规则判定；只有满足 lambda 入口时，`(...)` 才转入 lambda 参数列表解析。
