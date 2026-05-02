# `Ptr[T]` / `Ref[T]` / `UnsafeRef[T]` 的关系

## 语法

该条目描述三者的角色边界。

## 语义

当前方向是：

- `Ptr[T]` 面向裸地址与 FFI
- `Ref[T]` 面向单 world 受控可变性
- `UnsafeRef[T]` 面向可跨 world 共享的 shared-owned unsafe handle

三者的区别至少应固定为：

- `Ptr[T]` 有地址语义，但不承担保活
- `Ref[T]` 是 safe、单 world、默认 `!send`
- `UnsafeRef[T]` 可 `send`，并承担 shared ownership / keep-alive，但不自动承担同步

对 managed object 而言，`Ref[T] -> UnsafeRef[T]` 的语义可理解为升级到 Arc-like shared-owned representation。

三者不是同一能力的轻量别名，而是明确分工的 capability 类型：

- `Ptr[T]` 负责裸地址与外部 ABI
- `Ref[T]` 负责单 world 的受控可变引用
- `UnsafeRef[T]` 负责可跨 world 共享、带 keep-alive 的 unsafe handle

在非 `#![Metal]` 的普通 level-1 代码里，`Ptr[T]` 与 `UnsafeRef[T]` 都应通过 `unsafe` 边界使用；`Ref[T]` 则仍是受控 safe 能力。

## Usage

```chiba
let r: Ref[State] = state_cell
let u: UnsafeRef[State] = share_unsafe(r)
let p: Ptr[u8] = buf.ptr()
```

注释：三者对应三类不同边界；它们不能被当成“只是同一个引用换个名字”。

## 边界

三者之间可以存在显式转换，但凡会丢失保活、world 或安全信息的转换，都必须进入 `unsafe` 或由专门边界 API 承担。
