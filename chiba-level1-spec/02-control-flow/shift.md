# `shift`

## 语法

`shift` 从最近的 `reset` 捕获 continuation。

当前 surface syntax 为：

```chiba
shift k {
	...
}
```

若需要显式指定目标 `reset` tag，则写成：

```chiba
shift :tag k {
	...
}
```

## 语义

捕获出的 continuation 不是普通函数的平凡别名；它携带 answer type 与控制上下文信息。

## Usage

```chiba
let value = reset {
	1 + shift k {
		k(41)
	}
}
```

注释：这里 `shift` 捕获的是“加 1 之后返回”的 continuation，所以恢复 `k(41)` 后整个 `reset` 结果为 `42`。

```chiba
let value = reset {
	shift k {
		0
	}
}
```

注释：第二个例子展示 `shift` body 也可以选择不恢复 continuation，而是直接给出整个 `reset` 的结果。

## 边界

需要单独明确：

- continuation 参数的 surface 写法
- `shift` body 的检查规则
- 与 `send`、arena 边界的关系
