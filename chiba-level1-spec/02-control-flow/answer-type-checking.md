# `reset` / `shift` 的 Answer Type Checking

## 语法

该条目描述 `reset` / `shift` 的类型检查规则，而不是新增语法。

## 语义

level-1 至少需要保证：

- 每个 `reset` 在确定的 answer type 下检查
- `shift` body 与 surrounding `reset` 的 answer type 一致
- continuation 恢复要求 answer type 一致

## Usage

```chiba
let x = reset {
	shift k {
		k(1)
	}
}
```

注释：这个例子要求整个 `reset` 以整数 answer type 检查，因为 `k(1)` 恢复后得到的结果就是整个 `reset` 的结果。

```chiba
let bad = reset {
	shift k {
		k(1)
		return "oops"
	}
}
```

注释：第二个例子展示 answer type 不一致的情况。若 continuation 恢复路径产出整数，而 `shift` body 另一条路径产出字符串，则应在类型检查阶段拒绝。

## 边界

需要单独明确：

- 是否暴露 continuation type surface syntax
- 与 generic × continuation 的交叉限制
