# 编译单元与 CIR 图

## 目标

level-1 需要把“编译单元是什么、如何并行、互相引用怎么处理”放进 lowering 规范，而不是把它留成 build system 的隐式事实。

## 编译单元不是单个源文件

源文件是输入容器，不一定是最终的编译单元。

在 level-1 里，编译单元更接近于“一个可独立进入 CIR/typecheck 的语义簇”。它可能来自：

- 单个文件
- 同一 namespace 下的多个文件合并
- 同一 package 内若干需要联合求解的定义组
- 一个互相递归的定义 SCC

因此规范不应承诺“一文件一个 CIR program”。

更准确地说，编译调度的基本单位应是“当前 SCC + 该 SCC 的 CIR context”。

## 编译单元图

前端完成文件发现、namespace 装配、`use` 解析之后，应先形成编译单元图，再进入 CIR。

推荐流程：

```text
source files
  -> namespace/package assembly
  -> import/use resolution
  -> compilation-unit graph
  -> SCC condensation
  -> CIR construction per unit/SCC
  -> unit-local + cross-unit checks
```

这里的图节点是编译单元，边表示必须先看到对方的导出面才能继续。

进入 SCC 处理后，该 SCC 应拥有一个可扩展 context，供后续 nanopass 在同一处累积：

- 类型约束
- 名字与导出摘要
- usage / RC / arena / FBIP 结果
- `send` / world-boundary 结果
- specialized loop / control lowering 的 side data

## 树形并行

编译应尽量按 condensation DAG 做树形并行。

也就是说：

- DAG 上互不依赖的分支可以并行构造 CIR
- 父节点只等待其直接前驱 SCC 完成导出面与必要摘要
- 并行边界以编译单元或 SCC 为粒度，而不是盲目按文件粒度切分

这样做的目的，是把并行建立在语义依赖图上，而不是建立在文件系统布局上。

## 互相引用

如果出现互相引用，不应简单报“循环依赖”然后结束；要先区分层级。

### 1. 值级或函数级互引

若若干定义在语义上允许互相递归，它们应被纳入同一 SCC，并在同一 CIR/typecheck 批次中处理。

这里的“同一批次”不只是同一次遍历，而是共享同一个 SCC context 的 pass 序列。

### 2. 类型级互引

若 data/type 定义允许形成递归闭包，也应在同一 SCC 内联合建立类型骨架，再完成字段与约束检查。

### 3. 非法循环

如果循环跨越了不允许递归的边界，例如需要完整值体求值、需要宏式展开完成、或违反初始化规则，才应在 SCC 内报非法循环，而不是在图构建前提前拒绝。

## 编译单元进入 CIR 时的产物

每个编译单元在进入 CIR 后，至少要暴露两类结果：

- 本单元的 CIR 主体
- 可供下游单元消费的导出摘要

导出摘要至少应包含：

- 可见名字与 namespace path
- 类型骨架与签名
- `send` / world / effect-like capability 的外部边界信息
- 可能影响优化与布局的资源摘要

规范不要求摘要必须采用某种二进制格式，但必须允许“先看摘要，再决定是否需要完整主体”。

## 与 BIR 的关系

编译单元图的收敛点应在 CIR，而不是 BIR。

原因是：

- 类型检查发生在 CIR
- RC / arena / FBIP / usage / send 分析发生在 CIR
- `for` 等 specialized CIR 优化也发生在 CIR

因此一个单元是否能独立继续推进，取决于它是否已获得足够的 CIR 级摘要，而不是是否已经有 BIR。

同时，这也意味着 SCC 内部的 pass 组织应尽量减少 IR 复制与容器切换成本，否则很难实现高吞吐编译。

## Usage

```text
pkg.root
 ├─ a.chiba
 ├─ b.chiba
 └─ sub/
    ├─ c.chiba
    └─ d.chiba
```

若 `a/b` 之间互相调用，`c/d` 之间互相调用，而 `sub` 只依赖 `a` 导出的类型签名，则可以形成：

- SCC1: `a + b`
- SCC2: `c + d`
- DAG edge: `SCC1 -> SCC2`

此时 `SCC1` 与其它无关子树可并行进入 CIR；`SCC2` 只需等待 `SCC1` 的 CIR 导出摘要，而不是等待整个包全部完成。