# Lambda / Closure

## 语法

lambda 引入匿名可调用体，并在需要时形成 closure。

## 语义

closure 由代码指针与 capture environment 组成；capture 可能触发 escape 与提升。

level-1 的 lambda / closure surface 固定为 `(...): Ret => expr`。

当 `expr` 是 block expression 时，closure body 可以包含多条语句。

## Usage

```chiba
let inc = (x: i32): i32 => x + 1
let make = (): String => {
	return String.from("ok")
}
```

注释：lambda 是匿名函数 surface；一旦引用外部绑定，就形成带 env 的 closure value。

## 边界

closure type 与更细的捕获表面写法可继续补充，但不改变其基本 surface 与隐式 `reset` 语义。
