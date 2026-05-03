# Exhaustiveness 规则

## 语法

该条目讨论 `match` 与其他 pattern 分支结构是否需要穷尽性检查。

## 语义

穷尽性检查用于保证：

- 每个可能输入都被处理
- 缺失分支能在静态期尽早报错

level-1 正式要求 exhaustiveness checking。

首发至少覆盖布尔值与已知 `data` / `union` 形状；对这些可静态分析的 pattern，缺失分支必须报错。

## Usage

```chiba
match flag {
	true => 1
	false => 0
}
```

注释：布尔匹配列出全部情况，因此是穷尽的。

```chiba
match flag {
	true => 1
}
```

注释：第二个例子缺少 `false` 分支，若 level-1 对该类匹配启用穷尽性检查，应在静态期报错。

## 边界

`if let` 不承担完整 exhaustiveness；完整穷尽性义务主要由 `match` 承担。
