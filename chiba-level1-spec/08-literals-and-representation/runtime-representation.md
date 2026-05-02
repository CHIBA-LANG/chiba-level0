# Bool / Unit / Tuple / ADT 的 Runtime 表示

## 语法

该条目不新增语法，描述值表示。

## 语义

不同基础值与聚合值的运行时表示会直接影响 codegen、pattern matching 与 ABI 边界。

level-1 在这里先做最小承诺，而不把所有布局细节一次写死：

- bool、unit、tuple、ADT 都有稳定的运行时值表示
- 这些表示必须足以支撑 pattern matching、method call、codegen 与 ABI 边界
- 具体 tag 编码、压缩策略与小对象优化可留给实现与更低层规范细化

## Usage

```chiba
let x = true
let y = ()
let z = (1, 2)
let w = Some(1)
```

注释：这些值在语言层都是普通值；runtime representation 文档只说明它们在实现层必须具有稳定、可判定的表示，而不是要求用户感知具体布局。

## 边界

tag 编码与 tuple / record / ADT 的精确布局策略仍可继续细化；但这些值类别在 level-1 中都必须有稳定表示，不能退化成“实现随意决定”的未定义区域。
