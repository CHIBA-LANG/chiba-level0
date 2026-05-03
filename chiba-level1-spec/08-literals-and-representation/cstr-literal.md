# CStr Literal

## 语法

`c"..."` 表示 C ABI 边界上的字符串字面量。

## 语义

它服务于 `cstr` 和外部 ABI，不参与普通字符串 handler 的默认路径。

`c"..."` 的语义目标是构造 ABI 边界可用的 `cstr` 值。

与普通字符串之间不存在隐式互转；所有桥接都必须显式完成，并接受 NUL / UTF-8 等边界检查。

## Usage

```chiba
extern "c" def puts(msg: cstr): i32

def main(): i32 = {
	puts(c"hello")
	return 0
}
```

注释：`c"..."` 不等价于普通 `"..."`；它直接走 ABI 字符串通道。

## 边界

`cstr` 的结尾 NUL 语义属于其 ABI 表示的一部分，而不是普通字符串协议的一部分。
