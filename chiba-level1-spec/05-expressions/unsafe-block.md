# `unsafe { ... }`

## 语法

`unsafe` block 显式包裹需要低级能力的表达式区域。

level-1 首发明确提供的是：

```chiba
unsafe {
	...
}
```

也就是 `unsafe block`。

本文不把裸 `unsafe` 关键字解释为另一套独立表达式形态。

## 语义

它不自动改变值语义，但允许进入需要额外责任的操作，如裸指针、低级布局或未验证转换。

在非 `#![Metal]` 的普通 level-1 代码里，`unsafe` 是进入下列低级能力的显式门：

- `Ptr[T]`
- `UnsafeRef[T]`
- inline `asm`
- `union`

`unsafe` 的作用域只覆盖其 block 内部；离开该 block 后，不会把 surrounding expression 自动染成 `unsafe`。

它是“责任边界”的显式标记，而不是另一套类型系统。

## Usage

```chiba
let x = unsafe {
	read_ptr(p)
}
```

注释：`unsafe` 只包住需要额外责任的那一小段；在普通非 `#![Metal]` 代码中，低级能力应通过这道显式边界进入。

## 边界

`unsafe block` 可以嵌套；嵌套不会产生新的语义等级，只是更细地表达责任边界。
