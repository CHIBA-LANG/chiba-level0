# Method Call

## 语法

method call 使用 `receiver.method(...)`。

## 语义

在 level-1 中，method call 基于 receiver shape 解析，而不是 interface witness。

field access 在名字解析上优先于 method call；但 `a.b(c)` 仍按正常的 call surface 解析，不把它机械改写成“先 field 再 call”的独立优先级规则。

换句话说，field 优先影响的是同名冲突时的名字选择，而不是 method call 语法本身的结合方式。

## Usage

```chiba
let n = vec.len()
let f = vec.len
let x = f()
```

注释：`vec.len()` 仍是标准 method call；若 `len` 同时可解释为 field 与 method，则 field 名字优先，但不会改变 `receiver.method(...)` 的基本语法结合方式。
