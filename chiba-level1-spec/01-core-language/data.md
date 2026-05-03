# `data`

## 语法

`data` 用于定义代数数据类型与构造子。

## 语义

`data` 引入：

- 一个类型名
- 一组构造子
- 对应的 pattern matching 入口

在 level-1 中，普通 `data` 默认按 managed value 处理，而不是要求用户普遍书写 uniqueness 注解。

constructor 默认随 `data` 一起公开；若需要收窄，则通过 `private` 处理。

constructor 冲突默认允许通过裸名使用；发生冲突时，使用 `Type.Ctor` 消歧。

## Usage

```chiba
data Option[T] {
	Some(T)
	None
}

let x = Some(1)
let y = Option.None
```

注释：无冲突时允许裸 constructor；冲突时回到 `Type.Ctor` 路径。

## 边界

record-style `data` 与普通 constructor 风格都属于同一 `data` 体系；`let` 仍不接纳 refutable constructor destruct。
