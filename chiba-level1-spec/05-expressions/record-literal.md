# Record Literal

## 语法

record literal 通过字段名和值构造 record。

其大括号与 block、record update、trailing closure 共用外形，但在表达式位置应按既定歧义消解规则进入 record literal 分支。

多行 record literal 可以在未闭合的 `{` `}` 内部跨行继续。

例如：

```chiba
{
	x: 1,
	y: 2,
}
```

在右花括号闭合前，内部换行不终止当前表达式。

## 语义

它通常产生 closed row 形状的 record 值。

字段顺序不影响 record literal 的语义身份；类型检查按字段集合与字段类型进行。

level-1 允许字段简写：当字段名与同名局部绑定一致时，可省略右侧重复书写。

## Usage

```chiba
let x = 1
let y = 2
let p = { x, y }
let q = { x: 1, y: 2 }
```

注释：`{ x, y }` 与 `{ x: x, y: y }` 属于同一 record literal 体系。

## 边界

与 block / record update / trailing closure 的大括号歧义按既定入口规则处理；一旦进入 record literal 分支，字段顺序与书写简写都不改变其语义种类。
