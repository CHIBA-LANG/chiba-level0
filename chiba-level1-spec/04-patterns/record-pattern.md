# Record Pattern

## 语法

record pattern 通过字段名解构 record-like 值。

## 语义

它把字段名与子 pattern 对齐，并要求被匹配值具有相应字段。

## Usage

```chiba
match point {
	{ x, y } => use2(x, y)
}
```

注释：record pattern 按字段名解构值，字段书写顺序不必等于底层布局顺序。

## 边界

需要单独明确：

- 是否支持 open record pattern
- 与 row polymorphism 的关系
- 字段顺序是否无关
