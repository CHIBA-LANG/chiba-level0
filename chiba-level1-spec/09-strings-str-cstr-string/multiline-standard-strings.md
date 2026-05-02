# 标准字符串允许多行

## 语法

该条目描述普通字符串跨行的合法形式。

## 语义

多行不是 raw string 独占能力，普通字符串也可合法跨行，只是语义规则不同。

## Usage

```chiba
let msg = "hello
world"

let sql = "select *
from users
where active = true"
```

注释：这两个例子都使用普通字符串跨行；是否保留开头缩进、尾部换行以及终止规则，需要由本条和 multiline 详细规则一起约束。

## 边界

需要单独明确：

- 缩进与换行保留策略
- 与三引号或其他终止符设计的关系
