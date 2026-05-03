# 字符串相关 API 改为 Method Surface

## 语法

字符串操作倾向于以 method surface 暴露，而不是散落 helper 函数。

## 语义

这让字符串协议与 method resolution 对齐，也更符合 level-1 的 method 方向。

## Usage

```chiba
def demo(): () = {
	let s = String.from("hello")
	let n = s.len()
	let upper = s.to_uppercase()

	write(n)
	write(upper)
	return ()
}
```

注释：例子把长度、变换都写成 method call，表达字符串 API 应优先暴露为 receiver-oriented surface，而不是散落为全局 helper。

## 边界

需要单独明确：

- 哪些旧 helper 转换成哪些方法
- method resolution 是否依赖 receiver shape 还是名义类型
