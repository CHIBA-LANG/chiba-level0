# World 边界上的对象传递

## 语法

该条目描述跨 world 数据移动规则，不新增核心 surface syntax。

## 语义

跨 world 传递必须尊重：

- `send`
- 引用能力边界
- continuation 约束
- arena 生命周期边界

level-1 保留 world boundary 这一概念，但首发不开放完整的跨 world 数据传递能力。

当前规则应按保守模式理解：

- continuation 不允许跨 world
- `Ref[T]` 不允许跨 world
- `UnsafeRef[T]` 作为低级能力可跨 world

## Usage

```chiba
def pass_handle(x: UnsafeRef[File]): () = {
	return ()
}
```

注释：level-1 不把 world 间对象传递开放成一般能力；`UnsafeRef` 是少数保留的低级跨界句柄形式。

## 边界

world 相关更完整的并发与调度语义留待后续层级扩展。
