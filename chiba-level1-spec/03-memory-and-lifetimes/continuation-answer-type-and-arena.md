# Continuation / Answer Type 与 Arena 边界的关系

## 语法

该条目描述 continuation、answer type 与内存边界的交叉规则。

## 语义

continuation 捕获不仅影响控制流，也影响 arena 有效性与对象可达性。

level-1 把 answer type checking 写入正式语义。

continuation 不允许跨 world 传递。

continuation 可以跨 arena，但必须通过 escape legality 检查；也就是说，跨 arena 不是天然非法，但不能绕过 arena / escape 规则。

## Usage

```chiba
reset {
	let k = shift cont => {
		return cont
	}
	return k(1)
}
```

注释：continuation 的合法性不仅取决于 answer type，也取决于它是否捕获了不能跨出当前 arena 的值。
