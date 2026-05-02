# Postfix Deref `.*`

## 语法

level-1 当前方向把取值语法写成 postfix `.*`。

## 语义

`.*` 参与 operator overloading 与 method resolution，而不是只是固定的低级解引用原语。

level-1 引入 postfix deref `.*`，并删除前缀解引用 `*expr`。

但 `Ptr[T]` 仍保留为类型写法；被移除的是前缀 surface，而不是指针类型本身。

## Usage

```chiba
let value = ptr.*
let field = ptr.*.x
```

注释：level-1 只保留后缀取值 surface；`Ptr[T]` 继续存在，但不再通过前缀 `*expr` 解引用。

## 边界

`.*` 作为 overload 入口参与表达式链，与 field access / call / index 共同构成 postfix surface。
