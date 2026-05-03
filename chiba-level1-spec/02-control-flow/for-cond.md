# `for cond { ... }`

## 语法

该形式在 `for` 关键字后直接接一个条件表达式。

该形式也允许带 atom tag：

```chiba
for :loop cond { ... }
```

## 语义

每轮迭代开始前判断条件，条件为假则退出循环。

若带 tag，则 `break :loop` 与 `continue :loop` 可以显式指向该循环。

## Usage

```chiba
for i < n {
	step()
	i := i + 1
}
```

注释：`for cond { ... }` 在每轮开始前重新检查条件，因此更接近 while 风格循环。

```chiba
for :scan has_next() {
	if should_restart() {
		continue :scan
	}

	consume()
}
```

注释：tagged 版本与无 tag 版本共享同一循环表面，只是为 `break` / `continue` 提供了显式目标名。

## 边界

需要单独明确：

- 条件的求值时机
- 与普通 `for {}` 是否共享 lowering 骨架
