# Pass 与 Placement

## 目标

本条目回答一个核心问题：哪些分析与变换必须发生在 CIR，哪些才应该下沉到 BIR 或 LIR。

如果放置错层，会直接导致要么过早丢语义，要么过晚才发现错误。

这里默认的 CIR 组织方式是：

- 一个超级大 ADT 覆盖所有合法 CIR 节点
- pass 用前缀化节点族表达阶段差异
- 同一 SCC 共享一个 CIR context
- 整体按类似 nanopass 的小步变换推进

这里同时默认一条“主 lowering 路径”，但允许插件在两个位置截断它：

- CIR -> BIR 之前
- BIR -> LIR 之前

## 必须发生在 CIR 的内容

### 类型检查

typecheck 应发生在 CIR。

这是 level-1 的硬约束，不应继续沿用“先粗 lower，再在后面补语义”的 level0 做法。

### RC / arena / FBIP

RC、arena、FBIP 相关分析与必要重写应发生在 CIR。

原因是这些规则依赖：

- 值的结构化来源
- escape 边界
- closure capture
- `reset` / `return` / `send` 等跨边界动作

一旦过早进入 BIR，这些关系会被 block / vreg / terminator 形式遮蔽得过深。

### usage analysis

usage analysis 应发生在 CIR。

它既影响 type/ownership 诊断，也影响后续是否允许就地更新、是否需要 retain/release、是否能把值安全地下沉到 arena 或提升到 heap。

### `send` 检查

`send` 应在 CIR 被检查与重写。

因为 `send` 的本质不是普通 call，而是 world boundary transfer。它依赖：

- 值是否可发送
- 是否发生 move / clone / retain
- 哪些 capture 或借用会跨 world 泄漏

这些都属于 CIR 级语义，不属于 BIR 机器协议层。

### `for` 的 specialized 优化

`for` 的主要优化也应发生在 CIR。

至少包括：

- loop normalization
- induction variable 识别
- loop-carried state 整理
- invariant hoisting 的前置判定
- 结构化 `break` / `continue` 重写

但 `for` 不应只有一条 lowering path。

至少要区分：

- plain `for`
- control-aware `for`

后者用于循环体内配合 delimited continuation 构造迭代器、流算子或恢复协议的情况。

更具体地说，只要循环体：

- 出现 delimited continuation 相关操作
- 使用外部 continuation，例如外部 `k`
- 出现 `return` 这类越过 loop boundary 的非局部退出

它就不再属于 plain `for`。

为此，`for` 应保留自己的 CIR 形态或 specialized region，而不是一开始就完全打平成通用 CPS/CFG。

## 推荐的 CIR pass 组织

推荐把 CIR pass 组织成一条 nanopass 风格流水线，例如：

1. `L0*` 或 raw CIR：前端初次建模，保留高层结构
2. `L1*`：名字、类型骨架、基础约束稳定
3. `L2*`：usage / ownership / world-boundary 结果写回 context
4. `L3*`：plain `for` 与 control-aware `for` 分流并做 specialized rewrite
5. `L4*`：准备进入 BIR 的 canonical CIR

这里的 `L0/L1/L2...` 是说明 pass discipline，不要求具体数字必须固定；关键是每一步都显式声明自己消费和产出的前缀节点。

这种组织方式的目的之一，就是把编译器做快：

- 减少整棵 IR 重建
- 减少跨阶段容器切换
- 让 side data 留在 SCC context 中复用
- 让并行与缓存边界更稳定

## 主要发生在 BIR 的内容

BIR 主要承接已经确定好的控制与运行时协议，包括：

- continuation materialization
- frame / prompt / control 的抽象机化
- block / terminator 化
- 对 runtime intrinsic 的显式化

在这一层，重点是把语义组织成可执行抽象机，而不是继续做高层 ownership/type 诊断。

但若 CIR 侧插件已经接管默认 lowering，例如 GPU kernel 直接从 CIR emit SPIR-V，则这一步可以被绕过。

## 主要发生在 LIR 的内容

LIR 主要承接代码生成前的低层约束，包括：

- calling convention 具体化
- 物理寄存器与栈槽相关的低层协议
- 平台 intrinsic 与 inline asm 的最终落点
- AOT/JIT 共享的低层 codegen contract

但若 BIR 侧插件直接面向目标输出，例如某些 WASM 路径直接消费 BIR，则这一步可以被绕过。

## 一个简单判定法

可以用下面这个判定法快速决定某个 pass 应放哪一层：

- 如果它依赖 source-level 结构、类型、escape、ownership、world boundary，放 CIR。
- 如果它依赖 continuation/frame/prompt 的显式控制协议，放 BIR。
- 如果它依赖 ABI、寄存器、栈布局、平台机器约束，放 LIR。

## Usage

```chiba
for item in xs {
    send(worker, item)
}
```

对这段代码，推荐 placement 是：

- CIR：验证 `item` 是否可 `send`，分析 move/retain，决定 loop 体里的资源转移策略
- CIR specialized loop：先判断它是 plain `for` 还是 control-aware `for`，再做 loop normalization 与 usage-aware rewrite
- BIR：把循环退出、继续、调用边界 materialize 成 block/terminator
- LIR：把最终调用约定、runtime helper、寄存器约束落到平台相关形式