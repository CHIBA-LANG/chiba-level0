# Uniqueness 作为编译器内部事实

## 语法

该条目描述内部优化事实，不要求用户普遍书写 surface annotation。

## 语义

编译器可利用 uniqueness 做原地复用、FBIP 或其他优化，但 API 设计不应围绕显式 unique 注解展开。

level-1 把 uniqueness 视为编译器内部可证明事实，而不是用户普遍操作的 surface capability。

它可以影响：

- 原地更新是否合法
- FBIP 是否可触发
- 某些提升与复用策略

但它不改变 level-1 对外的默认编程模型：普通值仍以 managed value 方式书写。

## Usage

```chiba
let xs = [1, 2, 3]
let ys = push(xs, 4)
```

注释：实现可以在证明 `xs` 具有 uniqueness 时原地复用其存储，但语言 surface 不要求用户显式写 unique 注解。

## 边界

uniqueness 可以体现在诊断与优化选择中，但不作为 level-1 的稳定 surface 承诺暴露给用户。
