# Closure Body 的隐式 `reset`

## 语法

该条目描述 closure 调用时的默认边界。

## 语义

closure body 与普通函数一样建立局部 `reset`，从而为局部值与 answer type 提供边界。

## 边界

需要单独明确：

- closure env 与 body 的 region 是否分离
- continuation 捕获在 closure 中的限制
