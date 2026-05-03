# `c"..."` 与 ABI 边界

## 语法

该条目描述 `c"..."` 与 `cstr` 在 ABI 边界中的职责。

## 语义

`c"..."` 的主要目标是为 `extern` / CBI / FFI 提供稳定字符串表示。

## Usage

```chiba
extern "C" def puts(msg: cstr): i32

def main(): i32 = {
	puts(c"hello from c abi")
	return 0
}
```

注释：这里直接使用 `c"..."` 作为 `cstr` 传给 C ABI，表达的是“为 ABI 边界准备好的字符串值”，而不是普通 `String`。

## 边界

需要单独明确：

- `cstr` 的生命周期保证
- `Ptr[u8]` 与 `cstr` 的关系
