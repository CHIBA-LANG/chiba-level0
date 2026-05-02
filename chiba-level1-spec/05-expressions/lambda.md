# Lambda

## 语法

lambda 使用箭头语法引入匿名函数。

当前默认 surface 为：

```chiba
(x: Tx): R => expr
(x: Tx, y: Ty): R => expr
(): R => expr
```

其中：

- 参数列表使用 `(...)`
- 返回类型显式写成 `: Ret`
- `=>` 引入 lambda body

level-1 不把 `{|args| body }` 当作默认的 standalone lambda 语法。

这样可以避免与大括号相关的其他入口产生过多 parser 回退，尤其避免把：

```chiba
{|x| y: z}
```

误读为 closure，而不是既有的 update / record 相关语法入口。

## 语义

lambda 构造 closure value；其调用蕴含隐式 `reset`，其 capture 也可能触发 escape 与提升。

## Usage

```chiba
let inc = (x: i32): i32 => x + 1
let get = (): String => String.from("ok")
```

注释：closure 使用 `(...): Ret => expr` 形式；当 body 需要多语句时，`expr` 可以是 block expression。

## 边界

lambda 与 grouped expr / tuple 的歧义入口、以及 trailing closure 如何 desugar 到普通 lambda，仍需按 parser 细则补充；但其 surface 已固定为 `(...): Ret => expr`。
