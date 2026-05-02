# 运算符集合与词法歧义

## 语法

level-1 当前涉及：

- 算术运算符
- 比较运算符
- 逻辑运算符
- 位运算符
- `*`
- `:`
- `.*`

## 语义

同一词法符号可能在不同层级承担不同职责，例如：

- `:` 既参与 atom，又参与类型标注
- `(` 是 tuple、grouped expr、lambda 歧义入口
`{` 与 `|` 共同构成 record update / trailing closure 的歧义入口

其中 `|` 本身继续保留为位运算 token；record update 与 trailing closure 的区分不靠改写 `|` 的词法类别，而靠外层语法锚点：

- 已显式闭合的 call expression 后，若出现 `{|`，优先尝试 trailing closure
- 普通表达式位置的 `{base | field: value}` 进入 record update
- `{|...| ...}` 是 trailing closure 的专用参数头；它不与 `{base | field: value}` 共用同一个骨架

## 边界

`.*` 是单 token 还是词法后组合、以及 prefix / infix / postfix 的统一词法规则，仍可继续细化；但 `{` / `|` 的歧义在 level-1 已先按外层语法锚点解决，而不是新增一个特殊 `|` token。
