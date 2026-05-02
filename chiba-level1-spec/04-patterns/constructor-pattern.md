# Constructor Pattern

## 语法

constructor pattern 使用 ADT 构造子在 pattern 位置解构值。

## 语义

它要求被匹配值来自对应构造子，并把内部字段分配给子 pattern。

当不同 `data` 存在同名 constructor 时，level-1 通过按类型限定路径解决冲突。

默认允许裸 `Ctor(...)` / `Ctor` 写法；只有在冲突或语义不清时，才要求写成 `Type.Ctor(...)`。

## Usage

```chiba
match value {
	Some(x) => use(x)
	None => fallback()
}

match value2 {
	Option.Some(x) => use2(x)
	Option.None => fallback2()
}
```

注释：无冲突时允许裸 constructor；有冲突或需要消歧时，使用 `Type.Ctor` 形式。

## 边界

constructor pattern 是 refutable pattern；`let` 位置不接纳这类 pattern。
