# `reset`

## 语法

`reset` 建立一个 delimited continuation 边界。

`reset` 也允许带 atom tag：

```chiba
reset :tag {
	...
}
```

与之配套的 `shift` surface 采用 block 形式，而不是箭头 lambda 形式：

```chiba
shift k {
	...
}

shift :tag k {
	...
}
```

## 语义

在 level-1 中，`reset` 同时具有：

- 控制边界语义
- answer type 边界
- arena / region 边界

tagged `reset` 为后续需要显式指向某个控制边界的控制操作保留稳定命名入口。

## Usage

```chiba
let value = reset {
	1 + 2
}
```

注释：最简单的 `reset` 只是显式建立一个控制边界，整个 block 的结果就是 `reset` 表达式的结果。

```chiba
let value = reset {
	1 + shift k {
		k(41)
	}
}
```

注释：这个例子展示 `reset` 为 `shift` 提供最近的捕获边界，`k` 只恢复到当前 `reset` 为止。

```chiba
let value = reset :parse {
	parse_step()
}
```

注释：tagged `reset` 给控制边界一个稳定名字，供后续需要显式指向该边界的控制操作使用。

## 边界

需要单独明确：

- `reset` 的 surface syntax 细节
- 与普通函数调用隐式 `reset` 的关系
