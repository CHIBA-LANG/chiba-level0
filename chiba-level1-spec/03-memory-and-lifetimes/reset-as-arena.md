# `reset` 作为 Arena 边界

## 语法

该条目描述 `reset` 的内存语义，不新增语法。

## 语义

`reset` 不只是控制边界，也是天然 arena / region 边界；局部短命值默认优先属于当前 `reset`。

这条规则同时适用于显式 `reset` 与函数/closure 调用引入的隐式 `reset`。

离开当前 `reset` 后，仍试图保留对其局部 arena 值的引用属于不合法 escape，必须拒绝或触发提升。

## Usage

```chiba
let x = reset {
	let tmp = String.from("hello")
	return tmp
}
```

注释：`tmp` 起初属于当前 `reset`；若它要离开当前 arena，就必须经过 escape legality 与提升规则处理。

## 边界

显式与隐式 `reset` 共同构成 arena 边界栈；更细的嵌套优先级由同一套 escape 规则统一处理。
