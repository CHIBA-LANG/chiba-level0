# Delimited Continuation 的正式语义

## 语法

该条目讨论 `reset` / `shift` 的正式类型与 continuation 语义。

## 语义

level-1 首发至少需要 answer type checking。

本层只保留 delimited continuation 的最小正式语义：

- `reset` / `shift` 的 answer type checking
- continuation 捕获与恢复的基本合法性
- 与 arena / world / escape 规则的交叉约束

## Usage

```chiba
let result = reset {
	1 + shift k {
		k(41)
	}
}
```

注释：这里 `shift` 捕获的是“把结果再加上 1”的剩余控制上下文，因此 continuation 不是普通闭包语法糖，而是受 `reset` 截断的 continuation 值。

## 边界

level-1 不引入单独的 effect system；`reset` / `shift` 的约束全部直接写在 continuation、answer type 与 memory legality 规则里。
