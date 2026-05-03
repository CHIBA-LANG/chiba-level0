# Block Expression

## 语法

block expression 使用花括号包裹语句序列与尾表达式。

## 语义

它既是局部作用域，也是值表达式。

block 的值由其尾表达式决定；若没有尾表达式，则其值为 `()`。

block 内可混排 statement 与局部 item，但 item 仍服从 block 作用域，不提升为外层定义。

## Usage

```chiba
let x = {
	let a = 1
	let b = 2
	a + b
}
```

```chiba
let y = {
	write("side")
	()
}
```

注释：有尾表达式时 block 产出其值；没有尾表达式时，block 产出 `unit`。

## 边界

空 block 的值与类型都是 `()`；block 中的 item 不改变外层 namespace 与顶层可见性结构。
