# `private`

## 语法

`private` 作为显式可见性修饰符出现在定义前。

```chiba
private def f() = {
    // ...
}
```
## 语义

在当前方向中，导出是默认行为，`private` 用于把定义限制在当前 namespace 可见范围内。

`private` 不以文件为边界，而以声明所在 namespace 为边界。

## Usage

```chiba
namespace demo.math

private def helper(x: i32): i32 = {
    return x + 1
}

def api(x: i32): i32 = {
    return helper(x)
}
```

注释：`helper` 只能在 `demo.math` 这个 namespace 内使用；导出默认开启，收窄才显式写 `private`。

## 边界

`private` 作用于 namespace 可见性，不改变 item 的名字归属与定义形态。

