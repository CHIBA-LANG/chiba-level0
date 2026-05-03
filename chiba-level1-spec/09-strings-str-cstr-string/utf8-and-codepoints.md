# UTF-8 语义与 Codepoint 级规则

## 语法

该条目描述字符串和字符相关文本的编码假设。

## 语义

level-1 把源文本固定为 UTF-8。

`str` / `String` 保持 UTF-8 不变量；`cstr` 作为 ABI 边界类型，单独处理。

字符串主索引与主切片语义不按 codepoint 计数，而按字节区间工作，并要求边界落在合法 UTF-8 codepoint 边界上。

codepoint 级操作通过显式 API 提供，例如 `codepoint_at`、`codepoint_len`；它们不改变主 indexing / slicing 的语义。

## Usage

```chiba
let text = "你好a"
let bytes = text.bytes_len()
let points = text.codepoint_len()
```

注释：这个例子刻意把字节长度与 codepoint 长度分开写，说明规范必须区分“UTF-8 编码后的字节数”和“文本层可见字符单元”的 API 语义。

```chiba
let first = text.codepoint_at(0)
let slice = text.codepoint_slice(0, 2)
```

注释：`codepoint_at` 是显式的文本 API；它不等价于主 indexing。level-1 把 byte/boundary 语义和 codepoint API 明确分开。

## 边界

regex、`chibalex` 等文本工具应在“UTF-8 文本 + 显式 codepoint API”的前提上对齐，而不是把字符串本体退回任意字节串模型。
