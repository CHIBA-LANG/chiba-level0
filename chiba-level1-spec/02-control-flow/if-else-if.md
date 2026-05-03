# `if else if`

## 语法

`if` 允许串联多个 `else if` 分支。

## 语义

多个条件按顺序测试，首个命中的分支产生整个表达式的结果。

## Usage

```chiba
let grade = if score >= 90 {
	"A"
} else if score >= 80 {
	"B"
} else {
	"C"
}
```

注释：`else if` 链保持单一表达式语义，最终结果来自首个命中的分支。

## 边界

需要单独明确：

- `else if` 是否只是 `else { if ... }` 的表面糖
- 所有分支的结果类型如何统一
