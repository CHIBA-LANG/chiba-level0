# Literal Pattern

## 语法

literal pattern 当前至少包括：

- int
- bool

## 语义

它要求被匹配值与给定字面量相等。

## Usage

```chiba
match n {
	0 => zero()
	1 => one()
	_ => many()
}
```

注释：这里的 `0`、`1` 都是 literal pattern，用于表达精确值匹配，而不是引入绑定。

## 边界

需要单独明确：

- 字符串字面量是否进入 pattern
- 数值比较是否要求同型
