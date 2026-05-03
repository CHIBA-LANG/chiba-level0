# `else` 是否总是必需

## 语法

该条目讨论 `if` / `if let` 是否允许省略 `else`。

## 语义

若允许省略 `else`，则需要定义：

- 整个表达式的值
- 是否退化为 statement-only 结构

## Usage

```chiba
let value = if cond {
	1
} else {
	2
}
```

注释：这个例子展示表达式型 `if` 需要 `else` 才能稳定地产生值。

```chiba
if let Foo(x) = expr {
	use(x)
} else {
	use_default()
}
```

注释：`if let` 也同样要求显式 `else`，否则失败路径的值和控制去向都会悬空。

## 边界

需要单独明确：

- 表达式上下文是否强制要求 `else`
- 省略 `else` 是否隐式产生 `unit`
