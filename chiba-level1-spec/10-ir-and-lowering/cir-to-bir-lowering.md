# CIR 到 BIR 的 Lowering

## 目标

本条目描述 level-1 中 CIR → BIR 这一步应承担的职责，并用现有 `backend.bir.lower` 作为粗略实现锚点。

这里描述的是默认 lowering 路径，而不是所有目标都必须经过的唯一路径。

这一步不是简单的“把一种 IR 改写成另一种 IR”，而是完成一次职责变化：

- CIR 负责已经通过 type / usage / ownership / world-boundary 检查后的语义表达
- BIR 负责 block / inst / terminator 风格的抽象机表达

因此，CIR → BIR 的核心不是语法改写，而是 materialization：把 CIR 中隐含在 CPS 结构中的控制语义显式化。

这里必须额外强调：

- 当前 `src/backend/cir` 与 `src/backend/bir` 只是 level0 粗实现
- level-1 规范不能把当前数据结构逐条抄成“唯一合法 CIR/BIR 形状”
- 本条目写的是职责边界，不是现状源码逐字段镜像

## 输入与输出

在当前实现锚点里，输入输出大致是：

- 输入：`backend.cir.ir.CpsProgram`
- 输出：`backend.bir.ir.BirProgram`

当前 public entry 是：

```text
lower_cps_to_bir(program: CpsProgram): BirProgram
```

但在 level-1 规范里，更准确的说法是：

- 输入是“已经完成 CIR 层语义检查与必要 specialized rewrite 的 CIR 程序”
- 输出是“适合抽象机执行与后续 LIR 化的 BIR 程序”

在真正进入这一步之前，应允许存在一个插件层。该插件层可以：

- 检查当前 CIR 是否属于自己支持的语义子集
- 接管默认 lowering
- 直接生成目标相关输出或过渡 IR

因此，`CIR -> BIR` 应被理解为默认 native/runtime lowering，而不是强制唯一路径。

## 这一步负责什么

进入这一步之前，以下工作原则上已经在 CIR 完成：

- 类型检查
- RC / arena / FBIP 相关分析
- usage analysis
- `send` 合法性检查与必要重写
- `for` 等 specialized CIR 优化

此外，`for plain` 与 `for control-aware` 的分流也应已经在 CIR 完成。BIR 不负责重新判定一个 loop 是否存在 delimited continuation、外部 `k` 使用、或 `return` 这类非局部退出。

因此，当前 lowering 至少负责以下几类工作：

### 1. FunId / BlockId / VReg 重新分配

CIR 中的 `FunDef.id`、`ContId`、`Var` 不能直接等价视为 BIR 的 `BirFunId`、`BlockId`、`VReg`。

因此 lowering 需要：

- 为 top-level / nested function 分配稳定的 BIR function id
- 为 continuation 分配 block id
- 为 source-level 变量与中间绑定分配 vreg

这一步已经由 `backend.bir.lower` 和 `backend.bir.lower.ctx` 维护。

### 2. continuation materialization

CIR 中的 continuation 仍是 CPS 语义对象。

BIR 中 continuation 不再以 `ContId` 直接存在于表达式树里，而被分别 lower 成：

- 普通 local continuation -> `Block`
- 函数返回 continuation -> `TReturn`
- 特殊 continuation 恢复路径 -> frame / restore_cont 相关结构

因此，`XLetCont` 的 lowering 不是“保留 continuation 定义”，而是：

- 先为 continuation 分配 block
- 把其参数转成 block params
- 把 body lower 成 block 内的 inst + terminator

### 3. tail forms 转成 terminator

CIR 中的 tail position 结构必须在 BIR 中消失为显式 terminator。

当前对应关系应固定为：

- `XAppCont` -> `TJump` 或 `TReturn`
- `XAppFun` -> `TCall` / `TTailCall` / continuation restore 路径
- `XSwitch` -> `TSwitch`
- `XHalt` -> `THalt`

也就是说，BIR block 必须以 terminator 结束，而不再保留 CPS 风格的尾调用表达式树。

### 4. PrimOp 转成 Inst

CIR 的 `PrimOp` 在这一层被 lower 为 BIR `Inst`。

这一步要求：

- 输入 operand 全部已经可映射为 vreg 或立即值来源
- 每条可绑定 primitive 变成一条或少量 BIR inst
- source-level atom / primop 结构不再保留

例如：

- `PIAdd` -> `IIAdd`
- `PTagOf` -> `ITagOf`
- `PMakeTagged` -> `IMakeTagged`
- `PLoad/PStore/PAlloc` -> `IHeapLoad/IHeapStore/IBumpAlloc`
- `PInlineAsm` -> `IInlineAsm`

### 5. 控制语义的抽象机化

这一步最重要的不是普通算术，而是 continuation / prompt / frame 相关语义。

当前 BIR 已经拥有下列抽象机节点：

- `IPushFrame`
- `ICaptureCont`
- `IPushPrompt`
- `TRestoreCont`
- `FrameDesc`

这说明 CIR → BIR lowering 已经承担了把 delimited continuation 与调用返回路径 materialize 到抽象机结构中的职责。

因此：

- prompt / control 在 BIR 中不应再只是“高层控制语法”
- 它们必须通过 frame / block / restore path 的组合被表达

## 关键 lowering 对应关系

以下表格描述当前应被视为稳定方向的 lowering contract。

### Let / tail 结构

| CIR | BIR |
| --- | --- |
| `XLetVal` | `ICopy` / 常量装载后续绑定 |
| `XLetPrim` | 对应 `Inst` |
| `XLetCont` | block 分配 + block lowering |
| `XLetFun` | 生成独立 `BirFun` |
| `XAppCont` | `TJump` 或 `TReturn` |
| `XAppFun` | `TCall` / `TTailCall` / restore 路径 |
| `XSwitch` | `TSwitch` |
| `XHalt` | `THalt` |

### PrimOp 结构

| CIR PrimOp | BIR |
| --- | --- |
| `PI*` 算术/比较 | `II*` / `IICmp` |
| `PB*` | `IB*` |
| `PBit*` / shift | `IBit*` / `IShl` / `IShr` |
| `PTagOf` | `ITagOf` |
| `PMakeTagged` | `IMakeTagged` |
| `PGetField` | `IGetField` |
| `PLoad/PStore/PAlloc` | `IHeapLoad/IHeapStore/IBumpAlloc` |
| `PFfiCall/PCbxCall` | `ICCall` 或等价 call lowering |
| `PInlineAsm` | `IInlineAsm` |

## 当前不变量

基于 level-1 目标与当前实现锚点，CIR → BIR 后至少应满足以下不变量：

1. 每个 BIR block 恰有一个 terminator。
2. continuation 不再以自由 `ContId` 形式悬浮在表达式树中。
3. 进入 BIR 后，值绑定和控制转移被分离成 `Inst` 与 `Terminator`。
4. top-level function 与 nested function 都成为独立 `BirFun`。
5. 需要 runtime / abstract-machine 支持的控制语义，必须在 BIR 中拥有显式节点，而不是继续依赖高层语法含义。
6. 不再把新的类型错误、usage 错误或 `send` 违规留给 BIR 阶段兜底。

## 这一层不负责什么

当前应明确把下列内容排除在 CIR → BIR 职责之外：

- 判定是否改走插件专用目标路径之后的目标专用 emit
- 类型检查
- RC / arena / FBIP 的主要分析
- usage analysis
- `send` 的语义判定
- `for` 的主要结构化优化
- 物理寄存器分配
- 平台 calling convention 细节
- AOT / JIT 输出模式选择
- 机器码级 frame layout 编码
- 硬件 SIMD legalize

这些内容应留给未来的 BIR → LIR / LIR codegen 层。

如果某个插件已经在这一层之前接管并直接产出目标结果，则本条目整体不适用。

## 与现有代码的对应

当前主要锚点：

- `src/backend/bir/lower.chiba`
- `src/backend/bir/lower/ctx.chiba`
- `src/backend/bir/ir.chiba`

下一步需要补的，不是再发明一层新的 CIR/BIR，而是把这些文件中的行为继续整理成更细的 lowering 子条目，例如：

- call / tailcall lowering
- prompt / control lowering
- frame desc 生成规则
- inline asm 从 CIR 到 BIR 的稳定 contract