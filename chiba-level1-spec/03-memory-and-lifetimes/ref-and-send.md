# `Ref[T]` 与 `send`

## 语法

该条目描述 `Ref[T]` 在 `send` 语义中的地位。

## 语义

当前方向倾向于把 `Ref[T]` 视为天然 `!send` 的单 world 可变性工具。

这不是一个“默认大多时候 `!send`” 的建议，而是 level-1 的正式能力边界：`Ref[T]` 不作为跨 world 传递能力。

若程序需要跨 world 共享或发送，应转入 `UnsafeRef[T]` 或其他显式边界对象，而不是给 `Ref[T]` 打补丁。

## Usage

```chiba
let r: Ref[Counter] = counter
update_local(r)
```

注释：`Ref[T]` 适用于本 world 内的受控可变性；若要跨 world 传递，就必须换到另一种 capability。

## 边界

level-1 不为 `Ref[T]` 提供可发送特例；它进入 closure capture 或 continuation capture 时，仍不得借此越过 world/send 边界。
