# `literal_prefix(#*)"..."(#*)`

## 语法

该条目描述 prefix + raw 标记 + 字面量本体的统一结构。

## 语义

prefix 决定 handler 或特殊字面量通道；`#` 决定 raw 特性；二者可组合形成同一套字符串字面量协议。

level-1 采用：

- `prefix` 决定 handler 名字
- `r` 决定 raw 语义
- `#...#` 决定 delimiter 容量

因此 prefix/raw/delimiter 的统一结构可理解为：

`prefix? r? #* "..." #*`

## Usage

```chiba
let a = sql"select 1"
let b = r#"say \n"#
let c = sqlr#"select "name" from users"#
```

注释：prefix、raw 与 delimiter 处于同一字面量表面结构中，先在词法层完成匹配，再进入统一协议。

## 边界

prefix 与 raw 可以组合；终止符按 `#` 的数量成对匹配。
