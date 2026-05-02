# Method Call Surface Syntax

## 语法

method call 使用 `receiver.method(args...)` 风格。

## 语义

在 level-1 中，它最终落到 structural method resolution，而不是 interface witness。

method call surface 等价于“先解析 receiver 与 method，再形成标准 call”。

receiver 不允许自动借用或自动解引用；因此 method resolution 只在显式 receiver shape 上工作。

## Usage

```chiba
let n = text.len()
let q = vec.push(1)
```

注释：`receiver.method(args...)` 是标准 surface；但不会偷偷做 auto-borrow / auto-deref。

## 边界

field 名冲突按既定规则优先于 method 名字解析，但不改变 `receiver.method(...)` 的语法结构。
