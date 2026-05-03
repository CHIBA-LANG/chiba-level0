# `Ptr[T]`

## 语法

`Ptr[T]` 表示裸指针或低级地址能力。

## 语义

`Ptr[T]` 主要服务于：

- FFI
- Metal
- ABI
- unsafe 内存操作

它不是普通 ADT 建模的默认工具。

`Ptr[T]` 是一种独立 capability 类型，而不是普通库别名。

## Usage

```chiba
def load_u8(p: Ptr[u8]): u8 = {
	return p.*
}
```

注释：`Ptr[T]` 继续存在于类型层；被移除的是前缀 `*expr`，不是 `Ptr[T]` 本身。

## 边界

`Ptr[T]` 的读写能力通过 `.*`、cast 与 unsafe 规则协同定义，而不再走前缀解引用 surface。
