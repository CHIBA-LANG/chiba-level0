# String Literal

## 语法

普通字符串使用双引号，并与 raw、multiline、interpolation 规则共同构成字符串字面量体系。

字符串内部换行首先是词法层问题，而不是 statement layout 问题。

若某种字符串形式允许多行，则 lexer 在字符串 token 尚未闭合时应继续吞入后续换行与内容；此时换行属于 literal token 的一部分，而不是新的 statement separator。

## 语义

普通字符串字面量在当前方向上不直接绑定单一 runtime primitive，而倾向于经由字符串协议或 handler 路线展开。

level-1 中，普通字符串字面量默认构造 `str` / `String` 体系中的标准字符串值或视图，而不是 `cstr`。

它先完成词法归一化，再进入统一的 string literal protocol。

## Usage

```chiba
let a = "hello"
let b = "line1\nline2"
let c = ##"
hello
world
"##
```

注释：普通字符串、带转义的字符串、多行字符串都属于同一字符串字面量体系；它们先完成词法层闭合与归一化，再进入统一协议处理。

## 边界

`c"..."` 单独服务于 ABI 字符串，不进入普通字符串默认路径。
