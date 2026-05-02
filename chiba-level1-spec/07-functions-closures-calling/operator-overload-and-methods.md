# Operator Overload 与 Method 的关系

## 语法

该条目描述运算符重载与方法系统的统一模型。

## 语义

当前方向是把 operator overload 看作 method / obligation 系统的一部分，只是 surface syntax 不同。

因此，运算符协议与普通方法共享同一解析与能力框架；差别只在 surface token 和调用糖上。

## Usage

```chiba
def Vec2.add(self: Vec2, rhs: Vec2): Vec2 = {
	...
}
```

注释：运算符重载不是另一套独立系统；它只是方法协议在运算符表面上的投影。

## 边界

运算符协议与普通方法共享同一方法系统；更细的命名冲突细则可在 operator 文档继续补充，但不会把两套系统拆开。
