# Block Expression

## 语法

block 使用花括号包裹语句与尾表达式。

## 语义

block 是表达式，因此它产生一个值。

`{}` == `()` 的值为 `unit` 类型

block 内部同时承担：

- 局部作用域
- 语句序列
- 尾表达式返回值

在 level-1 中，block 内若只想求值并丢弃结果，可直接写 expression statement；不再要求以 `let _ = expr` 作为显式丢弃值的主要写法。

## Usage

```chiba
let x = {
	let a = 1
	let b = 2
	a + b
}

{
	write(x)
	()
}
```

注释：block 同时承担局部作用域、语句序列和尾表达式值；空 block 与显式 `()` 都产出 unit。

## 边界

block 是表达式入口，不与 record literal、record update 或 trailing closure 混淆；这些分支由各自的语法锚点区分。
