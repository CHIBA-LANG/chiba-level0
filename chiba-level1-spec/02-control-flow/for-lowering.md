# `for` 的 Desugar / Lowering

## 语法

该条目不新增 surface syntax，而是描述 `for` 到内部 IR 的降解规则。

## 语义

`for` 可能被 lowering 为：

- 基本 block + branch 结构
- 带显式 loop header 的 CFG
- 更接近 continuation 边界的控制流表示

level-1 把 `for` 的 lowering 写死为 while 风格展开。

也就是说，`for` 不是保留到后端的特殊循环语义，而是前期就降成“条件检查 + 循环体 + 回跳”的标准循环骨架。

## Usage

```chiba
for cond {
	body()
}
```

注释：这个 surface 例子在 lowering 后至少需要变成“入口判断条件、执行 body、跳回头部”的循环骨架，而不是保留高层 `for` 语法到最终阶段。

## 边界

带 tag 的 `break` / `continue` 也服务于同一套 while 风格 lowering，而不是额外保留高阶循环语义。
