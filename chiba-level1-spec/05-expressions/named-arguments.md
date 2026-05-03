# Named Arguments

## 语法

named arguments 允许在调用时按参数名传值。

## 语义

它改变调用点实参匹配方式，但不必改变函数定义本体的核心语义。

level-1 不引入 named arguments。

调用点只支持 positional arguments，加上已单独定义的 trailing closure 语法糖。

## Usage

```chiba
f(1, 2)
f(x: 1, y: 2) // level-1 中不成立
```

注释：named arguments 已被排除出 level-1；这也避免了它与 trailing closure、method call、record-like call surface 的组合歧义。

## 边界

后续若重新引入 named arguments，应作为 level-2 以上的新增 surface 单独设计，而不是在 level-1 中保留半开放入口。
