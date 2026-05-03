# Indexing

## 语法

indexing 使用方括号语法访问元素。

## 语义

indexing 作用于支持索引的容器或视图类型。

多行 indexing 可以在未闭合的 `[` `]` 内部跨行继续；行结束不会在未闭合索引内部终止当前表达式。

level-1 为 array / slice / vector / map / string family 统一提供 indexing surface。

但“统一 surface”不等于“统一返回语义”。

对字符串：

- 主 indexing 不做 codepoint 级随机访问承诺
- 主 slicing 按字节区间工作，并要求区间端点位于 UTF-8 边界
- codepoint 访问通过显式 API 提供，而不是由 `text[i]` 承担

因此，字符串的 O(1) 承诺属于 byte/boundary 级视图操作，而不是 codepoint 级随机访问。

## Usage

```chiba
let xs = arr[0]
let part = text[0..4]
let cp = text.codepoint_at(0)
```

注释：`arr[0]` 与 `text[0..4]` 共享 indexing surface；但字符串的文本级访问通过 `codepoint_at` 暴露，而不是把 `text[i]` 解释成 codepoint 索引。

## 边界

indexing 仍可参与 operator overloading；多维 indexing 只是该 surface 的重复应用，而不是单独语法类别。
