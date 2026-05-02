# Arena / Escape / RC / Uniqueness / FBIP 在 Level-1 的最小承诺

## 语法

该条目描述规范承诺，不新增语法。

## 语义

level-1 不需要一次性把全部优化细节写死，但需要明确最小承诺：

- 存在 arena 边界
- 存在 escape legality
- 允许更长期存活值被提升
- uniqueness 可作为内部优化事实

这些内容在 level-1 中不是“仅实现说明”，而是正式语义承诺。

RC、uniqueness、FBIP 也进入首版规范正文；它们不是可随意省略的实现细节。

规范至少承诺编译器必须具备这些机制以满足 level-1 的内存语义，即使不把每一次触发时机都暴露给用户控制。

## Usage

```chiba
def keep(x: String): String = {
	return x
}
```

注释：哪怕 surface 很普通，背后依旧受 arena、escape、promotion、RC/uniqueness 相关承诺约束；这些不是“优化开了才有”的行为。

## 边界

具体采用哪条优化路径仍可由实现决定，但不能违反这些机制所承载的语言承诺。
