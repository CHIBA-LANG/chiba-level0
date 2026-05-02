# String Literal Handler

## 语法

当前方向预留类似：

```chiba
#[string_literal("x")]
```

这类 handler 声明。

## 语义

handler 为普通字符串字面量提供可定制的构造入口。

level-1 中，string literal handler 进入统一的 string literal protocol。

handler 名字解析与普通名字解析共享同一套命名空间机制；prefix string 只是该协议的一个入口，而不是独立于语言外的特判系统。

## Usage

```chiba
#[string_literal("sql")]
def sql_handler(parts: StringLiteralParts): Query = extern "builtin"

let q = sql"select * from users"
```

注释：`sql` 前缀通过共享名字解析找到对应 handler，然后进入统一的字符串字面量协议，而不是额外引入另一套解析器插件系统。

## 边界

若多个同名 handler 可见，则仍服从一般名字解析与冲突规则。
