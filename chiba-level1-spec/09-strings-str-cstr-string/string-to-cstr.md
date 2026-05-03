# `String -> cstr`

## 语法

该条目描述从拥有型字符串到 C 风格字符串的转换路径。

## 语义

该转换通常涉及 ABI 边界、安全性与生命周期保证，不应被视为总是零成本。

## Usage

```chiba
def puts(msg: cstr): i32 = extern "C" "puts"

def main(): i32 = {
	let owned = String.from("hello")
	let abi = owned.to_cstr()

	puts(abi)
	return 0
}
```

注释：这里显式调用 `to_cstr()`，强调 `String -> cstr` 是一个边界转换动作，不应默认隐式发生，更不应默认假设零成本或无限生命周期。
