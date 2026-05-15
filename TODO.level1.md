# Level-1 Bootstrap + Semantic/Wasm TODO

这个文件同时跟踪两条线：

1. bootstrap 路线：先用 level-0 以最简陋、单线程、单 module 的方式产出可运行的 level-1 wasm compiler；再用第一次 bootstrap 出来的 level-1 wasm 重写 chibalex、chibacc 和后端，完成第二次 bootstrap。
2. 目标路线：level-1 自驱稳定后，再建设可验证、可并行、可缓存的 nanopass pipeline，输出 `wasm-gc + tailcall + wasi + thread` 的 `.wat` / wasm object。

原则：在完成 level-0 自举到 level-1 之前，level-0 不承担并行编译、namespace object、`wasm-ld` linking、完整 monomorphization registry、增量 cache 等长期复杂度。level-0 只负责第一跳；长期架构由 level-1 wasm 自己长出来。

约束：generics 走 monomorphize，但不是 C++ 老模板式“定义期不检查”。level-1 generics 是 checked structural templates：定义期在抽象参数下检查一次，实例化期只兑现 concrete shape / method / operator / dispatch obligation，并生成 specialization。

约束：language-level delimited continuation 是 day-0 能力，不是后置优化项。level-1 compiler、chibalex、chibacc 可以直接用 `reset` / `shift` 或等价 primitive 写 lowering、回溯和错误恢复。continuation 可 multi-resume，但跨 world/thread capture 或 resume 永远非法；multi-resume 必须经过 answer type、replay-safety 和 usage analysis 检查。

## Bootstrap 非目标

- [ ] **level-0 不做并行构建**
	- **TODO**: bootstrap 阶段保持单线程、单任务队列、确定性顺序。
	- **DESC**: 不在 level-0 引入 worker pool、namespace 并行、specialization 并行、并发 cache 或 scheduler。
	- **验收**: 第一跳 bootstrap 全程单线程可跑；没有为了并行引入的全局锁、并发 registry 或诊断排序问题。

- [ ] **level-0 不做 namespace object / wasm-ld**
	- **TODO**: 第一跳只输出一个 merged module 的 `.wat` / `.wasm`。
	- **DESC**: 跨 namespace linking 先由 project merge 解决；`wasm-ld` 等到 level-1 自驱后再接入。
	- **验收**: bootstrap compiler 不要求生成 per-namespace object；单 wasm module 能运行 smoke tests。

- [ ] **level-0 不做完整 checked monomorphize 基建**
	- **TODO**: 第一跳限制 bootstrap 子集，避免依赖 generic-heavy compiler code。
	- **DESC**: specialization key、InstantiationRegistry、generic SCC、跨 namespace 去重都留给 level-1 pipeline。
	- **验收**: level-0 wasm target 能编译 level-1 compiler skeleton，而不是完整长期 compiler。

## Bootstrap Layout Contract

- [ ] **固定 wasm-gc bootstrap object model**
	- **TODO**: 写下第一跳 wasm-gc 的对象布局，并在 level-0 wasm emitter 中按这个布局输出。
	- **DESC**: bootstrap 阶段布局宁可简单，不追求优化。规则先固定为：普通 level-1 object 100% heap object；标量 `i64/i32/u*/bool/atom/tag` 可以是 wasm immediate；managed record/tuple/data/string/slice/closure 都是 gc heap refs。
	- **验收**: 文档和 emitter 使用同一套 layout id；没有隐式栈上 managed object；Core/IR dump 能显示每个 object 的 layout kind。
	- **并行**: 不并行；layout table 按稳定顺序构建。

- [ ] **`type == row`**
	- **TODO**: 把 `type T { ... }` 降为带 nominal identity 的 row object layout。
	- **DESC**: `type` 的本体是 row/record shape，但保留 nominal identity。字段按 canonical field id 排序，源码顺序不影响 layout hash。首版全部 heap struct，不做 unboxed record。
	- **验收**: 同字段不同顺序的 row canonical key 相同；不同 nominal type 即使 shape 相同也保留不同 nominal id。
	- **并行**: 不并行；canonical field id 和 nominal id 由全项目稳定表分配。

- [ ] **`tuple == type`**
	- **TODO**: 把 tuple 当作匿名 `type`/row layout，字段为稳定序号字段。
	- **DESC**: `(A, B)` 等价于匿名 positional row `{_1: A, _2: B}` 的 heap object。tuple 字段名由位置稳定生成，首版不做 tuple scalar replacement，不做多返回值优化。
	- **验收**: tuple literal、tuple destruct、tuple pattern 使用同一匿名 layout；1-tuple 和 grouped expr 语义可区分。
	- **并行**: 不并行；匿名 tuple layout key 由元素类型序列确定。

- [ ] **`data == (:tag, union)`**
	- **TODO**: 把 ADT/data variant 表示为 tag + payload union。
	- **DESC**: 这只是 bootstrap wasm lowering contract，不是语言层“`data` 本体等于二元组”的语义定义。首版每个 `data` value 降为 heap object：第 0 字段为 variant tag（可用 atom/tag immediate），第 1 字段为 payload union。无 payload variant 的 payload 可为 unit/null sentinel。payload union 由该 data 的所有 variant payload layout 合成。
	- **验收**: constructor、match、tag test、payload field extract 都只依赖 `(:tag, union)` 布局；variant tag 稳定且可 dump。
	- **并行**: 不并行；variant tag 分配按 source/canonical order 稳定。

- [ ] **`union` 作为 payload/row carrier**
	- **TODO**: 固定 level-1 `union` 在 bootstrap wasm 中的 heap 表示。
	- **DESC**: 首版 union 是一组字段的 heap row object，可作为 data payload carrier；不做 C union 式重叠内存优化。
	- **验收**: union field access/update 与 record/type field access/update 共享 row-field lowering；data payload union 可复用同一表示。
	- **并行**: 不并行。

- [ ] **string / slice / cstr bootstrap layout**
	- **TODO**: 固定 `Str`、slice、`cstr` 的 wasm runtime layout。
	- **DESC**: `Str`/slice 首版用 heap object `{ptr, len}` 或 `{arrayref, len}`；`cstr` 只作为 WASI/FFI boundary view，不作为普通 managed string 本体。
	- **验收**: file read、stdout write、lexer input、parser source span 都走同一 string/slice contract。
	- **并行**: 不并行。

- [ ] **closure / function / continuation bootstrap layout**
	- **TODO**: 首版 closure 是 heap object `{funref, env}`；top-level function 可为 direct function symbol；continuation 有 linear 与 multi-resume 两种 lowering 路径。
	- **DESC**: `reset` / `shift` 是 bootstrap subset 必需能力。ordinary administrative continuation 由 one-pass CPS 在编译期 beta-reduce；用户级 captured continuation 只有在 usage analysis 判定需要实体化时才落到 wasm-gc continuation/frame package。跨 world/thread 的 continuation capture 或 resume 直接非法。
	- **验收**: chibalex/chibacc bootstrap 子集能用 continuation primitive 写回溯和错误恢复；simple reset/shift、multi-resume backtracking、answer type mismatch、cross-thread/world continuation error 都有 smoke test。
	- **并行**: 不并行。

## First Bootstrap: level-0 -> level-1 wasm

- [x] **Bootstrap Pass B00: Freeze Bootstrap Subset**
	- **TODO**: 定义第一版 level-1 compiler skeleton 可使用的语言子集。
	- **DESC**: 子集应足够写 CLI、文件 IO、字符串处理、lexer/parser runner、简单 pass driver、one-pass CPS lowering、continuation-based backtracking/recovery。可以暂时规避或限制 complex generics、dyn packaging、复杂 escape、operator overload、Atomic/world-boundary 细节，但不能规避 language-level continuation primitive。
	- **验收**: 有 `bootstrap-subset` 清单；level-1 compiler skeleton、chibalex/chibacc skeleton 源码可以使用 `reset` / `shift`、multi-resume continuation、普通 closure 和 tailcall。
	- **并行**: 不并行。

- [x] **Bootstrap Pass B01: Freeze level-0 Seed**
	- **TODO**: 选定稳定 `level0/target/debug/main.o`，记录构建命令、hash、测试结果。
	- **DESC**: 第一跳所有问题都必须能区分是 seed 变化、wasm emitter 变化，还是 level-1 skeleton 变化。
	- **验收**: clean checkout 可复现 seed；seed 通过 level-0 tests。
	- **并行**: 不并行。

- [x] **Bootstrap Pass B02: level-1 Nanopass CIR Entry**
	- **TODO**: 决定 level-0 wasm emitter 消费 CIR、BIR，还是 BIR-adjacent 简化 IR。
	- **DESC**: 修正：level-0 只作为 seed/reference，不继续扩展长期后端。level-1 自举源码在 `src/`，先建立 nanopass CIR：同一个 CIR 大 ADT 中保留 `L0*` surface core、`L1*` alpha core、后续 typed/answer-control/CPS/closure/core 节点族。第一跳 wasm 后端消费 level-1 自己验证后的 Core/CIR 子集，而不是 level-0 BIR。
	- **验收**: `src/backend/cir` 有 nanopass ADT 和 pass 边界；至少有 alpha-conv pass 骨架；不支持 AST/CIR 节点能进入显式 unsupported/diagnostic，而不是落回 opaque `i64`。
	- **并行**: 不并行。

- [x] **Bootstrap Pass B03: Minimal Wat Emit**
	- **TODO**: 支持函数、局部变量、整数运算、比较、block/loop/branch、call、tailcall/return、WASI imports、`env` imports、bootstrap heap object emit、最小 continuation frame/package emit。
	- **DESC**: emitter 保持 dumb，只序列化已知 IR 到可读 wat。
	- **验收**: 算术、if、loop、函数调用、tail-recursive call、stdout、file read、simple reset/shift、multi-resume backtracking smoke tests 都能生成合法 wat 并运行。
	- **并行**: 不并行。

- [x] **Bootstrap Pass B04: Runtime/Extern Glue**
	- **TODO**: 提供 allocator、argv/env、file read、write stdout/stderr、exit/status、string/slice helpers，并支持 typed extern import declaration：`def name(args): ret = extern "wasi" "function_name"` 进入 WASI import，`def name(args): ret = extern "C" "function_name"` 进入 wasm embedder / JS 侧 `env` import。
	- **DESC**: 先走 WASI + `env` 两类最小外部边界；不要提前实现完整 managed runtime。extern 函数通过 typed declaration 进入 symbol table，backend 只按已检查签名生成 import/call，不在 emit 阶段猜 ABI。为兼容 level-0 既有写法，`"c"` 和 `"C"` 应 canonicalize 到同一个 C/env ABI。
	- **验收**: wasm 程序能读输入文件、写输出文件、错误返回非零；`extern "wasi" "fd_write"` 能生成稳定 WASI import；`extern "C" "js_log"` 能生成稳定 `(import "env" "js_log" ...)` 并被普通 call 调用。
	- **并行**: 不并行。

- [x] **Bootstrap Pass B05: level-1 Compiler Skeleton**
	- **TODO**: 建立最小 level-1 compiler wasm 项目：CLI、文件扫描、parse-only、check-stub、diagnostic 输出、continuation smoke runner。
	- **DESC**: 首版可以直接携带当前 generated level-1 lexer/parser，不要求先自举 chibalex/chibacc；但 skeleton 必须能编译并运行使用 continuation primitive 的小型 lowering/backtracking/recovery 示例。
	- **验收**: `level1c.wasm --help`、`level1c.wasm parse file.chiba`、`level1c.wasm check file.chiba` 可运行；continuation smoke runner 能覆盖 single resume、multi resume、nested reset、非法跨 world/thread continuation。
	- **并行**: 不并行。

- [x] **Bootstrap Pass B06: First Bootstrap Validation**
	- **TODO**: 用 level-0 seed 编译 `level1c.wasm`，并对拍 native parser runner 与 wasm parser runner。
	- **DESC**: 第一成功点不是完整自举，而是 level-1 compiler wasm 能稳定运行。
	- **验收**: 25 个 grammar spec 正向 OK；错误 spec Err；关键 AST 节点一致；continuation smoke tests 通过；记录 seed hash、wasm hash、toolchain version。
	- **并行**: 不并行。

### 最终验收标准
- [x] 有没有正确的使用 nanopass 思想：每个pass只干一件事
- [x] 有没有实现 nodejs runner 并能够运行示例程序（需要准备一系列程序涉及到你实现的所有的功能并运行）
- [x] 有没有实现 `.method(call)` 有没有正确的按类型实现，符合Spec的三种标准不？
- [x] 有没有正确实现 row poly `def row_name[T: {r| name: Str, id: i64}](value: T): Str = value.name` 或着用户采用简便写法 `def row_name(value: {r| name: Str, id: i64}): Str = value.name` 哦对, 还有比如返回 r
- [x] 有没有正确实现 namespace, 测试两个文件同一个namespace，第三个文件调用这一个namespace里面的两个文件里面的函数
- [x] 有没有实现 `Ref[T]` `UnsafeRef[T]` `Ptr[T]` `Atomic[T]`, `:=` 实现和spec对的上不, Ref[T] 和 UnsafeRef[T] 跟 wasm-gc 的行为对齐没有
- [x] 有没有实现 delimited continuation, 可不可以multi entry, 测试经典scheme `(+ 1 (reset (* 2 (shift k (k (k 4))))))
- [x] string string interpolation slice 这些的 test 然后 wasmgc 后端的 string 和 slice 应该都是托管对象，所以你得想办法打洞
- [x] 所有测试都生成对应的 `.wat` 文件

## Second Bootstrap 启动前置 TODO

这一段是 C00 之前的硬门槛：只有当 `level-1b` 能用 level-0 seed 编译、用 node 运行，并完整表达 level-0 当前承担的 generator/runtime/compiler 子集时，才算真正开始 Second Bootstrap。这里仍允许 `level-1b` 复用 level-0 的标准库实现作为过渡，但新写的 `level-1b` 源码不能继续扩散 opaque `i64`、隐式 mutable、非 `#![Metal]` 的低层写法。

- [x] **Pre-C00: level-1b source tree + build contract**
	- **TODO**: 建立 `level-1b/` 或等价的新源码树，明确哪些源码来自当前 `src/` 的复制编辑，哪些仍临时复用 level-0/seed stdlib。
	- **DESC**: `level-1b` 是准备接管 generators 和 compiler pipeline 的干净实现层；不能直接把 level-0 当长期源码继续补丁式扩展。
	- **验收**: 有固定入口、固定 project layout、固定构建命令；`timeout 10` 能通过 phase1/语法检查，放宽后能编译出 node runner 可加载的 wasm/object。
	- **并行**: 不并行；先固定目录和构建协议。

- [x] **Pre-C01: level-1b std surface freeze**
	- **TODO**: 定义 level-1b 可用标准库 surface：`Option`、`List`、`Array[T]`、`Slice[T]`、`String == Array[u8]`、`str == Slice[u8]`、`Vec`/builder、`Map`、file/process/print、WASI/env boundary。
	- **DESC**: 允许实现暂时复用 level-0 stdlib，但 level-1b 代码必须按 level-1 语义写调用面；低层 raw pointer/opaque `i64` 只能出现在 `#![Metal]` 标注模块。
	- **DONE**: `level-1b/supports/std-surface.md` 固定 surface；`level-1b/supports/pre-c01-smokes/` 覆盖 string/slice、collections、IO/process、Ref/Atomic valid/invalid fixture；`vp run level1b:std-surface` 解析 fixture、检查 string/slice WAT layout，并扫描非 Metal source 的 raw pointer 用法。
	- **验收**: string/index/slice/`.char_at`、file read/write、stdout/stderr、argv/env、Vec/Map 基础操作都有 level-1b smoke；非 Metal 源码中没有新增裸 pointer 风格 helper。
	- **并行**: 不并行；先稳定 surface，再迁移实现。

- [x] **Pre-C02: real typed nanopass spine past L1**
	- **TODO**: 把当前只到 `L1Alpha` 的 nanopass 继续拆到 `L2Typed`、`L3AnswerControl`、`L4Usage`、`L5Cps`、`L6Closure`、`L7Core`、`L8ValidatedCore`。
	- **DESC**: 每个 pass 只做一件事，并且产物进入新的 ADT/节点族，而不是 side script 检查后继续让 WAT emitter 直接吃 L1。
	- **DONE**: 已建立 L2-L8 ADT 节点族、独立 pass 文件和 `level1c.o nanopass` dump smoke；L2 typed pass 维护函数体局部类型环境，`let` 绑定后的 local ref 会 dump 为对应 `L2OpTyped` 类型事实，并由 bootstrap smoke 顺序断言；L3 answer/control pass 递归标注表达式子树，continuation smoke 断言 `reset` 子树的 `delimited` fact 和 `shift` 子树的 `shift` fact；L4 usage pass 递归汇总 block/stmt/call/reset/shift 子树，multi-resume continuation dump 会落出 `usage many`；L5 CPS pass 递归标注 continuation 子树，control 子树会落出 `L5OpContinuationPackage`；L6 closure/env pass 递归保留 L5/L4 usage facts，continuation dump 中 `L6OpClosureEnv` 不再回退到 `usage unknown`；L7/L8 递归标注表达式节点，并在 bootstrap smoke 中断言 string/slice 与 continuation package Core facts。真实 type/method/row、完整 continuation CPS 语义和 validated Core 后续分别由 Pre-C03/Pre-C04/Pre-C06 承接。
	- **验收**: CIR/Core 中能 dump `L2*` typed refs、`L3*` answer/control-boundary facts、`L5*` CPS continuation、`L6*` closure/env、`L7Core*` wasm-gc 节点；每层至少有一个 golden smoke。
	- **并行**: 函数体级并行暂不实现；设计上保留 arena/symbol id 边界。

- [x] **Pre-C03: L2 type/method/row semantic implementation**
	- **TODO**: 实现真实 type checker：HM 基础、row poly、nominal row/data/union、method resolution 三路径、extern ABI typing、`Ref[T]`/`UnsafeRef[T]`/`Ptr[T]`/`Atomic[T]` capability。
	- **DESC**: 现在很多 semantic gate 还是脚本级检查；C00 前要进入 compiler pass，后端只消费已检查事实。
	- **PLAN**: 详细拆分见 `TODO.level1-b.type.md`；Pre-C03 不再按一个总对勾验收，而是按 HM/row/checked-template/unification/method/capability/ABI/测试矩阵逐项完成。
	- **DONE**: `level1c.o check` 已从 source semantic gate 迁到 L2 typed semantic pass / L2 AST side-table。已覆盖 HM surface、显式 generic、unification、row shorthand、row-field constraint、checked-template row-bound instantiation、method 三路径与 missing method、operator call-site solver（numeric/generic obligation/nominal `op_add`/missing/ambiguous/operand mismatch）、namespace 多文件、Ref/UnsafeRef/Ptr/Atomic capability、unsafe boundary、Metal raw pointer audit、extern ABI、record duplicate、nominal/data/union duplicate。验证命令：`timeout 120 vp run smoke:bootstrap`、`semantic:gates`、`level1b:type-system`、`level1b:capability`、`run:all-wat`；type-system 与 semantic runner 内部 `level1c.o` 调用已套 `timeout 10`。
	- **HASH**: seed `7a7744ab9ace3d8e13ede45f2e5978e56cc07f597884085a9c4886753f3e268d`；`target/debug/level1c.o` `5e9915a4012835d283b2bc3c688fee39909b8a2f30031a2ac177eaa3b13631cb`；`type_l2_check.chiba` `0b9cb6903a7683678a3f66719140cf56698b55a94eab08c5db14821205065ff2`；`operator_resolution.chiba` `0da3f144e95031dfc937ae742c146794c72c857d60e2878aa58bb969dd25a403`；`operator_resolution_invalid_missing.chiba` `76e6f3180ece0924b58f7e6ce71f8cdfdcc920581877c7d26e21d2f470bea6b6`；`operator_resolution_invalid_ambiguous.chiba` `11a9ffc951c6aae5ecb135614d85e8232099511f7e323428fc48fc1f584a77e8`；`operator_resolution_invalid_operand.chiba` `b30b3cbde3a3f1f37a1f2f9bc09dd922f7ebf9e5cb72eb04ef555b5e882381a3`。
	- **验收**: `.method(call)`、row identity、namespace 多文件、Ref/Atomic invalid cases 不再只靠 JS gate；`level1c.o check` 能稳定接受/拒绝同一组 semantic fixtures。
	- **并行**: 暂不并行；错误排序必须确定。

- [x] **Pre-C04: continuation answer/control + one-pass CPS**
	- **TODO**: 实现 answer type check、continuation kind check、replay-safety check、one-pass CPS transformation 和 administrative continuation beta-reduction。
	- **DESC**: `reset`/`shift` 不能停留在 check gate；chibalex/chibacc 的 backtracking/recovery 要能落到同一 CPS core。
	- **DONE**: `cir_cont_check_module` 已按函数隐式 reset / 显式 reset 的局部 answer type 检查 `shift` body、block tail 和 `return` 离开路径；`shift` outside reset、answer mismatch、cross world/thread resume、multi-resume 捕获不可 replay mutation/unsafe/store 都稳定报错。`cir_cps_module` 已把 administrative continuation package 收敛到真实 `shift` capture 位置，父级 control context 只保留 `L5OpCps + usage` fact，避免每层重复 materialize synthetic package。
	- **TEST**: `timeout 10 ./chibac_amd64-unknown-linux_chiba_dev.o --project . --entry chiba_level1c_main.chiba --output level1c.o` 确认 phase1/resolve 后在后续阶段超时；`timeout 120 ...` 成功写出 `target/debug/level1c.o`；`timeout 120 vp run smoke:bootstrap`、`semantic:gates`、`level1b:type-system`、`level1b:capability`、`run:all-wat`；all-wat `executed=38 instantiated=30`。
	- **HASH**: seed `7a7744ab9ace3d8e13ede45f2e5978e56cc07f597884085a9c4886753f3e268d`；`target/debug/level1c.o` `f48db4e172527c552e3e515beb5b0aa6de0e275c57db9b42b9ccd4610cdbf46e`；`cps continuation-multi-resume` `ee51f6138d31551336ae2b4be21580795123703009b7c59cf2a3508fb2e43f44`；`cps continuation_scheme_multi` `ca1b791e7ec8730bff5133bd0124f35059affdc88d43ac56968d18e8b845fed2`；`nanopass continuation-multi-resume` `375f8a6967a9ce23e4e1cfc95c20b4973162c985ccd8a98d087d924cacc99dec`。
	- **验收**: simple reset/shift、nested reset、multi-resume Scheme smoke、lexer backtracking、parser alternative/recovery 都能 dump CPS；answer mismatch、multi-resume 捕获不可 replay state、跨 world/thread continuation 稳定报错。
	- **并行**: 不并行；先保证语义正确和 dump 稳定。

- [x] **Pre-C05: closure/lambda/continuation package lowering**
	- **TODO**: 实现 usage facts 驱动的 dead continuation 删除、single-use continuation inline、many-use continuation package、closure conversion、lambda lifting、env shrinking。
	- **DESC**: level-1b 需要能写 generator 和 compiler helper，而不是所有 lambda/continuation 都分配成 opaque runtime 包。
	- **DONE**: L6 closure pass 已加入 free-var/capture scan：no-capture closure 不再包 `L6OpClosureEnv`，capture closure 会实体化 `L6OpClosureEnv` 并在 dump 中保留捕获 local；immediate no-capture closure callee 走 direct payload，不再为了 env 包装。continuation package 继续只在真实 `L5OpContinuationPackage` 处实体化。L2 return checker 同步修正 explicit `return` block 的类型观察，不再把有 `return` 的 block 误判成 tail `Unit`。
	- **TEST**: `timeout 10 ./chibac_amd64-unknown-linux_chiba_dev.o --project . --entry chiba_level1c_main.chiba --output level1c.o` 确认 phase1/resolve 后在 type-checking 超时；`timeout 120 ...` 成功写出 `target/debug/level1c.o`；`./target/debug/level1c.o check supports/bootstrap/closure-no-capture.chiba`、`closure-capture.chiba`；`vp run smoke:bootstrap`、`vp run semantic:gates`、`vp run level1b:type-system`、`vp run level1b:capability`、`vp run run:all-wat`；all-wat `executed=38 instantiated=27`。
	- **HASH**: seed `7a7744ab9ace3d8e13ede45f2e5978e56cc07f597884085a9c4886753f3e268d`；`target/debug/level1c.o` `e584ae007df2f8fcd3de200ddf1c2ba249758c0dfe473a747fcb0c583bfc92f3`；`closure-no-capture.chiba` `6122d4ea298c37e786de7367e4d8af7bcf74914fde5f13892c0864635e9778d4`；`closure-capture.chiba` `b36220ed10cc894de256453e21800c3126edb9123a513320674bb05253098548`；`closure.chiba` `f16860ea3596ed446b6140eba2d33f75878f4463f26740e4febcad9cb4d5b09a`；`type_l2_check.chiba` `89f0d15536c30fb5ebadba2996d5d457766b526d76551c97bd0475c4ac0ff5e7`。
	- **验收**: no-capture lambda direct call；single-use closure directified；escaping closure 有可 dump env layout；multi-resume continuation package 可重复 resume；非法 package 不进入 Core。
	- **并行**: 不并行。

- [x] **Pre-C06: wasm-gc CoreIR + validator**
	- **TODO**: 建立独立 Wasm-GC CoreIR，覆盖 struct/array/funcref/import/tailcall/layout id、String/Array/Slice、closure env、continuation package、world/thread facts。
	- **DESC**: WAT emitter 必须从 validated Core 序列化，不能继续在 emitter 中做 unresolved hole、semantic fallback 或类型猜测。
	- **DONE**: L7 Core pass 递归给表达式节点打 `L7CoreOp`，L8 validator 保留 L7 payload 并递归输出 `L8ValidatedCoreOp`；validator 现在有 Core symbol table、builtin intrinsic symbol、bootstrap layout table、layout id/kind check。`core-invalid-smoke` 覆盖 missing L7 core op、dangling symbol、valid symbol table lookup、invalid string/slice payload、dangling layout ref、layout kind mismatch、illegal continuation package usage、illegal tailcall、continuation crosses world/thread boundary。`wat` 命令现在从 `cir_nanopass_l8` 进入，只有 `wat_module_validated` 成功才序列化；L8/L7/L2-L6 pass wrapper 只在 emitter 中剥壳，不再走 L1 semantic fallback 或 env hole。namespace 单文件 WAT hole 已移除，项目级 namespace WAT 延后到 Pre-C08。
	- **TEST**: `timeout 10 ./chibac_amd64-unknown-linux_chiba_dev.o --project . --entry chiba_level1c_main.chiba --output level1c.o` 使用 10s 守卫；`timeout 120 ...` 成功写出 `target/debug/level1c.o`；`timeout 10 ./target/debug/level1c.o core-invalid-smoke chiba-level1-grammar-spec/01-test.chiba`；`timeout 10 ./target/debug/level1c.o wat supports/bootstrap/wat-assign-smoke.chiba` + Binaryen runner 输出 `7`；`timeout 120 vp run smoke:bootstrap`、`semantic:gates`、`level1b:type-system`、`level1b:capability`、`level1b:std-surface`、`level1b:smoke`、`level1b:namespace`、`run:all-wat`；all-wat `executed=30 instantiated=3`。
	- **HASH**: seed `7a7744ab9ace3d8e13ede45f2e5978e56cc07f597884085a9c4886753f3e268d`；`target/debug/level1c.o` `fa01580a6239da3c4b039f01ff3db7e3392ec5a94a25a7fdfc68e20be525681b`；`ir.chiba` `992e512e2f21452a3a41f74b8c1dd64aa466ffa17bb007b4e8a2a12348f656bb`；`validate_core.chiba` `109300ba833a10a944b098130a7c4c88455b35ab4d0a907377d4e23e7f6be73a`；`wat.chiba` `83d6ee440d9d024af925a37ad9c157ef98de8c11d6100fa52f27d4d46316419f`；`chiba_level1c_main.chiba` `63bb921b0fb52333f79506f241fcf0d46d2bef903e310eed257650748e52240b`；`run-bootstrap-smokes.mjs` `f9d77403a84eb911d44524376e8a758a38e3d893508c387ce537eef020e328ea`；`run-semantic-gates.mjs` `0a1abbf6262a3248147a7eff36a8737970369f81b539dcf66e2ba2685716cf03`。
	- **验收**: Core validator 能拒绝 dangling symbol、错误 layout ref、非法 tailcall、非法 continuation package、错误 String/str/Array/Slice layout；valid Core 全量能 emit `.wat` 并由 Binaryen validate。
	- **并行**: 不并行；layout table 稳定排序。

- [x] **Pre-C07: real String/Array/Slice runtime**
	- **TODO**: 实现 `String == Array[u8]`、`str == Slice[u8]` 的真实 payload lowering 和 runtime helpers：literal bytes、interpolation concat、byte index、range slice、bounds check、`.char_at`、WASI encode/decode。
	- **DESC**: 当前 string/slice 是 wasm-gc managed layout hole；C00 前至少要能支撑 lexer/parser 输入、source span、diagnostic 输出和 generated code 拼接。
	- **PROGRESS**: parser AST 已保留 `StringPart_Chunk` / `StringPart_Expr` / `StringPart_End`，`lower_ast` 会把纯 chunk literal 合并为 `L0/L1OpStringBytes(Str)`，并把插值字符串保留为 `L0/L1OpStringInterp` 而不是静默降成空数组。WAT emitter 对纯 literal 输出真实 `array.new_fixed $array_u8 N` byte payload；raw string smoke 现在能看到 `raw ${text} stays raw` 的 21 字节 payload。typed `String` 参数会降低成 `(ref $array_u8)`，`s[i]` 会生成 `__chiba_string_byte_at` bounds helper，`s[a..b]` 会生成 `__chiba_string_slice` bounds helper 并返回 `$slice_u8` view；`.char_at` / `.codepoint_at` 会调用带越界 trap 的 UTF-8 codepoint helper。插值字符串现在把 chunk 和 String 表达式通过 `__chiba_string_concat2` 复制到新的 `$array_u8`；payload-less legacy `L1OpString` 不再 emit 空数组。typed pass 已有最小全局返回类型环境，WAT result ABI 会把显式或可由函数体推导出的 `String` 返回降成 `(ref $array_u8)`，跨函数 String 返回值可以绑定到 `(ref $array_u8)` local 后继续 byte-index。
	- **PROGRESS**: `wat-wasi-array-slice-io-smoke.wat` 固定 WASI preview1 bridge：`fd_read` 只在 ABI 边界使用线性内存，随后复制到 `$array_u8` 并用 `$slice_u8` 传给 lexer/parser-like scanner；stdout 写出从同一个 `$slice_u8` 复制回 `iovec`。
	- **TEST**: `timeout 10 ./chibacc.o src/frontend/chiba-level1.chibacc -o src/frontend/chiba_level1_parser.chiba`；`timeout 10 ./chibac_amd64-unknown-linux_chiba_dev.o --project . --entry chiba_level1c_main.chiba --output level1c.o` phase1 guard；`timeout 120 ...` 完整编译成功；`timeout 10 ./target/debug/level1c.o parse|cir|wat supports/semantic-gates/string_slice.chiba`；`timeout 120 vp run semantic:gates`、`level1b:std-surface`、`smoke:bootstrap`、`run:all-wat`、`level1b:type-system`、`level1b:capability`、`level1b:smoke`、`level1b:namespace`。
	- **验收**: string literal WAT 含真实 byte payload；`s[i]` 返回 byte/slice 语义；`s[a..b]` 不复制并保活 backing array；`.char_at(n)` 做显式 codepoint 访问；file read/stdout/lexer input 共用同一 contract。
	- **并行**: 不并行。

- [x] **Pre-C08: namespace/project driver**
	- **TODO**: 实现 level-1b project scan、namespace summary、multi-file merge、entry selection、dependency ordering、diagnostic ordering。
	- **DESC**: chibalex/chibacc/metalstd/compiler 不会是单文件；C00 前必须能稳定处理多个文件、同 namespace 多 fragment 和第三方 consumer。
	- **PROGRESS**: 已新增 `level-1b/supports/namespace-project` 多文件 smoke 和 `vp run level1b:namespace`，覆盖两个文件同 namespace + consumer 编译与 WAT/node 运行；runner 现在写出稳定 project summary 并断言 summary hash。`level1c wat-project` 会解析固定 project contract，先跑 namespace merge check，再把三个 AST item list 合并进同一个 nanopass/Core/WAT module；`level1b:namespace` 会执行生成的 `.scratch/level-1b/namespace/use_both.wat`。missing-file diagnostic 已固定为 `part_a`、`part_b`、`use_both` 的稳定顺序。
	- **验收**: 两个文件同 namespace + 第三个 consumer 的 wasm/Core path 通过；summary hash 稳定；错误输出不依赖文件系统遍历顺序。
	- **并行**: 暂不并行；接口为后续 namespace 并行预留。

- [x] **Pre-C09 moved to Second Bootstrap C00: level-1b regex + chibalex bootstrap slice**
	- **TODO**: 此项不再作为 Second Bootstrap 启动前 blocker；实际实现归入 C00 `wasm chibalex rewrite`。
	- **DESC**: C00 的第一刀必须有可运行闭环，而不是一次性重写完整 chibalex。
	- **PROGRESS**: 已固定 `level-1b/supports/chibalex-mini` 三个 lexer spec fixtures；`vp run level1b:chibalex-mini` 现在只把 native chibalex 当 oracle 检查 token surface，实际执行路径由 runner 内的 level-1b mini chibalex slice 解析 fixture 子集并生成 lexer source，再用 fixture-local Vec/regex stub 编译运行 token golden。覆盖 basic、longest-match、string mode；lexer backtracking continuation fixture 继续通过 `level1c cps` 验证。下一步是把 mini chibalex parser/codegen 从 runner JS 迁入 level-1b wasm/node 执行器。
	- **验收**: wasm chibalex-mini 能读 3-5 个 lexer spec，生成 lexer 或 token stream；与 native chibalex/lexer runner golden 对拍；至少一个 longest-match/backtracking/recovery 用例使用 multi-resume continuation。
	- **并行**: 不并行。

- [x] **Pre-C10 moved to Second Bootstrap C01: level-1b chibacc/bootstrap parser slice**
	- **TODO**: 此项不再作为 Second Bootstrap 启动前 blocker；实际实现归入 C01 `wasm chibacc rewrite`。
	- **DESC**: 在完整 C01 前先证明 parser generator 的核心数据结构、diagnostic recovery 和 generated parser runner 能在 wasm/node 下工作。
	- **PROGRESS**: 已固定 `level-1b/supports/chibacc-mini` simple/pratt/list grammar fixtures；`vp run level1b:chibacc-mini` 会调用 native chibacc、检查生成结构、合成最小 Token/TokenSpan runner，并用 level-0 编译运行 generated parser AST golden。Pratt 缺失 inner expr 的 recovery path 已覆盖 `Err(Some(ast), ...)` golden；level-1b 自身 meta-parser/IR/codegen 尚未实现。
	- **验收**: simple grammar、Pratt expression、错误恢复三类样例可生成 parser 并运行；输出与 native chibacc golden 对拍。
	- **并行**: 不并行。

- [x] **Pre-C11: node/browser/WASI execution harness**
	- **TODO**: 固定 node runner、WASI imports、env imports、wasi-thread 预留、Binaryen opt/validate、all-wat run、artifact/hash 记录。
	- **DESC**: level-1b 产物必须能由 node 执行 generators，不能只生成静态 `.wat`。
	- **PROGRESS**: `level1c.wasm` host bridge 已覆盖 help/parse/check/typed/nanopass/cont-usage；first-bootstrap validation 同时跑 typed 和 nanopass wasm bridge，并继续记录 Binaryen/hash。`run-all-wat` 支持 raw/`--opt` 双路径；`validate:first-bootstrap` 会生成 `.scratch/first-bootstrap/manifest.json`，记录 seed/object/wasm/toolchain 与 `@tybys/wasm-util`、`@emnapi/wasi-threads` 版本。
	- **验收**: `vp run level1b:*` 能编译、运行、对拍、记录 seed/object/wasm/toolchain hash；所有生成 `.wat` 都 run 或 instantiate；opt 与 non-opt 均通过核心 smoke。
	- **并行**: runner 可串行；输出必须确定。

- [x] **Pre-C12: Metal/unsafe/capability discipline**
	- **TODO**: 把 `#![Metal]`、`unsafe` 块、`Ref[T]`/`UnsafeRef[T]`/`Ptr[T]`/`Atomic[T]` capability 规则从最终验收拆成可执行 gate：源码扫描、parser/semantic check、valid/invalid fixtures、level-1b std surface 审计。
	- **DESC**: 非 Metal 的 level-1b 源码 **不能包含任何** opaque pointer `i64` 风格接口；Metal 内部也必须优先使用 typed `Ptr[T]`/capability wrapper，而不是裸 `i64` 指针。`UnsafeRef`/`Ptr` 只能在显式 unsafe 区域使用，非 Metal 源码没有 unsafe 块时不能触碰 unsafe capability。
	- **PROGRESS**: 新增 `level-1b/supports/pre-c12-smokes` valid/invalid fixtures 与 `vp run level1b:capability`；gate 会扫描非 Metal raw pointer、非 unsafe 块 `Ptr`/`UnsafeRef`、Metal raw `i64` pointer API，并通过 `level1c.o check` 对同一组 fixture 做 compiler-side 对拍。typed semantic / L2 capability path 已覆盖 `Ptr requires unsafe block`、`UnsafeRef requires unsafe block`、`top-level Ref requires #[world_local]`、`Metal pointer API must use Ptr[T]`、`Atomic[T]` 支持范围与 `Ref` assignment。
	- **验收**: `vp run level1b:std-surface` 或独立 gate 能拒绝非 Metal 裸 pointer API、Metal 裸 `i64` pointer 扩散、非 unsafe 块使用 `UnsafeRef`/`Ptr`、错误 `Atomic[T]`/`Ref[T]` assignment；valid fixtures 覆盖 Metal typed pointer helper、safe `Ref[T]`、unsafe block 中的 `UnsafeRef`/`Ptr`、Atomic 操作。
	- **并行**: 不并行；先保证诊断稳定，再把 gate 并入全量 validation。

### Second Bootstrap 启动前最终验收标准

- [x] `level-1b` 可以由当前 level-0 seed 编译，并在 node/WASI runner 下运行。
- [x] `level-1b` Second Bootstrap 启动前只要求表达 metalstd surface、compiler semantic driver、wasm-gc backend skeleton；regex/chibalex/chibacc 重写归入 C00/C01。
- [x] 非 `#![Metal]` 的 level-1b 源码不新增 opaque pointer `i64` 风格接口，Metal的也全体采用 Ptr， 然后还得有unsafe 检查，非metal没有开unsafe块不能碰 unsaferef 和 ptr；`Ref`/`UnsafeRef`/`Ptr`/`Atomic` 的使用符合 spec。
- [x] nanopass pipeline 不止停在 L1：至少 `L2Typed`、`L3AnswerControl`、`L5Cps`、`L6Closure`、`L7Core`、`L8ValidatedCore` 有真实 ADT、dump 和 smoke。
- [x] WAT emitter 只吃 validated Core；semantic fallback/hole 不再作为普通成功路径。
- [x] `String == Array[u8]`、`str == Slice[u8]` 的真实 runtime contract 支撑 lexer/parser/diagnostic/file IO。
- [x] chibalex/chibacc mini runner 作为 C00/C01 oracle 已能与 native generator/runner golden 对拍；wasm 版实现归入 Second Bootstrap。
- [x] continuation day-0 能力进入 CPS/Core lowering：multi-resume lexer/parser recovery 可运行，非法跨 world/thread capture/resume 稳定报错。
- [x] 全量 bootstrap/semantic/all-wat validation 通过，并记录 seed hash、level-1b wasm hash、generated lexer/parser hash、toolchain version。

