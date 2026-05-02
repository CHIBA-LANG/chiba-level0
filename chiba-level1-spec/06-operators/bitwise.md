# 位运算

## 语法

当前包括：

- `&`
- `|`
- `^`
- `<<`
- `>>`

## 语义

位运算主要面向整数和低级位模式操作。

`|` 在这里始终是普通位运算符；它不会因为出现在 `{ ... }` 内就自动失去运算符地位。

只有当外层已经进入 trailing closure header 或 record update 入口时，`|` 才被上层语法消费为分界符。

## Usage

```chiba
let mask = 1 << 3
let value = flags & mask
let merged = value | 0b0010
```

注释：这里的 `&` 是位运算，不是 address-of；同一个符号在 level-1 被保留为整数位模式操作的一部分。

## 边界

`&` 与 address-of 故事如何区分、以及位移右操作数类型要求仍可继续细化；但 `|` 的位运算身份在普通表达式中保持稳定，不为 closure / record update 额外发明新 token。
