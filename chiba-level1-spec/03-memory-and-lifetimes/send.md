# `send` 标注

## 语法

`send` 表示某个值或类型可能跨 world 边界传递。

## 语义

`send` 不是普通类型别名，而是与并发安全和内存边界直接相关的能力判定。

level-1 中：

- `Ref[T]` 不 `send`
- `UnsafeRef[T]` 一律 `send`

`#[sync]` 暂不进入 level-1 首发；当前语义保持单核优先。

## Usage

```chiba
def pass_ref(x: Ref[i32]): () = {
	return ()
}

def pass_unsafe_ref(x: UnsafeRef[i32]): () = {
	return ()
}
```

注释：`Ref` 与 `UnsafeRef` 在 level-1 中承载不同 world/transfer 能力，`send` 规则直接依附于这种区分。
