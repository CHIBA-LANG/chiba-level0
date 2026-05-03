# `continue`

## 语法

`continue` 跳到最近循环的下一轮。

在 tagged loop 存在时，也允许写成：

```chiba
continue :tag
```

## 语义

`continue` 放弃当前轮剩余计算，但不离开整个循环。

若提供 atom tag，则 `continue` 的目标不再是最近循环，而是最近的同名 tagged loop。

## Usage

```chiba
for cond {
	if should_skip() {
		continue
	}

	process()
}
```

注释：这里的 `continue` 结束当前轮，直接进入下一轮条件判断。

```chiba
for :outer cond1 {
	for cond2 {
		if restart_outer() {
			continue :outer
		}

		process_inner()
	}
}
```

注释：带 tag 的 `continue` 允许直接跳回命名外层循环的下一轮，而不是只影响最近循环。
