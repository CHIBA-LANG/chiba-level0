# Chiba Level 1 Spec Outline

## 0. 使用约定

- [x]：当前实现里已经有 parser / lowering / typecheck / test 证据。
- [-]：当前实现和 `CHIBA-SPEC` / 旧设计有偏差，需要单独写清楚。
- [ ]：在 TODO / 设计里明确出现，但当前实现尚不完整。

## 1. 核心语言总目录

- [x] 源文件编码、空白、换行、注释
- [x] 关键字集合
- [x] 标识符与 namespace path
- [x] 数字字面量
	- 十进制
	- 十六进制
	- 八进制
	- 二进制
- [x] 布尔字面量
- [x] 字符串字面量
- [x] `c"..."` 字面量
- [x] atom / symbol literal（`:tag`）
- [x] 标点与分隔符
- [x] 运算符集合与词法歧义
	- `:` vs `:atom`
	- `*` 的多重含义
	- `(` tuple / grouped expr / lambda 的歧义入口
- [x] 表达式优先级与结合性
- [x] file attrs
	- `#![Metal]`
	- `#![CBI]`
- [x] `namespace`
	- 文件头 `namespace x.y.z`
	- inline `namespace x.y.z { ... }`
- [x] `use`
	- 单项导入
	- multi import
	- glob import
- [x] item attrs
	- `#[entry]`
	- 参数化形式属于同一套 item attrs
	- 统一覆盖函数、stmt/expr、field、data variant、variant tuple type、namespace、block/unsafe block、lambda、trailing closure
- [x] `def`
	- 普通函数定义
	- `extern` 形式
- [x] 顶层静态值定义
- [x] method-style `def Type.method(...)`
- [x] `type`
- [x] `data`
- [x] `union`
- [x] `private`
- [x] public/private 的精确定义与跨 namespace 可见性
- [x] block 是表达式
- [x] block tail expression
- [x] 表达式语句
- [x] `let`
	- `let x = expr`
	- `let x: T = expr`
- [x] `let` destruct
	- tuple destruct
	- record destruct
- [-] `let` 支持的 pattern 子集
	- 哪些 pattern 可 parse
	- 哪些 pattern 可 lower
	- level-1 `let` 支持 tuple / record destruct 的 DFT pattern，嵌套深度任意
	- 合法 `let` 不发生运行期匹配失败，类型检查先拒绝不合法 destruct
- [-] constructor / literal pattern 不进入 `let`
- [x] record destruct in `let`
- [-] nested destruct pattern
	- `let` 支持 tuple / record destruct 的 DFT pattern，嵌套深度任意
	- `if let` 支持 DFT pattern，嵌套深度任意
- [x] `return`
	- `return` 不能省略值，`unit` 也写 `return ()`
- [x] `;` 在 block / statement 序列里的地位
	- `;` 是显式分隔符
	- `(ws|nl)*` 也可作为分隔符
	- 不把 `;` 当作额外语义节点

## 2. 控制流

- [x] `if { } else { }`
- [x] `if else if`
- [x] `if else if let`
- [x] `if let`
	- level-1 `if let` 支持 DFT pattern，嵌套深度任意
	- 承担 constructor / literal pattern 的 refutable 匹配
- [-] `else` 是否总是必需
	- `if let` 必须带 `else`
- [x] `match`
	- level-1 `match` 支持 DFT pattern，嵌套深度任意
	- 承担 constructor / literal pattern 的主要匹配职责
- [x] exhaustiveness 规则
- [x] pattern guard
- [x] `for { ... }`
	- 允许 `for :tag { ... }`
- [x] `for cond { ... }`
	- 允许 `for :tag cond { ... }`
- [x] `break`
	- 允许 `break :tag`
- [x] `continue`
	- 允许 `continue :tag`
- [x] `for` 的 desugar / lowering 语义
- [x] `reset`
- [x] `shift`
- [x] `reset` / `shift` 的 answer type checking
- [x] continuation 捕获与恢复时的 answer type 一致性
- [x] delimited continuation 的正式语义

## 3 内存管理与生命周期

- [x] level-1 managed object model
- [x] 普通值默认是 managed value
- [x] 普通 `data` / tuple / record / closure env 的默认存储语义
- [x] `Ptr[T]`
- [x] `Ref[T]`
- [x] `UnsafeRef[T]`
- [x] level-1 区分值类型与引用类型
- [x] uniqueness 作为编译器内部事实，而不是用户必写注解
- [x] `Ptr[T]` / `Ref[T]` / `UnsafeRef[T]` 的关系
- [x] `Ptr[T]` 与 FFI / Metal / ABI 边界
- [x] `Ref[T]` 的读写与受控可变性
- [x] `Ref[T]` 与 `send`
- [x] `#[sync]`
	- 不进入 level-1 首发
- [x] `send` 标注
- [x] world 边界上的对象传递
- [x] `reset` 作为 arena 边界
- [x] 普通函数调用蕴含隐式 `reset`
- [x] closure 调用蕴含隐式 `reset`
- [x] 值跨出当前 `reset` 的 escape 语义
	- `return`
	- closure capture
	- 存入更长生命周期对象
	- `send`
- [x] callee `reset` / caller `reset` / heap 之间的提升规则
- [x] continuation / answer type 与 arena 边界的关系
- [x] arena / escape / RC / uniqueness / FBIP 在 level-1 的最小承诺
- [x] level-1 内存管理与 `chiba2.md` 长期路线图的关系

## 4. 模式（Pattern）

- [x] wildcard pattern
	- `_` 是 wildcard，不是 variable
- [x] var pattern
- [x] tuple pattern
- [x] literal pattern
	- int
	- bool
- [x] constructor pattern
- [x] at pattern `name@pattern`
- [-] pattern 在不同位置的支持矩阵
	- `match`
	- `if let`
	- `let`
	- function parameter
	- `match` / `let` / `if let` 支持 DFT pattern
	- function parameter 另行收紧
- [ ] record pattern
- [-] nested pattern
	- `match` / `let` / `if let` 支持任意深度
	- parameter 另行收紧

## 5. 表达式

- [x] 变量引用
- [x] block expression
- [x] tuple literal
- [x] 1-tuple literal `(a,)`
- [x] grouped expr `(a)`
- [x] slice literal
- [x] record literal
- [x] record update
	- 复用现有 `{base | field: value}` 语法
- [x] function call
- [x] field access
- [x] indexing
- [x] postfix deref `.*`
- [x] cast `as`
- [x] lambda
- [x] trailing closure
- [x] `unsafe { ... }`
	- level-1 首发明确是 unsafe block
- [x] inline `asm`
- [-] asm 输入/输出 tuple 语义
- [x] pipe `|>`
	- 支持单个 `_` 作为孔位
	- 倒数第三弱优先级
- [x] method call surface syntax
- [x] named arguments
	- 不进入，且不作为后续方向
- [x] interpolation / format string

## 6. 运算符

- [x] 算术运算
	- `+ - * / %`
- [x] 比较运算
	- `== != < <= > >=`
- [x] 逻辑运算
	- `&& || !`
- [x] 位运算
	- `& | ^ << >>`
- [x] 一元运算
	- `-`
	- `!`
	- `*` deref
- [-] `&` address-of / ref story
	- level-1 去掉 `&` 作为 ref 开口
- [ ] `:=` 与 Ref 相关语义
	- 返回右侧值，可 chain
	- 倒数第二弱优先级
- [-] `=` 绑定/定义语法
	- 最弱，但不作为普通 operator
- [x] operator overload protocol
	- infix
	- prefix
	- postfix
	- `.*`
- [-] 各运算符在 parser / typecheck / lowering 中的统一定义

## 7. 函数、闭包与调用约定

- [x] 普通函数
- [x] 普通函数体的隐式 `reset`
- [x] lambda / closure
- [x] closure body 的隐式 `reset`
- [x] closure capture 语义
- [x] `return` 作为 escape 点
- [x] closure env 的分配与提升
- [x] 返回值不能引用 callee 局部 arena 的规则
- [x] method call
- [x] method receiver 规则
- [x] `def Type.method(...)`
- [x] method resolution
- [x] operator overload 与 method 的关系
- [x] `extern "c"`
- [x] `extern "cbx"`
- [x] `extern "syscall"` 的现状
	- 已删除
- [x] `#[entry]`
- [x] 局部 `def`
	- 不支持，使用 lambda
- [x] namespace block 内的 item 定义

## 8. 字面量与数据表示

- [x] int literal 的 base 与后缀处理
- [x] bool literal
- [x] unit literal
- [x] string literal
- [x] cstr literal
- [x] symbol literal
- [x] tuple value representation
- [x] string literal protocol
- [x] string literal handler
	- `#[string_literal("x")]`
- [x] `literal_prefix(#*)"..."(#*)`
- [x] raw string
- [x] multiline string
- [x] string interpolation
- [-] bool / unit / tuple / ADT 的 runtime 表示
- [ ] float literal
- [ ] array literal 的正式语义

## 9. 字符串、`str`、`cstr`、`String`

- [x] `str` / `cstr` / `String` 的语法面
- [x] `c"..."` 与 ABI 边界
- [x] `String -> cstr`
- [x] 除 `c""` 外的字符串字面量 desugar 为函数调用
- [x] prefix string handler resolution
- [x] raw / non-raw 与 interpolation 的组合规则
- [x] 标准字符串允许多行
- [ ] 去掉 `mk_str(...)` / `mk_cstr_view(...)` / `strlen(...)` 的用户语言地位
- [ ] 字符串相关 API 改为 method surface
- [-] `str` / `cstr` / `String` 的所有权与借用边界
- [-] `mk_str(...)` / `mk_cstr_view(...)` / `strlen(...)` 的规范地位
- [x] 字符串 escape / raw string / multiline string 的正式定义
- [x] UTF-8 语义与 codepoint 级规则

## 10. IR 与 Lowering

- [x] CIR 的角色与 CPS 地位
- [x] AST → CIR lowering 总述
- [x] BIR 的角色与抽象机地位
- [x] CIR → BIR lowering contract
- [x] LIR 的定位与 BIR → LIR contract
- [ ] pass placement 与层边界细化

---

## `chibalex` 语言大纲

- [x] `.chibalex` 文件结构
- [x] header / footer block
- [x] charclass 定义
- [x] macro 定义
- [x] token rule
- [x] action 原文透传
- [x] built-in character classes
- [x] regex 依赖面
- [-] UTF-8 / codepoint 语义与 regex engine 的对应关系
- [ ] 作为 project phase 自动接入

## `chibacc` 语言大纲

- [x] `.chibacc` 文件结构
- [x] header / footer block
- [x] `start`
- [x] 普通 `rule`
- [x] `Alt / Seq / Quantifier / Group`
- [x] label binding
- [x] `=> action`
- [x] `?predicate(...)`
- [x] Pratt block
	- prefix
	- infix
	- postfix
- [x] runtime fallback / generated runner
- [x] recovery
	- item-level
	- nested rule
	- list separator / closing token / stmt-level 样例
- [ ] prediction / optimization（M5）


## Level 2 预留

- [ ] interface
- [ ] Go-like interface method set
- [ ] namespace 作为 implementation bundle
- [ ] `via ns.path` 作为显式实现来源选择
- [ ] interface method 的 local HM 翻译
- [ ] `dyn Interface` 与动态分发对象

