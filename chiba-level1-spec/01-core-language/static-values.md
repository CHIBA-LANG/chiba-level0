# 顶层静态值定义

## 语法

使用 `def` 但是不加 `()` 来创建顶层静态值类型

```chiba
def PI : f32 = 3.14159265358

// in function will lift to top
def f() = {
    def E : f32 = 2.7
    def EPlusPI : f32 = E + PI
}
```

所以下面的虽然看起来很危险但是是合法的

```chiba
def FILE : Ref[File] = {
    let f = open(f, "rw")
    Ref.new(f)
}
```

## 语义

如果顶层静态值类型非静态类型
则会塞入stub并在init的时候codegen初始化行为

语义是存储到全局线程的 context 

level-1 支持顶层静态值。

顶层静态值不要求编译期常量初始化；初始化逻辑进入模块或程序的 `init` 阶段执行。

因此静态值的语义重点是“存在稳定的顶层绑定”，而不是“必须可 constexpr 求值”。

## Usage

```chiba
def stdout_file: Ref[File] = {
    let f = open("/dev/stdout", "w")
    Ref.new(f)
}

def pi: f32 = 3.1415926
```

注释：`pi` 是普通静态值；`stdout_file` 则展示初始化可发生在 `init` 阶段而非编译期常量折叠。