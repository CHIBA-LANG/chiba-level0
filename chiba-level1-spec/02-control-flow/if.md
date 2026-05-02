# `if { } else { }`

## 语法

`if` 以条件表达式和两个分支 block 构成基本条件分支。

## 语义

`if` 是表达式，其结果类型由两个分支统一决定。

level-1 中，`if` 必须带 `else`。

这条规则同时适用于表达式位置与 statement-like 用法；不提供“缺失 else 的弱化版 if”。

## Usage

```chiba
let abs = if n >= 0 {
	n
} else {
	-n
}
```

注释：这个例子强调 `if` 本身产出值，而不是只作为 statement 使用。

## 边界

条件必须为 `bool`；若两个分支类型无法统一，则在静态期报错。
