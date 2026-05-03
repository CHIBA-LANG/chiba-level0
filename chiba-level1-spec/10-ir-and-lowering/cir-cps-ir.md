# CIR

## 目标

level-1 的 CIR 是核心语义层。

它不等于“当前 level0 里那份 CPS 数据结构本身”，但它也不意味着要把 CIR 拆成许多互不兼容的小 IR。当前 `src/backend/cir/ir.chiba` 只能作为一个粗略实现锚点。

在规范里，CIR 指的是一组必须被保留下来的语义职责与分析边界。

当前推荐的数据组织方式是：

- 使用一个覆盖全体合法 CIR 节点的超级大 ADT
- 每个 pass 通过前缀化节点族或稳定子集来表达阶段差异
- 采用类似 nanopass 的小步编译流程，但不要求每一步都更换整套容器类型

例如：

- `L1Call` / `L2Call`
- `L1ForPlain` / `L2ForPlain`
- `L1ForControl` / `L2ForControl`

这里的前缀不是表面命名细节，而是规范层对“pass 后允许出现哪些节点”的显式承诺。

## CIR 必须承接什么

CIR 至少必须承接以下内容：

- 名字解析之后、机器细节之前的大部分语言语义
- 类型检查与类型约束求解
- closure / capture / answer-type / control 相关语义
- pattern、destruct、record update 等结构化语义
- RC / arena / FBIP 的分析与必要重写
- usage analysis
- `send` 与 world boundary 检查
- `for`、`match` 等高层结构的优化机会
- SCC 内共享 context 的分析产物累积

这意味着 CIR 不是一个“纯 lowering 中转站”，而是 level-1 最重要的语义工作层。

## CIR 与 nanopass

推荐采用类似 nanopass 的编译组织方式。

但这里的重点不是“pass 很多”，而是：

- 每个 pass 只做一个小而稳定的结构变化
- 每个 pass 都声明自己消费哪些前缀节点、产出哪些前缀节点
- pass 之间共享同一个 CIR 大 ADT 与 SCC context

这样做有几个直接好处：

- 便于逐步验证 pass 不变量
- 便于为不同 pass 记录 side data，而不需要反复搬运 IR
- 便于做增量编译与并行
- 更容易把编译器做快，因为对象重建、容器切换、跨 pass 序列化的成本更低

因此，Chiba 在 CIR 层更适合“单一大 ADT + nanopass discipline”，而不是“每个阶段都完全换一种 IR 语言”。

## CIR 与类型检查

typecheck 应发生在 CIR。

原因不是“喜欢晚一点 typecheck”，而是因为 level-1 有许多规则不能只靠 surface AST 做完，也不应该等到 BIR 才补救，包括：

- closure capture 与 escape
- `reset` / `shift` 的 answer type
- `send` 的跨 world 合法性
- arena 边界与返回值逃逸
- `for` 相关的迭代变量、累积器、loop-carried state 约束

因此更准确的流程是：

```text
AST
  -> name-resolved AST / early desugar
  -> CIR construction
    -> CIR typecheck + ownership/usage analyses
    -> CIR rewrites / specialization
  -> BIR
```

更细一点地说，这些 pass 运行在同一个 CIR 大 ADT 之上，并把结果逐步写入当前 SCC 的 CIR context。

## CIR 与 SCC context

每个当前正在处理的 SCC，都应拥有一个 CIR context。

这个 context 不是可有可无的辅助表，而应被视为 CIR 阶段的一部分。它至少可以承载：

- 本 SCC 的类型骨架与约束状态
- usage analysis 结果
- RC / arena / FBIP 决策
- `send` / world-boundary 检查结果
- specialization 与 canonicalization 的 side data
- 需要跨 pass 复用的摘要与事实

因此，CIR 并不是“只有一棵树或一个 expr”。更准确地说，它是：

- 一个大 ADT 形式的主 IR
- 一个以 SCC 为作用域的 context
- 一组按 nanopass discipline 组织的变换序列

## CIR 与 `for`

level-1 不应把所有 `for` 都当成同一种东西。

`for` 至少分成两类：

- 用户在写普通循环
- 用户在 `for` 里配合 delimited continuation 造迭代器、流算子或恢复协议

因此 `for` lowering 应有两条 path，而不是一个统一模板。

### 1. plain `for`

plain `for` 走结构化循环路径。

`for plain` 不是按表面语法分类，而是按控制语义分类。

只有当循环体的控制效果被限制在循环局部结构边界内时，它才属于 `for plain`。

这一条路径重点保留：

- induction variable
- loop-carried state
- `break` / `continue` 边界
- 普通循环优化机会

以下情况一旦出现，该 `for` 就不再是 `for plain`：

- 循环体内出现 delimited continuation 相关操作
- 循环体使用外部 continuation，例如外部 `k`
- 循环体出现越过 loop boundary 的非局部退出，例如 `return` 而不是 `break`

### 2. control-aware `for`

当循环体里出现会构造、捕获、恢复 continuation 的操作，或发生对外部 continuation 的使用，或发生越过 loop boundary 的非局部退出时，`for` 不再只是普通循环节点，而是进入 control-aware path。

这一条路径重点保留：

- prompt / control 与 loop body 的关系
- 迭代器或流算子构造时的 continuation 边界
- 恢复点、yield-like 行为或流式组合点
- 非局部退出与 loop boundary 的关系

也就是说，不能把这类 `for` 先粗暴 lower 成 plain loop，再指望后面重新认出控制语义。

无论哪条路径，`for` 都不应一开始就完全压平成最普通的 continuation 跳转，因为那会过早丢失：

- induction variable
- loop-carried state
- 提前退出与 continue/break 的结构边界
- 可做 fusion / peeling / unroll / invariant-hoist 的机会

因此 level-1 应有 `for` 自己的 CIR 形态。它可以是 loop region、loop node，或其它类似 MLIR 的结构化 loop dialect；规范只要求它在 CIR 中保留足够优化信息，不强行规定唯一编码。

## CIR 与当前 level0 CPS 实现

当前 `src/backend/cir/ir.chiba` 提供了一个可工作的 level0 事实：

- `Val`
- `PrimOp`
- `FunDef`
- `ContDef`
- `CpsExpr`
- `CpsProgram`

它说明 CPS/continuation 风格在 Chiba 里是可行方向，但它不能直接推出以下结论：

- level-1 CIR 必须完全等于当前的 `CpsExpr`
- level-1 CIR 不需要单一大 ADT 与 pass 前缀 discipline
- typecheck 可以放在 CIR 之后
- RC / arena / FBIP / usage / send 可以延后到 BIR
- `for` 不需要 dual-path specialized IR

这些结论在 level-1 里都应被拒绝。

## CIR 的最低不变量

无论 CIR 的内部 shape 最终是否还是 CPS 为主，level-1 CIR 至少应满足：

1. 保留足够信息以完成类型检查。
2. 保留足够信息以完成 usage / send / arena / RC / FBIP 分析。
3. 保留高层结构边界，直到相关优化完成，而不是过早全部抹平。
4. 任何进入 BIR 的内容都已经通过 CIR 层的语义与资源检查。
5. 每个 pass 对节点前缀与允许子集的改变必须是显式的。
6. 每个 SCC 的分析与 side data 必须可挂在本 SCC 的 CIR context 上。

## Usage

```chiba
for xs {
    if let Some(v) = next() {
        send worker <- v
    } else {
        break
    }
}
```

对这类代码，CIR 至少要同时保留：

- `for` 的循环边界
- `if let` 的 refutable 结构
- `send` 的 world-boundary 语义
- `next()` 结果的 usage / escape 信息

如果循环体进一步使用 delimited continuation 组装 iterator/stream operator，则同一个 `for` 还应切到 control-aware path，而不是继续按 plain loop 处理。

如果循环体使用外部 `k`，或包含 `return` 这类越过循环边界的退出，也必须切到 control-aware path。

如果一进入 CIR 就把它完全抹平成最低层 block 跳转，后续 typecheck 和 ownership 分析会失去过多上下文。