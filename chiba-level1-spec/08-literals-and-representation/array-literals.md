# Array Literal 的正式语义

## 语法

该条目描述数组字面量 surface syntax 与元素列表语法。

## 语义

数组字面量与 slice、Vector、V数组的职责边界需要明确区分。

level-1 中，array literal 不作为首发核心 surface 承诺；已有 `[` `]` 主要先服务 slice literal。

若后续引入真正的 array literal，应把它写成“固定长度、固定表示、值语义容器”的单独条目，而不是与 slice literal 混写。

## Usage

```chiba
// level-1 首发不把 [1, 2, 3] 定义为独立 array literal
let xs = [1, 2, 3]
```

注释：当前 `[ ... ]` 优先落在 slice literal 语义上；array literal 仍保留为后续独立扩展点。

## 边界

若未来引入 array literal，它应与 slice literal 保持明确职责分离，而不是共用一套“有时是数组有时是切片”的摇摆语义。
