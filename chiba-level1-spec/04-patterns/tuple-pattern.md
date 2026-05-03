# Tuple Pattern

## 语法

tuple pattern 使用圆括号包裹多个子 pattern。

## 语义

它要求被匹配值具有相同元数的 tuple 形状。

## Usage

```chiba
let (x, y) = pair

match pair {
	(a, b) => use2(a, b)
}
```

注释：tuple pattern 可以出现在 `let` 与 `match` 中，但都要求被匹配值与 pattern 的元数一致。

## 边界

需要单独明确：

- 1-tuple pattern 的写法
- 与 grouped expr / grouped pattern 的歧义
