# Closure Capture 语义

## 语法

该条目描述 closure 对外部绑定的 capture 规则。

## 语义

capture 会影响：

- 变量生命周期
- 值是否逃逸
- closure env 的分配与提升

capture 会把外部绑定纳入 closure env；这会触发 escape legality 检查，并在必要时要求提升。

普通值 capture 默认按 closure 语义进入 env；`Ref[T]`、continuation 等 capability 的 capture 仍需遵守各自的 world / send / legality 约束。

## Usage

```chiba
def make(x: String): (): String = {
	return (): String => {
		return x
	}
}
```

注释：这里 `x` 因 capture 进入 closure env，并因此成为正式 escape 情形的一部分。

## 边界

`Ref[T]` 与 continuation 被 capture 时，不会因此失去原有的限制；closure capture 不能把它们升级成更宽松的能力。
