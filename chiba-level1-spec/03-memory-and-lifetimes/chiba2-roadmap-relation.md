# Level-1 内存管理与 `chiba2.md` 长期路线图的关系

## 语法

该条目不新增语法，描述路线图关系。

## 语义

level-1 只需要提供一个可落地的最小内存模型；`chiba2.md` 中更完整的 arena、escape、Perceus RC、FBIP、world 安全模型可视为后续逐步对齐的长期方向。

level-1 不是 `chiba2.md` 长线设计的严格子集。

它是一个工程上可落地的当前层级：会复用部分长期方向，但不要求在形式上完全受 `chiba2` 约束。

## Usage

```chiba
def make(x: String): String = {
	return x
}
```

注释：这类 level-1 表面能力需要服从本层自己的最小内存语义，而不是等待 `chiba2` 的完整世界模型全部到位后才成立。

## 边界

`chiba2` 中更强的系统可作为未来方向，但不能反向推翻 level-1 已经写入正文的硬保证。
