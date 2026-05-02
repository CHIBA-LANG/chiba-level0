# ASM 输入/输出 Tuple 语义

## 语法

该条目描述 inline `asm` 的 tuple 化输入输出接口。

当前 `asm` 的表面更准确地说是“输入绑定列表 / 输出绑定列表”，而不是我之前写的函数式参数元组调用。

## 语义

tuple 可用于承载多输入、多输出或混合返回值。

在 level-1 中，asm 的多输入 / 多输出语义与普通 tuple 值语义保持紧密对应：它们都体现固定顺序、固定元数的值形状。

asm 不引入另一套“伪 tuple”；多个输入或输出的顺序与语言层 tuple 顺序一一对应，但 surface 上当前先写成绑定列表，而不是直接暴露成单个 tuple 参数。

## Usage

```chiba
asm (ptr: rdi, idx: rsi) : (rax) => {
	"mov rax, [rdi + rsi*8]"
}

asm (ptr: rdi, idx: rsi, val: rdx) : (rax) => {
	"mov [rdi + rsi*8], rdx"
	"xor eax, eax"
}
```

注释：这里的输入/输出列表在语言层对应固定顺序的多路值接口；是否在更高层显式投影成 tuple，可以继续由 asm 约束文档细化。

## 边界

多个输出如何映射回语言层 tuple / 多返回值、以及未来 `LIR` 是否复用同一抽象，仍需继续细化；但当前 inline asm 的实现事实首先是“绑定列表 + 指令 block”。
