# Operator Overload Protocol

## 语法

level-1 当前方向需要覆盖：

- infix
- prefix
- postfix
- `.*`

## 语义

operator overloading 属于 structural method / obligation 系统的一部分，不依赖 interface witness。

## Usage

```chiba
let c = a + b
let d = value.*field
```

注释：这个例子同时提示 infix 和 postfix operator surface 都需要落到统一 overload protocol，而不是各自走完全不同的分派故事。

## 边界

需要单独明确：

- 运算符名如何编码到方法命名空间
- 候选冲突如何报错
