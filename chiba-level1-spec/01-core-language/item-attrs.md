# Item Attrs

## 语法

当前方向下，attribute 语法统一使用：

```chiba
#[attr]
#[attr(...)]
```

虽然本文档名仍叫 item attrs，但 level-1 的 attribute 目标不只限于顶层 item。

参数化 attribute 不是另一套独立机制，而是 item attrs 的参数化形式。

例如：

- `#[entry]`
- `#[derive(...)]`

## 语义

file attrs 比 item attrs 优先

同一 item 上多个 attrs 的组合规则为顺序执行

item attrs 为特定定义附加额外编译含义，例如入口点、代码生成策略或后端约束。

当前方向允许 attribute 至少出现在下面这些位置：

1. 函数定义前
2. statement / expression 前
3. field / data variant 前
4. data variant tuple 中的 type 前
5. namespace 前
6. block / `unsafe block` 前
7. lambda 前
8. call-site trailing closure 前

其中 call-site trailing closure 目前指 `f(x) {|arg| ... }` 这一专用 call 后缀语法，而不是普通 standalone lambda。

也就是说，attribute 当前被视为一套统一的前缀标注机制，而不是只属于“顶层 item”的专用语法。

## TODO

在 level-2 方向上，这类 attribute 最终应统一收敛到 macro / meta-programming 体系，而不是长期维持为多套彼此独立的元信息机制。

