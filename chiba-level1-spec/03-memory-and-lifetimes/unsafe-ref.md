# `UnsafeRef[T]`

## 语法

`UnsafeRef[T]` 表示可跨 world 传递的 shared-owned unsafe handle。

## 语义

`UnsafeRef[T]` 不等于纯裸地址，也不等于语言保证同步安全的引用。

它的最小语义是：

- 可跨 world 传递
- 可被多个持有者共享
- 持有期间负责目标对象保活
- 不自动保证并发同步

对语言管理对象而言，`Ref[T] -> UnsafeRef[T]` 的典型 lowering 可以理解为升级到 Arc-like shared-owned representation。

这里的 Arc-like 只表达 shared ownership / keep-alive 语义，不表示语言自动提供同步保证。

因此，`UnsafeRef[T]` 更像：

- shared-owned unsafe handle

而不是：

- safe shared mutable reference

对 `UnsafeRef[T]` 的并发访问、可见性、顺序性与数据竞争安全，全部由用户或库层协议负责。

`UnsafeRef[T]` 是独立 capability 类型。

在 level-1 中，`UnsafeRef[T]` 一律 `send`。

## Usage

```chiba
def share_file(x: UnsafeRef[File]): () = {
	return ()
}
```

注释：`UnsafeRef[T]` 的 `send` 性质来自它在语言中的低级跨界角色，而不是来自“自动安全共享”。

## 边界

对非 managed object 的包裹与默认 `unsafe` 边界，可由更细规则补充，但不改变它在本层的一律 `send` 地位。
