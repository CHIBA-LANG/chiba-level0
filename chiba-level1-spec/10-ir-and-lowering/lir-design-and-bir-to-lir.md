# LIR 设计与 BIR 到 LIR 的 Lowering

## 当前状态

当前代码事实已经存在：

- AST → CIR
- CIR → BIR
- BIR → amd64 asm

但尚未形成稳定 spec 的部分是：

- LIR 的正式角色定义
- BIR → LIR lowering contract
- LIR 与 AOT / JIT codegen 的关系

本条目先不假装这些已经全部实现，而是先把未来这一步应承担的职责写清楚。

这里同样描述的是默认 native lowering 路径。它不是所有目标的必经阶段。

## LIR 的定位

LIR 应位于 BIR 与最终 codegen 之间。

它不是 source-level 语义层，也不是直接的机器码文本层。

它的职责应当是：

- 承接 BIR 的抽象机语义
- 把这些语义改写成 codegen-friendly 的低层 contract
- 为 AOT 与 JIT 提供共享的输入层

但这一定义只约束“选择进入 LIR 的后端”。例如某些 WASM 路径可能不会进入通用 LIR，而是在 BIR 之后直接进入专用 emitter。

因此，LIR 的主要读者不是前端，而是：

- regalloc
- instruction selection
- intrinsic expansion
- AOT emitter
- JIT emitter

## 为什么还需要 LIR

当前 BIR 虽然已经有 block / inst / terminator，但它仍然过于靠近抽象机语义：

- `TCall` / `TReturn` / `TTailCall` 仍是高层调用终结子
- `FrameDesc`、`IPushFrame`、`ICaptureCont` 仍偏 runtime 抽象
- `IInlineAsm` 仍保留前端/中层形态
- 平台 calling convention、ret 寄存器、frame layout、intrinsics 还没有被统一落到低层 contract

LIR 的作用就是把这些“抽象机节点”继续压到一层更接近 codegen 的操作上。

## BIR → LIR 这一步负责什么

在真正进入这一步之前，应允许存在一个插件层。该插件层可以基于当前 BIR：

- 接管默认 lowering
- 直接生成特定目标 IR
- 直接生成对象格式或字节码

因此，`BIR -> LIR` 是默认 native codegen 路径中的低层收敛步骤，而不是所有目标的强制共同子路径。

### 1. 调用与返回的 ABI 化

BIR 中：

- `TCall`
- `TTailCall`
- `TReturn`

还只是抽象机 terminator。

进入 LIR 后，应把它们展开成对 Cbx ABI / C ABI 有意义的低层操作序列。

当前 blog 中已经给出明确方向：

- `TCall` -> `PUSH_FRAME + JUMP`
- `TTailCall` -> `POP_FRAME + JUMP`
- `TReturn` -> `POP_FRAME + RETURN_DISPATCH`

这里的重点不是“用哪几条机器指令”，而是把 BIR 的调用返回语义重新表达成 LIR 的低层 calling convention contract。

### 2. frame / continuation 语义的低层展开

BIR 中的：

- `IPushFrame`
- `ICaptureCont`
- `TRestoreCont`
- `FrameDesc`

已经说明抽象机里有 frame / continuation 概念。

LIR 层应进一步决定：

- frame header 的低层字段 contract
- return address / resume block 的低层表示
- continuation capture / restore 到底走 runtime helper 还是内联片段
- current_frame / fragment_top / ctx 等保留寄存器 contract

也就是说，BIR 负责“存在 frame/cont 这回事”，LIR 负责“它们如何被 codegen 读取和更新”。

### 3. inline asm 与 intrinsic 的分流

这是你当前设计里非常关键的一条。

BIR 中已有：

- `IInlineAsm`

但 blog 已明确提出一个未来方向：

- 尽量把大多数 metalstd asm 块识别并 lower 成平台无关 intrinsic
- 只有极少数真的 raw asm 保留为 `LIR_INLINE_ASM`

因此 BIR → LIR 需要承担一次分流：

1. 识别可以被 intrinsic 化的 BIR 操作
2. 将其改写为 `LIR_INTRIN_*`
3. 仅把无法抽象的部分保留为 `LIR_INLINE_ASM`

这一步会直接决定未来 metalstd 能否自然跨平台。

### 4. vreg / low-level block contract

blog 中已经把 LIR 设想为：

- VReg-based
- Block + Terminator
- allocator 之后再展平

这意味着 BIR → LIR 不应马上掉到物理寄存器，而是应先做一层“低层但仍未寄存器分配”的规范化。

所以 LIR 里最值得固定的不是具体机器码，而是：

- 低层 vreg 语义
- 低层 block 边界
- terminator 形式
- memory operand contract
- intrinsic operand contract

## 建议的 lowering contract

当前最适合先固定的，不是所有 LIR 指令，而是以下 contract。

### BIR 调用终结子

| BIR | LIR 方向 |
| --- | --- |
| `TCall` | frame push + low-level jump |
| `TTailCall` | frame pop + low-level jump |
| `TReturn` | return-value setup + frame pop + return-dispatch |
| `TRestoreCont` | resume frame setup + runtime helper / specialized restore path |

### BIR 控制与运行时节点

| BIR | LIR 方向 |
| --- | --- |
| `IPushFrame` | frame header writes + fragment pointer advance |
| `ICaptureCont` | runtime helper call / low-level cont capture sequence |
| `IPushPrompt` | prompt stack update / runtime structure write |
| `ICCall` | C ABI call sequence |
| `IInlineAsm` | intrinsic recognition or `LIR_INLINE_ASM` fallback |

### BIR 普通值操作

普通算术、位运算、heap load/store 等，则更接近一对一 lowering：

- `IIAdd` -> `LIR_ADD`
- `IHeapLoad` -> `LIR_LOAD`
- `IHeapStore` -> `LIR_STORE`
- `IBumpAlloc` -> 优先 `LIR_INTRIN_HEAP_ALLOC`

## LIR 应该在哪些地方比 blog 更保守

blog 中已经提出大量非常具体的 LIR 指令与 ABI 设计。这些内容有价值，但 spec 层应先保守地固定 contract，再固定所有指令细节。

我建议先把下列内容写成稳定方向：

1. LIR 共享给 AOT 与 JIT。
2. LIR 负责承接 BIR 的抽象机语义，而不是重复 source 消糖。
3. 大部分 metalstd asm 的目标方向是 intrinsic 化，而不是永久保留 raw asm。
4. 调用/返回/frame/cont 必须在这一层落实成低层 ABI contract。
5. regalloc、SIMD legalize、instruction selection 都属于 LIR 之后或 LIR 内部 pass，而不属于 BIR。
6. 是否进入通用 LIR，本身可以由目标插件决定；spec 不要求所有目标必须共享这一层。

至于以下内容，可以继续保留为“当前设计方向，待进一步压实”：

- 完整 LIR 指令全集
- ret0/ret1 的最终平台约定
- frame header 的最终字段布局
- current_frame 缓存是否按架构固定 reserve
- JIT patching 的最终 low-level primitive 集

## 与 blog 的关系

当前最直接的设计锚点是：

- `blog/2024-04-18-JIT.md`

但这篇 blog 不应直接等同于稳定 spec。

更合适的关系是：

- blog 提供未来 LIR / LIRJIT 设计方向
- 本目录把其中与当前 BIR contract 直接相关的部分提炼成规范约束

## 下一步最该细化的三件事

1. `TCall / TTailCall / TReturn` 到 LIR 的正式 lowering 表
2. `IInlineAsm -> intrinsic | LIR_INLINE_ASM` 的判定规则
3. frame / continuation 在 BIR 与 LIR 之间的责任切分

这三件事一旦写清，LIR spec 就会真正从 blog 草稿变成 lowering contract。