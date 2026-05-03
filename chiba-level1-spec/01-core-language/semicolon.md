# `;` 在语句序列中的地位

## 语法

分号用于分隔语句，尤其在 block 中标识某个表达式被当作语句处理。

在 level-1 中，statement separator 采用：

- 显式 `;`
- `(ws|nl|comment)*`

分号是显式分隔符；空白、换行、注释可共同形成语句间分隔。

## 语义

分号影响：

- 表达式是否成为 tail expression
- statement sequence 的分界
- 某些空语句是否存在

换行与分号在 statement 终止上是部分等价的，但这种等价只发生在行结束位置，而不是任意空白位置。

对普通 call expression 而言，行结束默认与 `;` 一样终止 statement。

因此：

- `f(a) {|x| ... }` 可作为单个 call + trailing closure 解析
- `f(a)\n{|x| ... }` 在 level-1 中应视为先结束 `f(a)` 这一 statement，再开始下一项

当前推荐的 layout 规则是：只有“语法上尚未闭合”的表达式，或显式续接运算符，才抑制行结束带来的 statement 终止。

例如下面这些情况中的换行不终止当前表达式：

- `f(\n  a,\n  b\n)`
- `xs[\n  i\n]`
- `{base |\n  x: y\n}`
- `value |>\n  step()`

## Usage

```chiba
let x = 1
let y = 2; let z = x + y

write(z)
```

注释：`;` 是显式分隔符；没有闭合的表达式会继续跨行，而普通已闭合表达式会被空白/换行分开。

## 边界

level-1 不把 `;` 当作额外语义节点；连续分隔是否接受由 parser 细则决定，但不改变其“只是 separator”的地位。
