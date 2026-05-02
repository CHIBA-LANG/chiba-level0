# Field Access

## 语法

field access 使用点号语法。

## 语义

`v.x` 要求 `v` 的类型能统一到带有 `x` 字段的 open row。

field access 先于 method 名字解析生效；若同名字段与方法同时存在，字段优先。

这条规则适用于 record 风格值，也适用于暴露字段面的名义类型。

## Usage

```chiba
let p = { x: 1, y: 2 }
let a = p.x
```

注释：`v.x` 先尝试字段访问；只有字段不成立时，后续相关语法才会进入 method 路线。

## 边界

field access 与 method call 的冲突按“字段优先”处理；具体类型是 record 还是名义类型，不改变这一解析顺序。
