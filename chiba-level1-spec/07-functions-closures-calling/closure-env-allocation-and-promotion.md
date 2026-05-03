# Closure Env 的分配与提升

## 语法

该条目描述实现语义，不新增表面语法。

## 语义

closure env 初始位置、提升条件与可共享性直接影响 closure 语义与编译性能。

level-1 中，closure env 默认先属于当前最内层调用 / `reset` 边界。

只有当 closure value 需要离开当前边界时，env 才进入正式提升流程，并落入已承诺的 caller region / outer arena / RC 区三类目标之一。

## Usage

```chiba
def make(x: String): (): String = {
	return (): String => {
		return x
	}
}
```

注释：closure env 不会默认直接进入长期存储区；只有 closure 真的逃逸时，env 才需要提升。

## 边界

env 中若含 `Ref[T]` / continuation`，仍需分别满足这些能力对象自身的合法性约束。
