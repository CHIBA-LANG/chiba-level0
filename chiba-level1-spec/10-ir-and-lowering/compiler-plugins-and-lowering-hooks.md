# 编译器插件与 Lowering Hook

## 目标

本条目定义 Chiba 在 lowering 流程中的编译器插件挂载点、顺序规则与返回协议。

这里的插件不是泛泛的“扩展功能”，而是可以参与或截断默认 lowering 的正式编译阶段参与者。

## 挂载点

level-1 至少应提供两个正式插件层：

- `before-bir`：位于 CIR -> BIR 之前
- `before-lir`：位于 BIR -> LIR 之前

它们的典型用途分别是：

- `before-bir`：消费特定 CIR 子集，改走 GPU kernel、domain-specific accelerator、special VM 等路径
- `before-lir`：消费 BIR，改走 WASM、专用字节码、目标专用 emitter 等路径

## 默认行为

如果没有插件接管，编译器走默认主路径：

```text
CIR -> before-bir plugins -> BIR -> before-lir plugins -> LIR
```

插件层的存在不改变默认路径，只改变“是否由默认路径继续推进”的判定机制。

## 插件顺序

插件顺序必须是用户可指定的。

原因很简单：

- 某些插件依赖其它插件先做重写
- 某些插件之间会竞争接管权
- 某些目标希望优先尝试专用后端，再回退默认 lowering

因此，插件执行顺序不能只靠编译器内部硬编码，也不能只靠插件注册先后顺序隐式决定。

## 与 package system 的联动

插件顺序与启用集合应与 package system 联动。

也就是说，package manifest 或 workspace manifest 应能声明：

- 启用哪些编译器插件
- 这些插件属于哪个 hook 层
- 插件顺序
- 插件参数或 profile

规范这里先不把 manifest 字段名彻底写死，但要求 package-system 必须能表达这类信息，而不是把插件顺序留给外部脚本。

一个可能的方向是：

```toml
[chiba.plugins]
order = ["gpu-kernel", "wasm", "default-native"]

[[chiba.plugins.before-bir]]
name = "gpu-kernel"

[[chiba.plugins.before-lir]]
name = "wasm"
```

这只是示意，不代表最终字段名已经定稿。

## 插件输入

插件输入必须是当前 hook 层能够看到的稳定 IR 与上下文。

### `before-bir` 插件输入

- 当前 SCC 或当前编译单元的 CIR 主体
- 对应 CIR context 中已经稳定的分析结果
- package / target / profile / feature 等构建元信息

### `before-lir` 插件输入

- 当前 BIR 主体
- 与该 BIR 对应的 lowering metadata
- package / target / profile / feature 等构建元信息

插件不得假设自己能看到未声明可见的内部临时状态。

## 插件返回协议

插件返回值固定为四种之一：

- `重写`
- `接管`
- `放弃接管`
- `报错`

这四种返回值必须被编译器显式区分，不能混成一个模糊的 bool 成败值。

### 1. `重写`

`重写` 表示：

- 插件不接管最终目标产出
- 但它对当前层 IR 做了合法重写
- 重写后的 IR 继续交给后续插件或默认 lowering

这适用于：

- canonicalization
- domain-specific normalization
- 为后续插件或默认 lowering 准备更适合的 IR

### 2. `接管`

`接管` 表示：

- 插件声明默认 lowering 到此为止
- 该插件已经生成目标相关结果，或已经把流程转交到自己的专用后端
- 当前 hook 之后的默认路径不再继续

例如：

- GPU kernel 插件直接从 CIR 产出 SPIR-V 与 Vulkan bootstrap
- WASM 插件直接从 BIR 产出 WASM 模块

### 3. `放弃接管`

`放弃接管` 表示：

- 插件检查了输入
- 但当前输入不属于自己支持的语义子集，或当前配置不要求它介入
- 它不做修改，也不报错
- 流程继续交给下一个插件或默认 lowering

这是插件“未命中”的正常结果，不应被视为失败。

### 4. `报错`

`报错` 表示：

- 插件确认当前输入本应由自己处理
- 但遇到了无法接受的违规、缺失条件或内部失败
- 编译流程应以该错误终止，而不是默默回退到默认 lowering

如果插件已经声明支持某一语义域，就不应在真实错误时假装成 `放弃接管`。

## 顺序执行规则

在同一 hook 层内，插件应按用户指定顺序执行。

推荐规则如下：

1. 遇到 `放弃接管`：继续执行下一个插件
2. 遇到 `重写`：将重写后的 IR 交给后续插件继续处理
3. 遇到 `接管`：停止当前 hook 层与后续默认 lowering
4. 遇到 `报错`：立即终止编译

这套规则的关键点是：

- `重写` 不等于 `接管`
- `放弃接管` 不等于错误
- `报错` 不允许被静默吞掉

## 与编译单元 / SCC 的关系

插件的作用域至少应清晰到“当前编译单元或当前 SCC”。

也就是说，插件不应默认隐式接管整个 workspace。它应明确说明自己是：

- 对单个 SCC 起作用
- 对单个 package 起作用
- 或对整个构建目标起作用

默认推荐粒度是当前 hook 所在的编译单元 / SCC，因为这更适合并行编译与增量失效。

## 非目标

本条目当前不规定以下内容：

- 插件 ABI 的最终进程模型
- 插件是否运行在同进程、子进程还是沙箱中
- 插件二进制分发格式
- 插件权限模型

这些是后续实现与工具链问题，不影响本条目先固定 lowering contract。

## Usage

```text
before-bir plugins: [gpu-kernel, domain-rewrite, default-native]
```

若当前 CIR 命中 GPU kernel 子集：

- `gpu-kernel` 返回 `接管`
- 默认 `CIR -> BIR` 不再继续

若当前 CIR 不命中 GPU kernel，但需要一次标准化：

- `gpu-kernel` 返回 `放弃接管`
- `domain-rewrite` 返回 `重写`
- 重写后的 CIR 继续进入后续插件与默认 `CIR -> BIR`

若某插件发现当前输入本该由自己支持但违反约束：

- 该插件返回 `报错`
- 编译终止，而不是静默回退到默认 lowering