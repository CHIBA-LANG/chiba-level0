# Namespace Block 内的 Item 定义

## 语法

inline namespace block 允许在 block 内部声明顶层样式 item。

## 语义

它提供局部分组与命名空间限定，而不要求拆成单独文件。

level-1 支持 namespace block 内定义 item。

这些 item 仍是 namespace item，而不是闭包式局部定义；因此它们不捕获外层局部值。

## Usage

```chiba
namespace math.extra {
	def add1(x: i32): i32 = {
		return x + 1
	}
}
```

注释：`namespace` block 用于组织 item，不把外层函数局部环境带入其中。

## 边界

block 内 item 的可见性与普通 namespace item 一致，按 namespace 规则生效。
