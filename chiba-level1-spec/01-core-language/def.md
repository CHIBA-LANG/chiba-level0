# `def`

## 语法

`def` 定义普通函数，也可参与 `extern` 形式与 method-style 定义。

## 语义

`def` 引入可调用顶层绑定。其主体可能是普通 block，也可能是外部声明或特殊 ABI 入口。

`def` 也可定义 method-style item。level-1 正式引入 `def Type.method(...)`，方向接近 Go 的 receiver method，而不是 trait witness 风格的方法定义。

普通 `def` 与 method-style `def Type.method(...)` 共享同一套函数定义基底；差异只在 receiver 关联与 method resolution。

# Method-Style `def Type.method(...)`

## 语法

method-style 定义采用：

```chiba
def Type.method(self, ...)
```

的方向。

## 语义

这种写法把方法定义挂到某个 receiver 约束之上，但 level-1 不依赖 interface witness，而是最终落到 structural receiver shape 与 method resolution 规则。

method-style `def` 是 level-1 的正式能力。

## Usage

```chiba
data Vec2 {
	x: f32,
	y: f32,
}

def Vec2.norm(self): f32 = {
	return sqrt(self.x * self.x + self.y * self.y)
}
```

注释：`Vec2.norm` 采用 receiver 风格定义，surface 上是 method，但底层仍参与统一的函数与方法解析模型。
