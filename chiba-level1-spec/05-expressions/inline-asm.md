# Inline `asm`

## 语法

inline `asm` 允许在表达式层嵌入低级汇编片段。

当前实现事实的 surface 形态是：

```chiba
asm (inputs...) : (outputs...) => {
	"instr"
	"instr"
}
```

其中：

- 左侧 `(...)` 描述输入值及其绑定位置
- 冒号后的 `(...)` 描述输出位置
- `=>` 后接汇编指令 block

## 语义

其输入输出需与宿主语言类型系统对接，尤其是寄存器绑定、多输出与返回值形状。

当前 `asm` 本身就是 level-1 的低级表达式入口；它不是我之前写的“普通函数式 `asm(...)` 调用”。

在非 `#![Metal]` 的普通 level-1 代码里，inline `asm` 应通过 `unsafe` 边界进入；`#![Metal]` 则属于另一类整体低级模式，不与这条规则混写。

它不绕开宿主语言的值/引用与 capability 区分；asm 的输入输出仍需落在语言可解释的值形状上。

未来若引入 `LIR`，它应是另一层更稳定、可跨平台的低级 IR / assembly-like surface，而不是当前字符串型 inline asm 的别名。

## Usage

```chiba
def load64(ptr: i64, idx: i64): i64 =
	asm (ptr: rdi, idx: rsi) : (rax) => {
		"mov rax, [rdi + rsi*8]"
	}
```

注释：当前 inline asm 是“带输入/输出绑定表 + 指令字符串 block”的表达式形态，而不是普通函数调用。

## 边界

输入输出约束语法，以及 clobber / volatile / memory barrier 的更细 surface，可以继续单独细化；未来 `LIR` 若进入语言，应单独立项，不与当前 inline asm 混写。
