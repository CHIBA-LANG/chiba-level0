# `#[sync]`

## 语法

当前方向不提供内建 `#[sync]` attribute。

本文档保留为未来可能的扩展预留位。

## 语义

当前设计里：

- 语言内建 `send`
- 不内建独立 `sync`
- `Ptr[T]` 与 `UnsafeRef[T]` 可跨 world 传递
- 但同步正确性不由语言静态承诺

因此，同步应由用户代码、库协议或 runtime primitive 负责，而不是由一个首发 `#[sync]` 标注负责。

换句话说，level-1 只有 world / send / capability 边界，没有单独的 `sync` 类型系统层。

## Usage

```chiba
// level-1 不提供 #[sync]
let shared: UnsafeRef[Queue] = open_queue()
```

注释：是否同步安全，不由语言内建 attribute 承诺；应交给库协议、runtime primitive 或更高层抽象。

## 边界

未来即使引入 `#[sync]`，也应视为更高层扩展，而不是 level-1 首发约束的一部分。
