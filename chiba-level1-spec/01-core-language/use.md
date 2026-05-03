# Use

## 语法

`use` 用于导入名称，当前大纲包括：

- 单项导入
- multi import
- glob import

## 语义

`use` 改变当前文件或 block 的可见名称集合，但不改变被导入定义的原始归属。

`use` 的作用域是 block 级

名称冲突编译器报错

glob import 不可以再次导出

`use` 只改变当前可见名字集合，不改变原始 item 的归属 namespace。

## Usage

```chiba
use demo.math.add
use demo.io.{print, println}
use demo.prelude.*
```

注释：`use` 可以单项、multi 或 glob 导入；冲突名称在导入点直接报错。

## 边界

glob import 不参与再次导出；导入优先影响名字可见性，而不是 item 身份。
