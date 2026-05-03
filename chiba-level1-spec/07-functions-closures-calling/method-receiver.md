# Method Receiver 规则

## 语法

该条目描述 receiver 在方法定义与调用中的角色。

## 语义

receiver 决定 method resolution 的 primary shape key。

receiver 是显式存在的；level-1 不提供 auto-borrow 或 auto-deref receiver 调整。

因此，方法是否可调用，先取决于 receiver 当前写出的值/引用形态是否匹配方法定义。

## Usage

```chiba
def String.len(self: String): i32 = {
	...
}
```

注释：receiver 不是隐式魔法参数；它在定义与调用两侧都属于方法系统的显式匹配部分。

## 边界

receiver 可以是值或引用形态，但必须由方法定义与调用点显式对齐；编译器不自动替你改形态。
