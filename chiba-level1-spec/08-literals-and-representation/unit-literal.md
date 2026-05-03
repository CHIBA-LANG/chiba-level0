# Unit Literal

## 语法

unit literal 表示唯一的空值。

## 语义

它通常对应类型 `unit` 的唯一值，并常用于无显式返回值场景。

level-1 的 unit literal surface 固定为 `()`。

空 block 的值也是 `()`，因此 unit literal 与空 block 在值层面保持一致。

## Usage

```chiba
return ()

let x = ()
```

注释：`unit` 不是“省略不写”的隐形值；在需要显式表达时，写成 `()`。

## 边界

空 block 与显式 `()` 在值语义上等价；差别只在 surface 形态。
