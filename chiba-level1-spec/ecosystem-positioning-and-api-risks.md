# Chiba 的语言定位与生态 API 风险

## 0. 范围

本文不是 level-1 语法规范，而是对 Chiba 的语言定位、与 Rust / ML / Zig 的差异、以及标准库 / runtime / http 生态在工程上最容易失控的点做集中说明。

本文的目标是两件事：

- 说明 Chiba 最可能输给其他语言的地方
- 给 std / runtime / http 一类基础库提供 API 设计禁忌清单

## 1. Chiba 相对 Rust / ML / Zig 的位置

Chiba 的方向不是 Rust、SML、Haskell、OCaml、Zig 中任意一者的简单变体。

它更接近一种：

- 以 HM / row / structural generics 为基础
- 以 continuation 为核心控制抽象之一
- 以 typed structural templates 为实例化模型
- 以可控 lowering 和 runtime 形态为目标的 systems-ML

它最有特色的地方不是单个 feature，而是把下面这些东西放在一起：

- structural method / operator / shape dispatch
- continuation 驱动的 iter / async / RAII 路线
- 非 borrow-checker 路线的内存与 world 边界
- template-like specialization

## 2. 最可能输给 Rust 的点

若 std 足够厚、runtime 足够统一，Chiba 的日常 happy path 体验确实可以接近 Rust。

但它最可能输给 Rust 的地方不在日常 API，而在边界行为：

- 解析、重载、specialization、`send` 染色的可预测性
- 大型重构时的波及范围
- 错误信息是否能稳定解释 structural resolution 失败
- continuation / specialization 带来的性能 cliff 是否足够可见
- 并发安全是否过度依赖库作者 discipline

Rust 靠 nominal boundary、trait/coherence、borrow checker 和成熟工具链，把这些边界问题压得很低。

## 3. 最可能输给 ML 的点

Chiba 会比 SML / Haskell / OCaml 更接近 runtime 与 systems concerns，但也因此最可能输掉下面这些东西：

- 语义整洁度
- 推断系统的统一性
- equational reasoning 的直观性
- 语言核心的精简度
- 抽象边界的数学可解释性

ML 家族的优势在于：

- 更少语法层与 lowering 层耦合
- 更少需要依赖库 discipline 才成立的隐含契约
- 更容易把复杂特性收敛进统一理论

Chiba 若控制不好，很容易出现“每个特性单独看都合理，但组合后很难整体推理”的问题。

## 4. 最可能输给 Zig 的点

Chiba 与 Zig 都不想走 Rust 式的重证明路线，但 Zig 的核心更窄、更显式，也更容易保持工具链和语言边界稳定。

Chiba 最可能输给 Zig 的地方包括：

- 语法与 parser predictability
- ABI / lowering 的透明度
- 编译模型的可解释性
- 工具链实现复杂度
- 小团队长期维护成本

Zig 的优势是：

- 语言核心小
- 特性间耦合低
- 用户更容易猜到编译器在做什么

Chiba 的风险是：

- 语法糖、continuation、layout、structural dispatch、specialization 一起出现时，系统耦合度明显更高

## 5. std 足够强还不够的原因

厚实的 std 能显著改善日常开发体验，但它不能替代下面这些东西：

- 可解释的错误信息
- 稳定的 API 设计纪律
- specialization 与 lowering 的可见性
- editor / build / test / docs 工具链的一致体验

因此，“只要 std 足够强，开发体验就等于 Rust” 只对 happy path 成立；一旦进入边界情况，语言和工具的可预测性仍然决定下限。

## 6. std / runtime / http 生态最容易失控的 10 条 API 设计禁忌

### 6.1 不要把 shape-based overload 当作公共热路径 API 的主要入口

公共基础库的主入口若过度依赖 structural overload，用户在升级、重构、局部改 shape 时会更难预估解析结果。

建议：

- 热路径 API 优先给出稳定、单义的 nominal surface
- structural resolution 留给局部 helper 或内部 adapter

### 6.2 不要让公共 API 暴露深层匿名 closure / continuation 类型

若一个 runtime/http API 把多层匿名 closure、continuation、adapter 直接暴露在 public surface，上层用户将更容易遇到 specialization 爆炸与错误信息失控。

建议：

- public API 返回稳定命名类型
- 内部再用 closure / continuation 做 lowering

### 6.3 不要把 middleware stack 设计成无限 shape fan-out

如果每层 middleware 都产出一个新的独特 shape，编译时间、错误信息和 code size 都会很快恶化。

建议：

- 把常见 stack 压进少数标准 adapter
- 让 semantic specialization 和 codegen specialization 尽量共享

### 6.4 不要把 `send` 变化藏在库内部

若一个值经过库 API 后突然从 `send` 变成 `!send`，或反过来，用户会很难定位 world boundary 问题。

建议：

- 在公共 API 名称、类型、文档里显式表现 `send` 边界
- 不要让 `send` 变化只依赖隐藏 capture 或内部 wrapper

### 6.5 不要同时叠加 generics、continuation、overload、`send` 染色在同一公共入口

这几种机制单独使用都可控，但叠加到同一层 public API 时，失败模式会变得非常难解释。

建议：

- 把 continuation-heavy API 与 generic-heavy API 分层
- 让 `send` 检查发生在更靠边界的位置

### 6.6 不要把 trailing closure / layout 规则当作核心语义的一部分

trailing closure 只能改善表面书写，不应成为 API 的语义依赖点。

当前 level-1 已把 trailing closure 收紧为 `f(x) {|args| ... }` 这种 call-site 专用表面；这进一步说明它是语法糖，而不是另一套独立函数系统。

建议：

- API 在无 trailing closure 时也应保持清晰
- 不要依赖换行、brace 位置或 formatter 风格来维持语义

### 6.7 不要让大括号歧义成为公共 DSL 的主要表达力来源

block、record literal、record update、trailing closure 已经共用 `{}` 外形。即使 trailing closure 现已改成 `{|...| ...}` 参数头，若再把大括号当公共 DSL 主入口，仍会迅速扩大 parser 心智负担。

建议：

- 需要 DSL 时优先使用更稳定的 nominal marker、prefix、attribute 或显式函数

### 6.8 不要在公共 API 里直接裸露 `Ptr[T]` / `UnsafeRef[T]` 而不附 ownership 合同

`Ptr[T]` 与 `UnsafeRef[T]` 都属于危险但必要的边界能力。若公共 API 直接返回或接收它们而不说明 keep-alive、upgrade、降级和 `unsafe` 边界，用户最终只会靠猜。

建议：

- 明写 ownership / keep-alive / lifetime 约定
- 把 upgrade / downgrade 做成显式操作

### 6.9 不要为 iter / async / RAII 发明三套互不相通的库风格

既然语言已经计划用 continuation 统一三类模式，库层就不应再把它们做成三套完全不同的 mental model。

建议：

- iter、async、RAII 共享尽量一致的 use-site 表面
- 编译器内部再分成 `IterCont`、`AsyncCont`、`ScopeCont` 等 lowering class

### 6.10 不要让性能 cliff 和编译时间 cliff 不可见

Chiba 的优势建立在“局部、可缓存、可预测”的类型与 lowering 路线之上。若 std / runtime / http 库把真正昂贵的点藏起来，用户会把所有问题都归咎于语言本身。

建议：

- 文档明确哪些 API 会触发新的 specialization
- 工具链可视化 continuation class、specialization key、`send` 失败路径

## 7. 对 std / runtime / http 的直接建议

若希望 Chiba 的日常体验接近 Rust，同时避免在边界上输给 Rust / ML / Zig，最重要的不是继续加 feature，而是守住下面几条纪律：

- public API 优先 nominal、稳定、可解释
- structural / continuation / unsafe 能力尽量下沉到实现层
- continuation 尽早分类，避免全部走通用路径
- specialization key 只纳入真正影响语义的因素
- 对 parser/layout 敏感的糖只做糖，不做语义支点

## 8. 总结

Chiba 最稀缺的地方，在于它不是 Rust、ML、Zig 的简单折中，而是试图把控制结构、structural specialization 和 systems lowering 收进同一个设计里。

它最容易输掉的地方，也正是这里：

- 比 Rust 更依赖 discipline 才能稳住边界
- 比 ML 更难保持整体理论整洁
- 比 Zig 更容易超出语言和工具的实现预算

因此，Chiba 要赢，靠的不是 feature 数量，而是“把 feature 组合后的复杂度压回局部和可见”。