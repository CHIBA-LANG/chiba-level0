# Callee `reset` / Caller `reset` / Heap 之间的提升规则

## 语法

该条目描述内部提升策略，不新增 surface syntax。

## 语义

当值不能继续停留在当前 callee arena 时，需要被提升到：

- caller 对应 region
- 更外层 `reset`
- 或更长期的堆管理区

level-1 正式承诺这三类提升目标的存在：caller region、更外层 arena、RC 区。

规范不把每一种 escape 点写死到唯一目标，但会把这些目标空间本身写入语言语义。

## Usage

```chiba
def make_closure(x: String): (): String = {
	return (): String => {
		return x
	}
}
```

注释：`x` 不能停留在原始 callee arena 中，因此必须发生提升；提升目标可由实现选择，但只能落入规范承诺的三类目标之一。
