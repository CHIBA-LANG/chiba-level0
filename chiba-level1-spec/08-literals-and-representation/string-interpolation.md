# String Interpolation

## 语法

该条目描述字符串内部嵌入表达式的语法。

## 语义

插值应与字符串协议协同工作，而不是独立绕过 handler 路线。

level-1 支持字符串插值，并把它纳入统一 string literal protocol。

raw string 默认不做普通 interpolation；非 raw 字符串与 multiline 字符串都可启用 interpolation。

## Usage

```chiba
let msg = "hello ${name}"
let block = ##"
user = ${name}
id = ${id}
"##
```

注释：插值不引入另一套字符串系统；它只是字符串字面量描述中的一部分。

## 边界

插值表达式边界与转义细节可继续细化，但不改变它在协议中的统一地位。
