# 普通值默认是 Managed Value

## 语法

该条目描述默认语义，不新增独立语法。

## 语义

普通 `data`、tuple、record、closure env 默认按 managed value 处理，不要求用户为日常值显式标注 unique 或 reference 类修饰。

这里的 managed 不是 GC 同义词，而是“受 arena / escape / promotion / RC 规则统一管理”的值语义。

低级 capability 类型如 `Ptr[T]`、`Ref[T]`、`UnsafeRef[T]` 不属于这条默认 managed value 路线。

## Usage

```chiba
data User {
	User(name: String, age: i32)
}

let u = User("a", 10)
```

注释：`u` 是普通 managed value；它默认走 level-1 的 managed 内存语义，而不是要求用户显式选择底层 capability 模式。

## 边界

当程序进入 FFI、Metal、ABI 或共享可变能力边界时，应显式改用 capability 类型，而不是依赖 managed value 自动退化。
