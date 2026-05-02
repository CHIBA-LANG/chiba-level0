# `&` Address-Of / Ref Story

## 语法

level-1 不引入 `&` 作为 address-of / ref 开口。

## 语义

这意味着用户若要进入 `Ref[T]` 世界，应通过显式的 ref 构造或相关表面 API，而不是通过一个容易与位运算、borrow、address-of 混淆的 `&` 运算符。

## Usage

```chiba
let cell = Ref.new(1)
cell := 2
```

注释：这个例子刻意不用 `&x` 一类表面，而是通过显式 `Ref.new(...)` 进入引用世界，符合 level-1 去掉 address-of 运算符的方向。

## 边界

需要单独明确：

- 显式 ref 构造的首发表面语法
- `Ptr[T]` / `Ref[T]` / `UnsafeRef[T]` 的显式进入方式
