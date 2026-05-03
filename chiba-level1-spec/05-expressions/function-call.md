# Function Call

## 语法

function call 使用普通调用语法，把 callee 与实参列表组合。

基本形式为：

```chiba
f(a, b, c)
obj.m(a, b)
```

当最后一个实参是 closure literal 时，允许使用 trailing closure sugar：

这里的 trailing closure 是 call-site 专用语法，而不是独立 lambda literal。

```chiba
f(a) {|x, y|
	body
}
```

其语义等价于把最后一个参数写成普通 lambda：

```chiba
f(a, (x: Tx, y: Ty): R => {
	body
})
```

首发规则只允许一个 trailing closure，且该 trailing closure 只附着到最近的 call expression。

## 语义

普通函数调用蕴含隐式 `reset`，因此调用既是值计算，也是局部控制/内存边界。

trailing closure 只是调用语法糖，不引入新的调用语义。

多行 function call 可以在未闭合的参数列表内部跨行继续；这是因为 `(` `)` 尚未闭合，而不是因为任意空白允许继续解析。

普通函数、closure、method call 在 level-1 中共享同一调用骨架；method call 只是 callee 解析阶段不同，不是另一种求值模型。

参数按书写顺序求值。

## Usage

```chiba
let x = add(1, 2)
let y = f(a) {|v|
	return v + 1
}
```

注释：普通 call 与 trailing closure call 共享同一调用语义；差别只在 surface sugar。

## 边界

trailing closure 只允许一个，并附着到最近的 call expression。
