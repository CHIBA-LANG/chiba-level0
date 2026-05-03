# Closure 调用蕴含隐式 `reset`

## 语法

该条目描述 closure 调用时的默认控制/内存边界。

## 语义

closure body 与普通函数一样，应建立局部 `reset` 以承载其局部短命值。

closure env 是被捕获值的承载结构；closure body 的隐式 `reset` 则是每次调用时新建立的局部边界，二者不能混为同一层。

## Usage

```chiba
let f = (): i32 => {
	let s = String.from("tmp")
	return s.len()
}

let n = f()
```

注释：`f` 的 env 与 `f()` 调用时产生的局部 arena 不是一回事；closure body 仍然像普通函数一样拥有自己的隐式 `reset`。

## 边界

continuation 捕获若跨过 closure 调用边界，仍受 answer type 与 memory legality 约束。
