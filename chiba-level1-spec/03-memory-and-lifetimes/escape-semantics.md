# 值跨出当前 `reset` 的 Escape 语义

## 语法

该条目描述 escape 点，不新增新语法。

## 语义

当前至少包括：

- `return`
- closure capture
- 存入更长生命周期对象
- `send`

- continuation capture

这些操作都可能要求值离开当前最内层 arena。

level-1 把这些点正式列为 escape 点全集。

不同 escape 点可触发不同提升路径，但都必须服从同一套 escape legality。

## Usage

```chiba
def make(): (): String = {
	let s = String.from("hello")
	return (): String => {
		return s
	}
}
```

注释：这里 `s` 因 closure capture 而离开原始局部 arena，因此属于正式 escape 情形。

## 边界

continuation capture 属于 escape 点的一部分；不同 escape 不要求提升到同一目标，但目标空间必须落在已承诺的 caller region / outer arena / RC 区三类之中。
