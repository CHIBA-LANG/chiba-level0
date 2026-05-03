# 普通 `data` / Tuple / Record / Closure Env 的默认存储语义

## 语法

该条目描述默认存储模型，不新增 surface syntax。

## 语义

这些结构在 level-1 中默认先属于当前最内层 `reset` 对应的 arena / region；若后续逃逸，则再发生提升。

这条默认规则同时覆盖：

- 普通 `data`
- tuple
- record
- closure env

它们在 source-level 上不要求用户先手动选择 heap / RC / outer arena；默认先落在最近的局部边界内。

## Usage

```chiba
def pair(x: i32, y: i32): (i32, i32) = {
	let p = (x, y)
	return p
}
```

注释：`p` 初始属于当前调用边界；是否需要提升，取决于它是否离开当前最内层 `reset`。

## 边界

record 与 tuple 在默认存储语义上共享同一方向；closure env 也先服从最近边界，再根据 escape 情形提升。
