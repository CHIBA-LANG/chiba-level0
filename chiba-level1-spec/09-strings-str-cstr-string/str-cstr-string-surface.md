# `str` / `cstr` / `String` 的语法面

## 语法

该条目描述三者在类型层与字面量层的公开写法。

## 语义

三者分别服务于：

- 普通字符串视图或协议类型
- C ABI 字符串
- 拥有型字符串值

## Usage

```chiba
def print_view(s: str): () = {
	return ()
}

def print_c(s: cstr): () = {
	return ()
}

def demo(): () = {
	let owned = String.from("hello")
	let view = owned.as_str()
	let abi = c"hello"

	print_view(view)
	print_c(abi)
	return ()
}
```

注释：`str` 用作普通字符串视图，`cstr` 用作 ABI 字符串，`String` 用作拥有型值。示例故意把三种表面同时放在一起，避免它们在文档里被误读成同义词。

## 边界

需要单独明确：

- 三者之间的默认转换是否存在
- `str` 是否只是 view
