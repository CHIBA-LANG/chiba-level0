# 运算符在 Parser / Typecheck / Lowering 中的统一定义

## 语法

该条目描述同一运算符在不同编译阶段的统一来源。

## 语义

规范应避免 parser、typechecker、lowering 各自维护不同运算符事实表。

## Usage

```chiba
let value = a + b * c
```

注释：这个简单表达式要求 parser、typecheck 和 lowering 都同意 `*` 比 `+` 绑定更紧；若三阶段各自维护不同事实表，就容易在优先级和候选选择上分叉。

## 边界

需要单独明确：

- 统一表是否进入源码生成工具链
- Pratt parser 与 typecheck 共享的元数据结构
