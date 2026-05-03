# String Literal Protocol

## 语法

该条目描述普通字符串如何进入 handler / desugar 协议。

## 语义

字符串字面量不必直接固定到单一构造函数；它可以经过协议映射到某个字符串处理入口。

level-1 把普通 string、raw string、multiline string、interpolation string、prefix string 统一到同一个字面量协议模型。

也就是说，这些 surface 先形成统一的字符串字面量描述，再交给默认字符串构造路径或 prefix handler。

## Usage

```chiba
let a = "plain"
let b = r#"raw"#
let c = "hello ${name}"
let d = sql"select * from users"
```

注释：四种 surface 最终都进入同一字面量协议模型，只是在默认 handler 与 prefix handler 上分流。
