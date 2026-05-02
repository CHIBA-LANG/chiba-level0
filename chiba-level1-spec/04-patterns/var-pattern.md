# Var Pattern

## 语法

var pattern 由一个普通绑定名构成。

## 语义

它匹配任意值，并把该值绑定到局部名字。

若需要在继续匹配子 pattern 的同时保留“整个值”的绑定，则应使用 at pattern：

```chiba
name @ pattern
```

## Usage

```chiba
match expr {
	x => use(x)
}
```

注释：单独的 `x` 是 var pattern，它匹配任意值并把该值绑定为局部名字。

## 边界

需要单独明确：

- var pattern 与 constructor 名冲突时如何判定
- 是否允许类型标注版 var pattern
- 与 at pattern 的优先级与组合方式
