# IR 与 Lowering

## 目标

本目录描述 Chiba level-1 的 lowering 分层与 pass placement。

它不重复前端 surface syntax，也不把当前 `src/backend` 的 level0 粗实现直接抄成 level-1 规范；它的职责是写清：

- level-1 需要哪些 IR 层
- 哪些语义与分析必须停留在 CIR
- 哪些 lowering contract 可以由当前实现提供参考
- 哪些部分只是未来方向，不能误写成既成事实

当前代码事实可以作为参考锚点，但不能直接等价视为 level-1 稳定规范：

- AST → CIR (`backend.cir.lower`)
- CIR → BIR (`backend.bir.lower`)
- BIR → amd64 asm (`backend.bir.codegen.amd64`)

因此，本目录对现状统一采用两层表述：

- `level-1 规范职责`：这一层在语言设计上必须承担什么
- `level0 实现锚点`：当前代码大致已经做到哪里、哪些地方只是粗略实现

## 总览

level-1 目标中的推荐 lowering 结构为：

```text
AST
  -> CIR
  -> CIR 内部 specialized IR / region
  -> [plugin hook before BIR]
  -> BIR
  -> [plugin hook before LIR]
  -> LIR
  -> AOT / JIT codegen
```

这条主路径不是唯一出口。

level-1 应允许某些目标或编译器插件在进入 BIR 或进入 LIR 之前截断默认 lowering，并直接消费上层 IR。例如：

- 某些 GPU kernel 只消费 CIR，然后直接 emit SPIR-V 与对应 bootstrap glue，而不进入 BIR
- 某些 WASM 目标可能消费 BIR 或 BIR-adjacent IR，而不进入通用 LIR

其中各层职责如下。

### CIR

CIR 是 level-1 的核心语义层，不只是“一个 CPS 形式”。

它至少承担以下职责：

- 承接前端 desugar 后但仍保持语言语义的信息
- 承接类型检查，而不是把 typecheck 推迟到 BIR
- 承接 RC / arena / FBIP / usage analysis / `send` 相关分析与重写
- 承接 closure、pattern、effectful control、ownership/world boundary 等高级语义
- 为 `for` 一类结构提供可优化的 specialized CIR，而不是过早压扁成统一低层 CFG

也就是说，level-1 的 CIR 不应被限定为“当前 `backend.cir.ir` 那样的 CPS 数据结构”；当前代码只是一个 level0 粗锚点。

在规范层面，`CIR` 指的是一组语义职责与不变量。当前推荐形态不是“许多互不相关的小 IR 类型”，而是一个覆盖全体合法 CIR 节点的超级大 ADT，再配合 nanopass 风格的阶段前缀来表达 pass 后的稳定子集，例如：

- `L1Call`
- `L2Call`
- `L1ForPlain`
- `L1ForControl`

也就是说，pass 的结果主要体现在节点前缀、可出现的构造子集合、以及附着在 CIR context 里的分析结果，而不是每走一步就彻底换一套互不兼容的 IR 容器。

其中 `for` 应有自己的 CIR 形态，用于承接类似 MLIR 的 loop-level 优化，而不是一进入 CIR 就立即完全消糖成最普通的 continuation 拼接。

同时，`for` 至少应区分两条 lowering path：

- plain `for`：普通结构化循环，不涉及 continuation 构造
- control-aware `for`：循环体内配合 delimited continuation 构造迭代器、流算子或恢复点

此外，编译单元图也应在 CIR 层固定下来：

- 一个源文件不等于一个最终编译单元
- 一个 package / namespace 子树可以形成多个编译单元
- 编译单元之间先形成依赖图，再做树形并行
- 对互相引用的部分，应先按 SCC 聚合，再在 SCC 内统一进入 CIR/typecheck
- 每个 SCC 在 CIR 阶段都应拥有一个可扩展 context，用来承载该 SCC 的类型、usage、arena、send、specialization 等分析结果

### BIR

BIR 是 Block IR，也是抽象机层。

在 level-1 里，BIR 的职责不是继续承接类型与 ownership 级分析，而是承接已经稳定下来的控制与运行时协议。

它负责把 CIR 中已经确定好的 continuation、跳转、返回、frame、prompt 等语义显式转成 block / inst / terminator 结构。

这一层已经包含 Chiba 抽象机特有的实体，例如：

- block params
- frame_desc
- push_frame
- capture_cont
- restore_cont

因此 BIR 应被视为“控制语义已 materialize 的抽象机 IR”，而不是普通 CFG IR 的轻量变体。

当前 `src/backend/bir` 只说明这个方向已经有粗实现，不能直接当作 level-1 BIR 的完整规范。

同时，BIR 不是所有后端的必经层。默认 native/runtime 路径会进入 BIR，但插件或特定目标可以在 CIR -> BIR 之前截断并改走其它 emit path。

### LIR

LIR 是未来位于 BIR 与最终 codegen 之间的低层 IR。

它的职责是接住 BIR 的抽象机语义，并把它们重新表达为：

- codegen contract
- calling convention contract
- vreg / block / terminator 级低层操作
- runtime intrinsic / platform intrinsic
- inline asm fallback

LIR 不应重新承担 source-level 消糖职责，也不应回头承接 typecheck、usage、send、arena 等 CIR 责任。

同时，LIR 也不是所有目标的必经层。默认 native AOT/JIT 路径会进入 LIR，但某些目标可以在 BIR -> LIR 之前由插件接管，直接 emit 目标相关 IR 或对象格式。

## 当前状态

本目录中的文档统一遵守三条原则：

1. 先写 level-1 想要的层职责。
2. 再用现有 `src/backend` 代码事实做锚点或反例。
3. 对尚未实现的 LIR / LIRJIT 部分，只写与 BIR contract 紧密相连的设计约束，不把 blog 草稿直接当作既成事实。

## 插件层

level-1 应预留至少两个编译器插件入口：

- CIR -> BIR 之间的插件层
- BIR -> LIR 之间的插件层

这些插件层的职责不是“随便改一下 IR”，而是允许目标相关或领域相关后端接管默认 lowering 语义。

典型例子：

- GPU kernel 插件可以识别特定 CIR 子集，直接 emit SPIR-V + Vulkan bootstrap，而不进入 BIR
- WASM 插件可以在 BIR 之后直接生成 WASM 相关 IR 或二进制，而不经过通用 LIR

## 文档清单

- `cir-cps-ir.md`：CIR 的语义角色与不变量
- `compilation-units-and-cir-graph.md`：编译单元、依赖图、树形并行与互引处理
- `compiler-plugins-and-lowering-hooks.md`：插件挂载点、顺序与返回协议
- `ast-to-cir-lowering.md`：前端 AST 如何进入 CIR
- `bir-block-ir.md`：BIR 的角色、不变量与抽象机地位
- `cir-to-bir-lowering.md`：现有 CIR → BIR lowering contract
- `lir-design-and-bir-to-lir.md`：未来 BIR → LIR contract 与 LIR 定位
- `passes-and-placement.md`：各类 pass / analysis 应放置在哪一层

这些文件里，当前优先级已经变成：

- 先把 CIR 层职责和编译单元图写稳
- 再约束哪些分析必须发生在 CIR
- 最后再细化 CIR → BIR 与 BIR → LIR contract