# `for { ... }`

## 语法

`for { ... }` 表示无显式条件的循环体。

`for` 允许像 `reset` 一样带 atom tag：

```chiba
for :loop { ... }
```

## 语义

该循环反复执行 block，直到遇到 `break`、`return`、`shift` 等离开路径。

tagged `for` 为 `break` / `continue` 提供显式目标标签。

## Usage

```chiba
for {
	work()

	if done() {
		break
	}
}
```

注释：无条件 `for` 会持续执行，直到出现显式离开路径。

```chiba
for :retry {
	if transient_error() {
		continue :retry
	}

	break :retry
}
```

注释：带 tag 的版本说明循环标签既能被 `continue` 命中，也能被 `break` 命中。

## 边界

需要单独明确：

- `for` 本身是否是表达式
- `break` 是否可携带值
- 与隐式 `reset` 的关系
- `for :tag` 与普通 `for` 的 lowering 是否共享同一骨架
