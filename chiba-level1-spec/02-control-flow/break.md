# `break`

## 语法

`break` 从最近的循环中离开。

在 tagged loop 存在时，也允许写成：

```chiba
break :tag
```

## 语义

`break` 是控制流跳出点；若循环是表达式，还需要定义 `break` 是否可提供结果值。

若提供 atom tag，则 `break` 的目标不再是最近循环，而是最近的同名 tagged loop。

## Usage

```chiba
for {
	if done() {
		break
	}

	step()
}
```

注释：这是最普通的 `break`，目标是最近的循环边界。

```chiba
for :outer {
	for {
		if stop_all() {
			break :outer
		}

		step()
	}
}
```

注释：带 tag 的例子强调 `break` 可以越过内层循环，显式跳到命名循环边界。
