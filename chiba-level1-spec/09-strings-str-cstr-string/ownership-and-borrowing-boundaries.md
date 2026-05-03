# `str` / `cstr` / `String` 的所有权与借用边界

## 语法

该条目描述字符串家族的生命周期与边界，不新增新语法。

## 语义

`str`、`cstr`、`String` 不应被视为完全可互换；它们承载不同的所有权、ABI 与生命周期含义。

## Usage

```chiba
def len(s: str): i64 = s.len()

def print_c(s: cstr): i32 = extern_puts(s)

def demo(): () = {
	let owned = String.from("hello")
	let view = owned.as_str()
	let c_view = owned.to_cstr()

	len(view)
	print_c(c_view)
	return ()
}
```

注释：`owned`、`view`、`c_view` 分别代表拥有型值、字符串视图和 ABI 侧字符串。示例强调三者职责不同，即使文本内容相同也不应当被视为同一种值。

## 边界

需要单独明确：

- `str` 是否可看作 view
- `String` 与 `cstr` 转换的有效期
