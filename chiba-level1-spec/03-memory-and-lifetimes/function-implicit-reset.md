# 普通函数调用蕴含隐式 `reset`

## 语法

该条目描述默认调用语义，不新增表面语法。

## 语义

每次普通函数调用都建立局部 `reset` 边界，这为短命值提供默认 arena。

因此，函数调用不只是控制转移，也是内存边界切换。

函数返回值若来自当前局部 arena，必须经过 escape legality 与必要提升后才能离开该边界。

## Usage

```chiba
def make_name(): String = {
	let s = String.from("chiba")
	return s
}
```

注释：`make_name` 调用天然建立一个隐式 `reset`；`s` 若要作为返回值离开当前调用边界，就必须满足 escape 规则。

## 边界

tail call 优化不改变这条语义承诺；外部调用是否同构由 ABI 细节决定，但 level-1 对本地函数调用一律视为隐式 `reset`。
