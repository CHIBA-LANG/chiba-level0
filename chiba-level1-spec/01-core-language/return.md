# `return`

## 语法

`return` 用于提前从当前函数或 closure 返回。

## 语义

`return` 是显式 escape 点。

由于普通函数与 closure 调用蕴含隐式 `reset`，`return` 同时具有：

- 控制流离开当前调用边界
- 值跨出当前局部 arena 的潜在提升需求

从统一控制语义上看，当前函数体默认就处于自己的 `reset` 边界中。

因此，`return value` 可理解为对当前函数边界 continuation 执行一次“带值恢复”，也就是：

```text
return value  ~=  k(value)
```

在这种统一语义下，level-1 不提供空 `return`。

即使返回 `unit`，也必须显式写成：

```chiba
return ()
```

## Usage

```chiba
def abs(x: i32): i32 = {
	if x >= 0 {
		return x
	} else {
		return -x
	}
}
```

注释：`return` 必须显式携带值；哪怕返回 `unit` 也写 `return ()`。

## 边界

`return` 只作用于最近的函数式调用边界；其返回值同时受 answer type 与 memory legality 约束。
