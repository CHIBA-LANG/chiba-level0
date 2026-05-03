# Level-1 Managed Object Model

## 语法

该条目不新增 surface syntax，而是描述 level-1 默认对象管理模型。

## 语义

level-1 以 managed value 为默认路线：普通值优先停留在最局部、最短命、最便宜的位置；只有在生命周期或共享要求逼迫时，才升级到更重的管理机制。

这里的 managed 明确不是 tracing GC。

level-1 的 managed object model 以 arena、escape legality、promotion、RC 这类机制为基础，而不是以全局垃圾回收为基础。

普通对象默认进入这套 managed 模型。

## Usage

```chiba
data Pair {
	x: i32,
	y: i32,
}

def make(): Pair = {
	return Pair { x: 1, y: 2 }
}
```

注释：`Pair` 这类普通对象默认进入 level-1 的 managed object model；它不是裸指针对象，也不是 GC-only 对象。

## 边界

首发正文明确承诺 arena + promotion + RC 这套 managed 路线。
