# Slice Literal

## 语法

slice literal 使用当前语言既有的 slice 表面语法。

多行 slice literal 可以在未闭合的 `[` `]` 内部跨行继续。

例如：

```chiba
[
	a,
	b,
	c,
]
```

在右方括号闭合前，内部换行不终止当前表达式。

## 语义

它产生切片值或切片视图，而不是独立所有权容器。

slice 与 array / vector 的职责边界在 level-1 中保持明确：slice 负责“连续元素视图”，而不是默认拥有者。

## Usage

```chiba
let xs = [1, 2, 3]
let ys = [
	a,
	b,
	c,
]
```

注释：这里的 `[` `]` 进入 slice literal 分支；它产生的是 slice surface，而不是另一种带独立所有权承诺的容器。

## 边界

与 indexing 的歧义由是否已有左侧被索引表达式决定；在普通表达式入口中，`[` `]` 按 slice literal 解析。
