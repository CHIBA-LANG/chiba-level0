# `Ref[T]`

## 语法

`Ref[T]` 表示受控可变引用单元。

## 语义

`Ref[T]` 是显式可变性能力，不是普通字段或普通数据结构的默认表示。

它天然与 world / `send` 规则相关。

`Ref[T]` 是独立 capability 类型。

在 level-1 中，`Ref[T]` 天然 `!send`。

## Usage

```chiba
def inc(x: Ref[i32]): () = {
	x := x.read() + 1
	return ()
}
```

注释：`Ref[T]` 表示受控可变单元；它不自动获得跨 world 传递能力。

## 边界

创建、读、写的具体 surface API 可单独展开，但 `!send` 已是本层硬规则。
