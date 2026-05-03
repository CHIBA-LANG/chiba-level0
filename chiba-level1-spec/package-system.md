# Chiba Package System Draft

## 1. 目标

本文描述 Chiba 的包系统、workspace 模型、manifest 形状、依赖关系与构建 phase 的第一版方向。

当前版本采用以下基本决策：

- package 使用 `chiba.toml`
- workspace 使用 `chiba.workspace.toml`
- 每个 package 在一次构建中只构建一次
- package 默认包含一个 `lib`
- `[[entry]]` 用于声明额外入口，而不是替代默认 `lib`

## 2. Manifest 文件

当前推荐使用：

```text
chiba.toml
```

用于单个 package。

多包 workspace 使用：

```text
chiba.workspace.toml
```

二者是不同层级的 manifest，不要求合并为同一个文件。

## 3. 顶层结构

一个最小 manifest 的推荐形状：

```toml
[package]
name = "foo"
version = "0.1.0"
edition = "1"
opensource = true # community version of chibac only could be true

# or paid plan
opensource = false
license-path = "..." # optional could look up by chibac

[[include]]
path = "src/**/*.chiba"

[[exclude]]
path = "src/**/*.(chibalex|chibacc)"

# package 默认自带一个 lib
# 默认入口可约定为 src/lib.chiba

[[entry]]
name = "foo"
path = "src/main.chiba"

[dependencies]

[build-dependencies]

[dev-dependencies]

[plugins.dependencies]

[features]
default = []
```

或者多包 workspace manifest：

```toml
[[workspace.members]]
path = "package1"

[[workspace.members]]
path = "package2"
```

这套结构的重点是：

- `package` 描述包元信息
- package 默认包含一个 `lib`，`[[entry]]` 描述额外构建入口
- `dependencies` / `build-dependencies` / `dev-dependencies` 区分使用阶段
- `plugins.dependencies` 用于获取编译器插件
- `features` 作为显式开关
- `chiba.workspace.toml` 作为多包组织根

## 4. Package

一个 package 是版本化、可依赖、可构建的最小分发单元。

package 至少应具有：

- 名称
- 版本
- edition
- 一个默认 `lib`

package 可以额外包含：

- 一个或多个 `[[entry]]`

也就是说，Chiba 中的 package 默认不是“空目标容器”，而是“先有一个库，再按需暴露额外入口”。

## 5. 依赖模型

当前方向采用三类显式依赖：

- `dependencies`
- `build-dependencies`
- `dev-dependencies`

此外，还应存在独立的：

- `plugins.dependencies`

其职责分别是：

- `dependencies`：运行期或普通编译期使用的包
- `build-dependencies`：只在构建 phase 中需要的工具或包
- `dev-dependencies`：测试、样例、开发辅助依赖
- `plugins.dependencies`：用于获取编译器插件本身，而不是普通运行期库

这里之所以单独拆出 `plugins.dependencies`，是因为编译器插件不是普通 package dependency：

- 它参与的是编译流程 hook，而不是程序运行期链接
- 它的启用与顺序需要和 lowering pipeline 对齐
- 它可能只在特定 target/profile 下启用

初期推荐支持的依赖来源：

- registry dependency
- path dependency
- git dependency

初期推荐支持的版本表达：

- exact version
- caret requirement
- path pinning

对 `plugins.dependencies` 也应支持同类来源，但解析与装载语义属于“插件获取”，不等于普通库链接。

一个方向示例：

```toml
[plugins.dependencies]
gpu-kernel = { version = "0.3" }
wasm = { path = "tools/chiba-wasm-plugin" }
```

这里表达的是“去哪里拿到插件”，不是“自动按什么顺序执行插件”。

## 6. Feature

feature 是显式能力开关，而不是另一层隐式求解系统。

当前方向要求 feature 模型保持简单：

- feature 是名字到开关集合的映射
- optional dependency 可由 feature 控制
- 不引入过度复杂的 feature 解释规则

一个简单例子：

```toml
[features]
default = ["std"]
std = []
tls = []
http2 = ["tls"]
```

## 7. Build Script

使用

```text
build.chiba
```

放在当前 package 的 `chiba.toml` 同级目录下。

`build.chiba` 是 package 的主构建扩展点。

当前方向明确规定：

- 每个 package 在一次构建流程中只构建一次
- `build.chiba` 也只执行一次
- `build.chiba` 产出的结果进入该 package 的同一次构建
- 不把 package 拆成多段 phase DAG 反复执行

这样做的目标是让 package build model 保持简单直接，而不是把包系统做成显式 phase 图求解器。

`build.chiba` 可以用于：

- 代码生成
- 构建前扫描
- 生成辅助源文件
- 处理 `.chibalex` / `.chibacc` 等输入

但它仍然属于单 package、单次执行的构建前步骤。

## 8. 单次构建语义

包系统以 package 为缓存与调度单位。

一次标准构建中，同一个 package 不应被重复构建多次。

这条规则同样适用于：

- 默认 `lib`
- `[[entry]]`
- `build.chiba` 生成步骤

如果一个 package 同时拥有默认 `lib` 和多个 `[[entry]]`，它们仍属于同一个 package build，而不是多个彼此独立的 package 级构建。


## 9. 构建入口

package 的构建入口至少包括：

- 默认 `lib`
- 零个或多个 `[[entry]]`

其中：

- 默认 `lib` 用于作为依赖被其他 package 引用
- `[[entry]]` 用于声明可运行或可分发入口
- `[[entry]]` 不取消 package 默认 `lib` 的存在

## 10. 命令面

虽然本文不规定最终 CLI 名字，但当前方向希望命令体验保持 Cargo-like。

至少应存在统一前端命令来承载：

- build
- run
- test
- fmt
- doc

包系统与工具入口应尽量统一，而不是长期依赖底层可执行文件与手写脚本拼接。

### 登陆 和 推出

- login 登陆 chiba 开发者身份，会把你的 license 放置在 ~/.chiba/license.txt 同时和你现在电脑的 MAC 地址绑定
- refresh 刷新 license
- logout 登出
- publish 发布包，会检查 license MAC 地址并打包上传源码或 .cbi .cbx

### 包的过期

包会在

1. 长达 5 个编译器 minor 版本没有任何更新
2. 抢占了商标遭到投诉
3. 遭到社区 issue 投诉
4. 违背了社区原则如抢占包名

后进行销毁

## 11. 锁文件与可复现性

若引入 registry 或 git dependency，则包系统应提供锁文件机制，以保证：

- 团队构建一致
- CI 结果一致
- 自举和代码生成 phase 的结果可复现

本文暂不规定锁文件的最终文件名，但要求其语义地位与 manifest 区分明确。

## 12. Chiba 专用配置

Chiba 需要保留自己的语言和后端配置区，而不是把一切都塞入 `[package]`。

例如未来可保留：

```toml
[chiba.codegen]
backend = "native"
opt-level = 2 

# small
# 1
# 2

# paid
# 3

# paid options
auto-simd = true # enable auto simd for loops and map reduce
gpu-offload = true # enable gpu offload could speed up large
# use with #[mp(gpu, ...)]
gpu-driver = "spirv|cuda|oneapi|amdgpu"
```

这里也应为编译器插件保留正式配置区，用于声明：

- 启用哪些插件
- 插件所在 hook 层
- 插件顺序
- 插件参数

一个可能方向是：

```toml
[plugins.dependencies]
gpu-kernel = { version = "0.3" }
wasm = { path = "tools/chiba-wasm-plugin" }

[chiba.plugins]
order = ["gpu-kernel", "wasm", "default-native"]

[[chiba.plugins.before-bir]]
name = "gpu-kernel"

[[chiba.plugins.before-lir]]
name = "wasm"
```

这里的分工应固定为：

- `plugins.dependencies`：声明如何获取插件
- `chiba.plugins`：声明是否启用、挂在哪个 hook、执行顺序与参数

这样 package-system 才能和 lowering hook 规范闭环，而不会把“插件获取”和“插件调度”混成同一个配置区。

## Usage

```toml
[plugins.dependencies]
gpu-kernel = { version = "0.3" }
wasm = { git = "https://example.org/wasm-plugin.git", version = "0.1" }

[chiba.plugins]
order = ["gpu-kernel", "wasm", "default-native"]

[[chiba.plugins.before-bir]]
name = "gpu-kernel"

[[chiba.plugins.before-lir]]
name = "wasm"
```

这个例子表示：

- 先通过 `plugins.dependencies` 获取插件
- 再通过 `chiba.plugins` 指定插件在哪个 lowering hook 层执行，以及它们的顺序

