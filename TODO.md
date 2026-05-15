
## Second Bootstrap: level-1b -> level-1c 自举路线

Second Bootstrap 的目标不是把当前 `src/` 复制一份继续补丁式扩展，而是用 level-1 的语言风格重写一个干净的 `level-1b` 编译器，然后由它生成和运行 `level-1c`。现有 `src/`、level-0、native chibalex/chibacc 只作为 oracle、golden 和过渡工具。

原则：

- `level-1b` 源码必须大量使用 doc comment：public API、namespace、pass entry、核心 ADT、unsafe/Metal 边界、runtime ABI 都用 `///` 写明 contract；不写 block comment。
- 非 `#![Metal]` 源码不新增 opaque pointer `i64` 风格接口，不做隐式 internal mutability；需要低层能力时通过 `Ptr[T]`、`UnsafeRef[T]`、`Atomic[T]`、`Ref[T]` 和显式 `unsafe`。
- Chiba 风味优先：method、pipe、pattern、不可变值组合、FP style；让 optimizer / usage / CPS / closure pass 负责 inline/directify。
- `chibac` CLI 遵循 spec：`chibac <file>... -I <dir>* --target wasm32-unknown-wasi --backend wasm-gc -o <file>`；用户层命令留给 `chiba`。
- target/backend predicate 统一为 `target="wasm32-unknown-wasi"`、`backend="wasm-gc"`。
- `level-1c` 才是 Second Bootstrap 后的主线；C00-C03 先固定 `metalstd/std/prelude`，C04 以后再迁移 regex/chibalex/chibacc/compiler pipeline。

## Second Bootstrap 库边界

- [ ] **C00: level-1b source tree + chibac driver contract**
	- **TODO**: 重新整理 `level-1b/`：`metalstd/`、`std/`、`prelude/`、`compiler/`、`tools/`、`tests/` 分目录；保留当前 `src/` 作为 oracle，不作为直接复制目标。
	- **TODO**: 实现/固定 `chibac` driver 参数 surface：`<file>...`、`-I/--include`、`--target/-t`、`--backend/-B`、`-o/--out`、`--emit`、`-S`、`-c`、`-E`、`-O0/-O1/-O2/-O3/-Os/-Oz`、`-g`、diagnostic flags。
	- **TODO**: 默认 target 为显式传入，不 silent fallback；level-1b 唯一 backend 是 `wasm-gc`。
	- **TODO**: `///` doc comment 进入 lexer/parser source model，并保留 source span；`#[doc(path="...")] namespace` 进入 surface scan；不实现任何 block comment。
	- **验收**: `timeout 10 chibac ...` 能过 source load/parse/header scan；错误 target/backend/unknown flag 有稳定 diagnostic；`chibac --emit parse` 能输出含 doc/comment span 的 parse surface。
	- **并行**: 不并行；先固定目录与 CLI contract。

- [ ] **C01: metalstd contract + rewrite**
	- **TODO**: 明确 `metalstd` 只包含必须贴近 backend/host ABI 的能力，并且每个文件必须 `#![Metal]`。
	- **包含**: allocator / raw memory primitive、WASI preview1 boundary、`env` import bridge、process exit/args/env low-level bridge、file descriptor read/write bridge、typed `Ptr[T]` primitive、`UnsafeRef[T]` primitive、`Atomic[T]` primitive、Wasm-GC array/struct helper intrinsic、panic/trap intrinsic。
	- **不包含**: `Option`、`List`、`Map`、`Vec`、String API、parser helpers、regex combinator、普通用户 IO facade、任何非必要 high-level collection。
	- **TODO**: 所有 Metal API 用 typed surface 暴露：`Ptr[T]` / `UnsafeRef[T]` / `Ref[T]` / `Atomic[T]`，不再把 pointer/resource handle 伪装成普通 `i64`。
	- **TODO**: Metal 中也优先使用 `.method` 和 doc comment；unsafe 边界必须由 `/// Safety` 段落说明调用前提。
	- **验收**: 非 Metal scanner 不发现 raw pointer `i64` helper；Metal API 有 doc comment；`Ptr`/`UnsafeRef`/`Atomic` invalid smoke 稳定报错；WASI/env import smoke 可运行。
	- **并行**: 不并行；这是 std/prelude 的底座。

- [ ] **C02: std contract + rewrite**
	- **TODO**: 明确 `std` 是普通 Chiba 用户可见库，依赖 `metalstd`，但不向用户暴露 Metal 的存在。
	- **包含**: `Option[T]`、`Result[T,E]`、`List[T]`、不可变 `Array[T]`、`Slice[T]`、`String == Array[u8]`、`str == Slice[u8]`、`Vec[T]` builder、`Map[K,V]` / `StrMap[V]`、`Range[T]`、iterator/sequence 基础、String byte index/slice/`.char_at`、file/process/stdout/stderr facade、diagnostic string builder。
	- **TODO**: API 用 method + pipe-friendly free function 组合；复杂 builder 可以内部用 `Ref`，但 mutable 能力必须在类型上可见并可被 usage/escape 分析。
	- **TODO**: `String`/`str` 明确采用 wasm-gc managed `Array[u8]` / `Slice[u8]`；`s[i]` 是 byte，`s.char_at(i)` 是 UTF-8 codepoint。
	- **TODO**: std 中 public API 全部有 `///` doc comment，跨符号引用使用 `[std.ns.Symbol]`。
	- **验收**: collections/string/io/process smoke 能 parse/check/wat/run；String/Slice WAT layout 与 spec 一致；std 不包含 `#![Metal]` 专属 primitive 的裸调用泄漏。
	- **并行**: 可按模块推进，但 public surface 先冻结。

- [ ] **C03: prelude contract + default import**
	- **TODO**: 明确 `prelude` 是默认导入层，依赖 `std`，不直接依赖 `metalstd`。
	- **包含**: 常用类型别名/导出 `Option`、`Result`、`Array`、`Slice`、`String`、`str`、`Vec`、`Map`、`Range`；常用构造/组合函数 `Some`、`None`、`Ok`、`Err`、`print`、`println`、`panic`、`assert`、基础 `map/filter/fold` facade。
	- **TODO**: 所有非 `#![Metal]` 文件默认插入 `use prelude.*`；`#![no_prelude_import]` 禁用默认导入。
	- **TODO**: `#![Metal]` 文件默认不导入 prelude；Metal 需要的 helper 必须显式 `use`。
	- **验收**: 普通 source 不显式 use 也能使用 prelude symbol；`#![no_prelude_import]` 后同一 symbol 未导入时报错；`#![Metal]` 不隐式导入 prelude。
	- **并行**: 不并行；会影响 name resolution。

## Second Bootstrap C-pass

- [ ] **C04: regex rewrite in level-1b**
	- **TODO**: 用 level-1b + std/prelude 重写 regex AST/parser/compiler/matcher，支持 UTF-8/WTF-8 byte model、Unicode-aware character classes、lookahead、lookbehind、lookaround、longest-match 所需能力。
	- **DESC**: regex 是 chibalex 的底座；必须以 Chiba 风味实现，避免 level-0 旧 matcher 的 opaque pointer 风格。
	- **验收**: regex unit/golden 覆盖 literal、class、repeat、capture、lookahead/lookbehind/lookaround、UTF-8 boundary；node runner 可执行。
	- **并行**: 不并行；先保证语义。

- [ ] **C05: wasm chibalex rewrite**
	- **TODO**: 用 level-1b regex 编写新的 chibalex，包括 `.chibalex` parser、lexer IR、mode/state、longest-match、string/raw-string mode、token codegen。
	- **DESC**: 新版 chibalex 可以直接用 language-level continuation primitive 写 speculative scan、rollback、longest-match 或错误恢复。
	- **验收**: wasm chibalex 读取重写后的 `chiba-level1.chibalex` 并生成 lexer；token stream 与 native oracle 一致；至少一个 lexer backtracking/recovery 用例通过 multi-resume continuation smoke test。
	- **并行**: 不并行。

- [ ] **C06: wasm chibacc rewrite**
	- **TODO**: 用 level-1b 编写新的 chibacc，包括 `.chibacc` meta-parser、grammar IR、Pratt table、recovery IR、parser codegen。
	- **DESC**: chibacc 是语法演化核心。新版 chibacc 应直接用 continuation primitive 表达 parser alternatives、Pratt recovery、局部 retry 和 diagnostic recovery。
	- **验收**: wasm chibacc 能处理 simple/pratt/recovery/list 样例；生成 parser 行为与 native chibacc oracle 一致；multi-resume parser alternative 与 recovery 用例有 golden output；现有 level-1 grammar 也要重写到新 grammar surface。
	- **并行**: 不并行。

- [ ] **C07: source surface + project driver rewrite**
	- **TODO**: 用 level-1b 接管 source loading、`chibac` CLI parse、include path、doc comment capture、namespace/project surface scan、compile_if filtering、diagnostic ordering。
	- **DESC**: 从这里开始日常编译入口不再依赖 level-0 的 project glue。
	- **验收**: 多文件同 namespace + consumer project 通过；`#[doc(path="...")] namespace` 和 `/// namespace` surface 可 dump；compile_if target/backend 使用 `wasm32-unknown-wasi` / `wasm-gc`。
	- **并行**: 暂不并行，接口保留并行边界。

- [ ] **C08: alpha + typed semantic driver rewrite**
	- **TODO**: 在 level-1b wasm 内接管 alpha conversion、pattern elaboration、HM+row inference、checked template definition check、nominal method/operator index、extern ABI typing、Ref/UnsafeRef/Ptr/Atomic capability。
	- **DESC**: 这是 `level-1c` compiler 的 semantic gate；所有 binder 先 alpha-renamed，后续 pass 不再按裸名字判断绑定。
	- **验收**: type-system gate、row/method/operator/namespace/extern/capability gate 全部由 level-1b pass 通过，不靠 JS side script。
	- **并行**: 先单线程，错误排序必须稳定。

- [ ] **C09: continuation answer/control + usage + CPS rewrite**
	- **TODO**: 用 level-1b 接管 answer type check、continuation kind check、multi-shot replay-safety、cross world/thread boundary check、usage analysis、one-pass CPS + beta-reduction。
	- **DESC**: language-level delimited continuation 是 day-0。不要引入 effect 命名；这里的事实叫 answer/control、continuation usage、replay-safety、boundary。
	- **验收**: simple/nested reset-shift、classic Scheme multi-shot、lexer backtracking、parser recovery 通过；answer mismatch、multi-shot 捕获不可 replay state、cross world/thread continuation 稳定报错。
	- **并行**: 函数体级接口预留，先单线程。

- [ ] **C10: closure/lambda/continuation package rewrite**
	- **TODO**: 用 level-1b 接管 CPS usage analysis、continuation simplification、closure conversion、lambda lifting、closure/env shrinking、multi-shot continuation package lowering input。
	- **DESC**: no-capture/single-use lambda 和 continuation 必须 directify/inline；只有 many-use continuation 才实体化为 replayable package。
	- **验收**: no-capture lambda 不分配 closure；single-use closure direct call；multi-shot package env capture 可 dump；非法 Ptr/UnsafeRef/world/thread capture 不进入 Core。
	- **并行**: 函数体级接口预留。

- [ ] **C11: wasm-gc Core/backend rewrite**
	- **TODO**: 用 level-1b 接管 Wasm-GC Core lowering、layout table、Core validation、runtime glue、WAT emitter、Binaryen compile/opt runner。
	- **DESC**: Core 明确表示 struct/array/funcref、closure env、continuation frame/package、tailcall、thread/world boundary facts；backend emitter 保持 dumb，只序列化已验证 Core。
	- **验收**: level-1b backend 能生成 `level1c-next.wat/wasm`；Core validator 能拒绝 dangling symbol/layout、非法 tailcall、非法 continuation package；tailcall 与 multi-shot continuation smoke 通过。
	- **并行**: 不并行；layout 表稳定排序。

- [ ] **C12: Second Bootstrap validation**
	- **TODO**: 完成 `level1c.wasm -> level1c-next.wasm -> level1c-next2.wasm` 两轮自举对拍。
	- **DESC**: 第二次 bootstrap 完成的含义是 level-1 wasm 已接管 metalstd/std/prelude、regex、chibalex、chibacc、semantic driver、usage/CPS、closure/lambda lifting、wasm-gc Core/backend 和单线程 driver。
	- **验收**: `level1c-next.wasm` 和 `level1c-next2.wasm` 能重跑 lexer/parser specs、semantic/type gates、continuation smoke、core/backend smoke；关键 IR 输出一致或差异有 manifest 解释；记录 seed hash、level1c hash、level1c-next hash、toolchain versions。
	- **并行**: 不并行；这是收敛验证点。

## Long-term Pipeline 总览

- [ ] **Pass 00: Project Surface Scan**
	- **TODO**: 扫描项目文件，解析 source file header、`namespace`、`use`、item header、attrs、public/private surface，不进入函数体语义。
	- **DESC**: 这是全项目最轻的串行/低并行度 pass，用来构建 namespace graph 和后续并行任务队列。函数体、表达式、局部类型推断都不在这里做。
	- **验收**: 给定 N 个 source file，能产出稳定排序的 `ProjectSurface`；重复 namespace、非法 source-file header、显式 entry 冲突能报错；输出不依赖文件系统遍历顺序。
	- **并行**: 文件级 parse 可并行；最终合并 namespace graph 需要确定性 reduce。

- [ ] **Pass 01: Interface Summary Build**
	- **TODO**: 为每个 namespace 生成接口摘要：导出函数签名、type/data/union layout header、method header、static header、generic parameter headers、约束头、可见性。
	- **DESC**: 这是并行编译的边界。跨 namespace 的 body 编译只读 summary，不读对方函数体。summary 必须足够支撑 name resolve 和 definition-time typecheck。
	- **验收**: 任意 namespace 可独立加载依赖 namespace 的 `.chiba.meta` / in-memory summary；修改非导出函数体不改变 summary hash；修改导出签名会改变 summary hash。
	- **并行**: namespace 级并行；依赖环只允许在 signature 层形成 SCC，SCC 内做确定性合并。



- [ ] **Pass 02: TopDef / Kind Check**
	- **TODO**: 检查顶层定义 kind：函数、extern、static、type、data、union、method-style `def Type.method`、generic header、row bound header、`via` 可见路径 shape。
	- **DESC**: 只检查 header 良构性和重复定义，不解析 body。extern declaration 的 day-0 surface 是 `def f(args): ret = extern "abi" "symbol"`；wasm backend 至少支持 `abi == "wasi"` 和 canonical C/env ABI（接受 `"C"` 与 `"c"`，内部归一化）；其他 future ABI 必须在这里稳定报错。长期 level-1 主线先以 row / shape / structural obligation 为 generic header 基础；若未来恢复 namespace-scoped named constraints，应作为 level-2 扩展单列，不默认进入本 pass 的 level-1 contract。`send`/`!send`、world boundary、Atomic 先作为 builtin capability family 处理，不进入普通 method/interface 世界。
	- **验收**: 能拒绝重复 top-level symbol、重复 constructor、非法 generic bound、多个 row bound、method receiver 非 nominal、`private` 跨 namespace 泄漏。
	- **并行**: namespace 级并行；全局 symbol table 合并需要确定性冲突报告。

- [ ] **Pass 03: Name Resolve**
	- **TODO**: 把 body 内所有 value/type/path 引用解析为稳定 symbol id；处理 `use`、inline namespace、constructor、field、method 名称，并为未来 level-2 的 `via namespace` 显式来源保留扩展钩子。
	- **DESC**: 解析结果不携带具体类型，只携带绑定目标和候选索引。generic body 中 shape-dependent method/operator 不在这里最终决议，只生成可延迟的候选引用。`via namespace` 若保留，作为未来 level-2 显式行为来源钩子，不应成为 level-1 默认解析前提。
	- **验收**: 未定义名称、二义性 import、不可见 private、错误 namespace path、错误 constructor arity 能报错；同一输入多次编译 symbol id 稳定。
	- **并行**: namespace body 可并行；只读 ProjectSurface 和 InterfaceSummary。

- [ ] **Pass 04: Alpha Conversion**
	- **TODO**: 给函数体、pattern binding、lambda、continuation binder、generic local binder 分配唯一 id，并消除 shadowing/capture 歧义。
	- **DESC**: alpha conversion 是 usage analysis、one-pass CPS、closure conversion、lambda lifting 的地基。后续 pass 不再按裸名字判断绑定关系。
	- **验收**: 同名 shadowing 的 body 产生不同 binder id；capture 不会因改名改变语义；alpha dump 稳定且可 golden test。
	- **并行**: 函数体级并行；body-local id 可用 scoped arena，summary 边界只暴露稳定 symbol id。

- [ ] **Pass 05: Pattern Elaboration**
	- **TODO**: 把 `let` / `if let` / `match` / function parameter pattern 规范化为 `PatternCore`，并标记 refutable / irrefutable、binding set、constructor/literal/record/tuple destruct。
	- **DESC**: 先把 pattern 语义从表达式 typecheck 中拿出来。不同位置的 pattern 支持矩阵在这里落实：`let` 只接受 DFT irrefutable 子集，`if let` / `match` 接受 refutable pattern。
	- **验收**: 能拒绝 `let` 中可能失败的 constructor/literal pattern；能发现重复 binding；能产出 match exhaustiveness 输入所需的 pattern matrix。
	- **并行**: 函数体级并行；每个 body 只依赖 resolved/alpha AST。

- [ ] **Pass 06: HM + Row Inference**
	- **TODO**: 做基础 HM 推断、unify、let-generalization、row/open-row 约束生成、field access / record update / tuple / ADT / function type 检查。
	- **DESC**: 这是 value type 的主推断层，但不做 method/operator 最终选择，不做 monomorphization，不做 escape。row 必须 canonical：字段稳定 id、稳定排序、hash 不依赖编译顺序。这里同时固定 tuple 的 positional row 字段 `_1`, `_2`, ...，以及不可变 `Array[T]` 的基础类型行为。
	- **验收**: 能输出 `TypedAst` + `ConstraintSet` + canonical row/shape ids；错误包括普通类型不匹配、缺字段、record update 不合法、非法 let-generalization。
	- **并行**: 函数体级并行；type variable id 分配使用 per-task arena，合并时重编号或使用 scoped id。

- [ ] **Pass 07: Answer / Continuation Kind Check**
	- **TODO**: 检查 `reset` / `shift` answer type、implicit reset、continuation kind、resume count contract、multi-resume replay-safety。
	- **DESC**: language-level continuation 是 day-0。continuation kind 至少区分 linear 与 multi-resume；multi-resume 用于 lexer/parser/compiler backtracking 与 recovery。跨 world/thread 的 capture 或 resume 永远非法。multi-resume 只能捕获 replay-safe state，或捕获由 reset-local rollback region 管理的局部可回滚状态。
	- **验收**: simple reset/shift、nested reset、multi-resume parser alternative 通过；answer type mismatch、multi-resume 捕获 FFI/UnsafeRef/world-local/Atomic mutation、跨 world/thread continuation 都能报错。
	- **并行**: 函数体级并行；跨函数 continuation escape 摘要按 call graph SCC 调度。

- [ ] **Pass 08: World / Send / Escape / Capability Check**
	- **TODO**: 检查 `return`、`break`、`continue`、loop tag、tail position、escape/promotion、`send`/`!send`、world boundary、thread boundary、world-local、`UnsafeRef`、Atomic。
	- **DESC**: 这里把 continuation 与并发/世界边界彻底隔开：continuation 默认不能 send，不能跨 thread/world；ordinary closure 的 send 分类与 captured values 相关；escape 规则先保守，允许后续放宽。
	- **验收**: 非法 escape、非法 send/capture、错误 loop tag、world-local 泄漏、Atomic capability 错误都能报错；TypedAst 标注 tail-call sites 和 arena/promotion facts。
	- **并行**: 函数体级并行；跨函数 escape 摘要需要 fixpoint，按 call graph SCC 并行调度。

- [ ] **Pass 09: Usage Analysis 0: High-Level Core**
	- **TODO**: 在 typed/alpha core 上统计 binder、lambda、closure、continuation 的 `0 | 1 | many` 使用情况，并标记 escaping、immediate-call、multi-resume 需求。
	- **DESC**: 这是 CPS 和 closure 前的必需优化事实，不是后端优化。没有 usage facts，就无法安全地区分 single-use continuation、真正 multi-resume continuation、可 direct call lambda、必须实体化 closure。
	- **验收**: 未使用 binder/lambda 可诊断；immediately-called lambda 标记为 directification candidate；parser alternative 中多次 resume 的 continuation 标记为 many。
	- **并行**: 函数体级并行；只读 typed/alpha core。

- [ ] **Pass 10: Generic Definition Check**
	- **TODO**: 在抽象 generic 参数下检查 generic body，生成 `GenericBodyIR` 和 `ObligationIR`，包括 field/method/operator/shape-dispatch/answer-type/generic-continuation 限制。
	- **DESC**: 这是 checked template 的核心。generic 定义期不是黑盒：普通 HM、row 约束、基本 well-formedness、answer type 入口都必须先过。不能等实例化时才发现 body 本身不可类型化。
	- **验收**: 能拒绝与任何实例无关的 generic body 错误；能保存未兑现 structural obligations；错误消息指向定义点；obligation 可序列化、可 hash、可缓存。
	- **并行**: generic definition 级并行；只读 summaries 和 resolved/canonical type info。

- [ ] **Pass 11: Method / Operator / Dispatch Index**
	- **TODO**: 建立 nominal method index、operator index、shape-dispatch candidate index，并提供按 `(name/operator, nominal id, normalized shape)` 查询的缓存接口。
	- **DESC**: level-1 默认 method resolution 基于 nominal identity，并保留分层候选顺序：field-callable、receiver method、qualified callee。shape dispatch 是独立 structural obligation。`via namespace` 若存在，应放到未来 level-2 的显式行为来源选择，不作为这里的主线机制。这里不做全局 witness search。
	- **验收**: 候选筛选稳定；二义性可诊断；同 shape 不同 nominal type 不被错误合并；查询缓存 key 可复现。
	- **并行**: index 构建可按 namespace 并行后 merge；查询缓存可并发读，写入用 content-addressed key 去重。

- [ ] **Pass 12: One-Pass CPS Transformation + Beta Reduction**
	- **TODO**: 用 meta-continuation 做 CPS lowering，并在变换过程中 beta-reduce administrative redex。
	- **DESC**: 这是 level-1 中端核心。普通表达式求值顺序产生的 administrative continuation 默认不实体化；只有 call/switch/prompt/control/multi-resume 等语义控制点进入 CPS Core。这个 pass 支撑 compiler lowering、chibalex backtracking、chibacc recovery 的共同实现模型。
	- **验收**: atom lowering 不产生额外 continuation；single-use administrative continuation 被直接 beta-reduce；`reset` / `shift` 和 multi-resume continuation 在 CPS dump 中保留清晰语义节点。
	- **并行**: 函数体级并行；只读 typed/answer-control/usage facts。

- [ ] **Pass 13: Usage Analysis 1: CPS Core**
	- **TODO**: 在 CPS Core 上重新统计 continuation、lambda、closure、function value 的 `0 | 1 | many` 使用情况。
	- **DESC**: CPS 后会产生新的可消除结构，也会暴露真正需要实体化的 multi-resume continuation。这个 pass 给 continuation simplification 和 closure conversion 提供最终事实。
	- **验收**: dead continuation、single-use continuation、many-resume continuation 分类稳定；分类结果可 dump、可 golden test。
	- **并行**: 函数体级并行。

- [ ] **Pass 14: Continuation Simplification**
	- **TODO**: 删除 unused continuation，inline single-use continuation，把 many-use continuation 标记为 multi-resume package lowering 输入。
	- **DESC**: 这是 day-0 性能卫生 pass。multi-resume 是语言能力，但只有真实 many-resume continuation 才付实体化成本；cross-world/thread continuation 在这里应已不存在，若残留则 internal error。
	- **验收**: single-use continuation 不分配 runtime object；multi-resume parser continuation 可重复 resume；非法 continuation 不进入 closure/lower 阶段。
	- **并行**: 函数体级并行。

- [ ] **Pass 15: Closure Conversion**
	- **TODO**: 做 free-var analysis，把 escaping lambda/closure 转为 `{code, env}`，并区分 direct function、known callee、unknown closure callee。
	- **DESC**: closure conversion 解决 lexical binding 到 runtime env 的边界。no-capture lambda 可以直接化；escaping closure 才需要 wasm-gc env package；continuation package 与 closure env 要共享 capture legality facts。
	- **验收**: top-level/nested/direct/unknown callee 路径可 dump；free vars 顺序稳定；no-capture lambda 不分配 env。
	- **并行**: 函数体级并行；跨函数 lifted symbol 由确定性 allocator 分配。

- [ ] **Pass 16: Lambda Lifting**
	- **TODO**: 把 nested function 提升为稳定 function symbol，把捕获变量变为 env 或显式参数。
	- **DESC**: 后端不处理词法嵌套函数语义。lifting 后的函数边界必须适合 wasm `funcref`、tailcall 和 namespace/specialization bundle emit。
	- **验收**: 互递归 nested function、捕获参数、直接调用/间接调用样例 lowering 稳定；lifted symbol name/id 可复现。
	- **并行**: 函数体级并行；namespace 内 lifted symbol merge 需要确定性排序。

- [ ] **Pass 17: Usage Analysis 2: Closure Core**
	- **TODO**: 在 closure conversion/lambda lifting 后统计 closure package、env field、code pointer、continuation package 的使用情况。
	- **DESC**: conversion 后还会出现可消除的 package 和 dead capture。这个 pass 支撑 env shrinking、single-use closure directification、known callee direct call。
	- **验收**: dead capture field、single-use closure、known code pointer、unused continuation package 都能被标记。
	- **并行**: 函数体级并行。

- [ ] **Pass 18: Closure / Env Simplification**
	- **TODO**: 做 env shrinking、no-capture closure erasure、single-use closure directification、dead capture field elimination、known callee direct call。
	- **DESC**: 这是避免 wasm-gc 后端背负无谓 allocation 的最后一道中端卫生线。它不是高级全局 inline，只消除由语言 lowering 必然产生、且 usage facts 已证明可消除的结构。
	- **验收**: no-capture closure 不生成 env；dead capture 不进入 layout；single-use closure 变 direct call；tail position 不被破坏。
	- **并行**: 函数体级并行。

- [ ] **Pass 19: Monomorphization Scheduler**
	- **TODO**: 收集 concrete instantiation sites，生成 specialization work items，按 key 去重并并行调度实例化检查和代码生成。
	- **DESC**: monomorphize key 建议为 `(generic_symbol, concrete_type_tuple, normalized_shape_tuple, builtin_capability_facts, abi_mode)`。若未来 level-2 恢复显式 `via namespace` 行为来源，再把它作为扩展 key 维度加入。定义期 checked 过的 body 不重做全量 HM，只兑现 concrete obligations：字段、method、operator、shape dispatch、dyn adapter packaging、continuation capability facts。
	- **验收**: 同一 key 只实例化一次；不同 namespace 同时请求同一实例不会重复产物；实例化错误报在 call site，同时保留定义点 note；递归 generic 通过 in-progress marker / SCC worklist 处理。
	- **并行**: 高并行。每个 specialization 是独立任务；全局只允许原子注册 `key -> artifact/status`，禁止实例化任务修改共享语义表。

- [ ] **Pass 20: Wasm-GC Core Lower + Layout**
	- **TODO**: 把 optimized CPS/closure core / specialization 降到 wasm-gc-friendly `CoreIR`，完成 method/operator direct target、extern direct target、closure env、continuation frame/package、record/data/union/string/slice/Array layout。
	- **DESC**: 这里决定 wasm-gc 表示：struct/array、tag、field offset、closure env、multi-resume continuation package、dyn package adapter、不可变 `Array[T]` 布局、WASI/thread boundary ABI、JS embedder `env` ABI。`extern "wasi" "symbol"` 在这里降为 WASI typed import ref + direct call target；`extern "C" "symbol"` / `extern "c" "symbol"` 降为 `env` typed import ref + direct call target。后端 emitter 不再做语义选择。
	- **验收**: layout hash 稳定；同一 summary + same specialization key 生成同一 CoreIR；tail position 和 continuation package 可 dump。
	- **并行**: namespace + specialization 级并行；layout table 由 canonical type/layout key 去重。

- [ ] **Pass 21: Wasm-GC Core Validation**
	- **TODO**: 验证 CoreIR 的 symbol/type/layout/block/continuation frame/package 引用完整，以及 replay-safety facts 已兑现。
	- **DESC**: validator 是 backend dumbness 的护栏。它必须确认 multi-resume continuation package 不包含非法 world/thread/unsafe capture，tailcall sites 合法，layout refs 完整。
	- **验收**: CoreIR validator 能拒绝 dangling symbol、错误 layout ref、非法 continuation package、非法 tailcall；错误信息稳定。
	- **并行**: namespace + specialization 级并行。

- [ ] **Pass 22: Wat Emit + wasm-ld Link**
	- **TODO**: 从 CoreIR 直接打印 `.wat` 或 wasm object，使用 wasm-gc、tailcall、wasi、thread features；序列化 `extern "wasi" "symbol"` 对应的 WASI import，以及 `extern "C" "symbol"` / `extern "c" "symbol"` 对应的 `(import "env" "symbol" ...)`；每个 namespace / specialization bundle 可独立产物，最后交给 `wasm-ld` 或等价 linker 链接。
	- **DESC**: emitter 保持 dumb：只序列化已验证 CoreIR，不做优化、不做重型验证。跨 namespace linking 交给 linker，但符号、ABI、layout 在前面 pass 已固定。
	- **验收**: 单 namespace 可独立 emit；多 namespace 能链接；tail position 生成 `return_call` / 等价 tailcall；WASI/thread import/export 名称稳定；`extern "wasi" "fd_write"` 生成的 WASI import 名称和签名可 golden test；`extern "C" "js_log"` 生成的 `env` import 名称和签名可 golden test；wat roundtrip 工具能解析。
	- **并行**: namespace / object 级并行 emit；最终 linker 是收敛点。

## Monomorphize + Checked Generics 处理规则

- [ ] **定义期检查一次**
	- **TODO**: generic body 在抽象参数下完整通过基础类型检查，生成 `GenericBodyIR` 和 `ObligationIR`。
	- **DESC**: 类似 C++ template 的实例化生成代码，但不是 C++ 老模板的“定义期几乎不检查”。定义期必须拒绝不依赖 concrete type 的错误。
	- **验收**: `def f[T](x: T) = y` 在没有 `y` 的情况下定义期报错；`def f[T](x: T) = x.m()` 定义期通过并记录 method obligation。
	- **并行**: generic definition 级并行。

- [ ] **实例化期兑现 concrete obligation**
	- **TODO**: concrete call site 触发 specialization，检查 row field、method/operator、shape-dispatch、dyn adapter、builtin capability、continuation capability facts。
	- **DESC**: obligation 尽量局部兑现，不引入 Rust trait solver 或全局 witness search。level-1 主线先只兑现 row/shape/method/operator/dyn adapter/builtin capability obligations；named constraint 和 `via` 行为来源若恢复，应明确作为 level-2 扩展加入。
	- **验收**: `f[User](u)` 若 `User` 没有所需字段/方法，在 call site 报错；若满足则生成或复用 specialization。
	- **并行**: specialization work item 级并行。

- [ ] **specialization key 稳定化**
	- **TODO**: 定义 key 编码和 hash：`generic id + concrete nominal ids + canonical type args + normalized shape ids + capability facts + continuation facts + ABI/layout mode`。
	- **DESC**: normalized shape 必须 canonical，不能依赖源码字段顺序或编译顺序。名义类型默认进入 key，避免同 shape 不同 nominal 的 method 世界被合并。当前 level-1 key 不默认包含 `explicit via`；那一维只在未来 level-2 引入显式行为来源时追加。
	- **验收**: `{x, y}` 与 `{y, x}` shape key 相同；同 shape 不同 nominal type 默认 key 不同；continuation capability facts 改变时 key 可区分；未来若引入显式 `via ns`，该来源必须改变 key。
	- **并行**: key 计算纯函数，可任意并行。

- [ ] **并发实例化注册表**
	- **TODO**: 实现 `InstantiationRegistry`：`Missing | InProgress | Done | Failed`，支持多个 worker 请求同一 key 时 join 已有任务。
	- **DESC**: 这是 monomorphize 多核编译的关键。实例化任务只追加产物，不修改全局语义环境。
	- **验收**: 压测 100 个 namespace 同时请求同一 generic instance，只生成一个 artifact；失败结果可缓存并稳定报告。
	- **并行**: 高并行，注册表需要线程安全或进程安全锁。

- [ ] **递归 generic / SCC 策略**
	- **TODO**: 对实例化依赖图做 SCC；递归实例先注册 stub，再完成 body lower，禁止无限展开。
	- **DESC**: monomorphize 不能无界实例化。需要限制递归实例深度或要求 key 收敛。
	- **验收**: 直接递归 generic 生成一个 specialization；无限类型增长实例化能报“monomorphization does not converge”。
	- **并行**: SCC 间并行，SCC 内确定性顺序或协作调度。

- [ ] **增量缓存**
	- **TODO**: 缓存 `InterfaceSummary`、`GenericBodyIR`、`ObligationIR`、specialization artifact、CoreIR、wat/object。
	- **DESC**: cache key 必须包含 source hash、summary hash、compiler version、target features (`wasm-gc`, `tailcall`, `wasi`, `thread`) 和 canonical extern ABI/import module/signature hash，例如 `wasi::fd_write` 与 `env::js_log` 必须区分，`"C"` / `"c"` 必须归一到同一 key。
	- **验收**: 修改非导出函数体只重编当前 namespace 和受影响 specialization；修改 public summary 触发依赖 namespace 重检。
	- **并行**: cache lookup 全并行，cache write content-addressed。

## 并行编译分界

- [ ] **全局轻量串行/归约区**
	- **TODO**: 只允许 ProjectSurface merge、summary conflict reduce、namespace graph/SCC 构建、最终 wasm-ld 处于收敛点。
	- **验收**: 这些阶段耗时应远低于 body typecheck + specialization + emit。

- [ ] **namespace 并行区**
	- **TODO**: NameResolve、Alpha、PatternElab、HM+Row、Answer/ContinuationKind、World/Send/Escape/Capability、Usage、OnePassCPS、ContinuationSimplify、Closure/Lambda、GenericDefinitionCheck、CoreLower、WatEmit 都按 namespace 或 body 分发。
	- **验收**: 在 8 核机器上，多 namespace 项目 CPU 利用率明显高于单核；输出顺序仍确定。

- [ ] **specialization 并行区**
	- **TODO**: MonomorphizationScheduler 把每个 unique key 作为独立任务执行，任务只读 summaries/index/cache，只写自己的 artifact。
	- **验收**: generic-heavy 项目能在多核下并发实例化；重复实例去重。

## 第一阶段 MVP 切片

- [ ] **MVP-A: continuation-aware 非 generic 子集出 wat**
	- **TODO**: 实现 Pass 00-09、Pass 12-18、Pass 20-22 的最小子集，跳过 generic specialization，但不跳过 continuation / closure / lambda lifting。
	- **验收**: 简单函数、record、data、match、`def fd_write(...): ... = extern "wasi" "fd_write"`、`def js_log(...): ... = extern "C" "js_log"`、WASI print/exit、JS/env import smoke、simple reset/shift、multi-resume parser backtracking、no-capture closure direct call 都能生成 wat 并运行。

- [ ] **MVP-B: checked generic + monomorphize**
	- **TODO**: 实现 Pass 10、Pass 19 的最小子集：函数 generic、row field obligation、method obligation、continuation capability facts、specialization cache、最小 dyn packaging hook。
	- **验收**: 两个 namespace 同时实例化同一 generic，只生成一个 specialization；缺字段/缺方法在 call site 报错。

- [ ] **MVP-C: control / escape / tailcall**
	- **TODO**: 加强 Pass 07、Pass 08、Pass 12-14 的 answer type、continuation kind、multi-resume replay-safety、tail position、保守 escape，并让 Pass 22 输出 tailcall。
	- **验收**: tail-recursive 函数生成 tailcall；非法 continuation escape / cross-thread resume 被拒绝；multi-resume continuation 只在 replay-safe 区域通过。

- [ ] **MVP-D: namespace object + wasm-ld**
	- **TODO**: 每个 namespace 生成独立 wat/object，最终用 wasm-ld 链接。
	- **验收**: 修改一个 namespace 只重编该 namespace 和受影响 specializations；最终 linked wasm 通过 smoke test。
