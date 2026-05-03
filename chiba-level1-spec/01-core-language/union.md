# `union`

## 语法

`union` 用于声明联合类型或低级数据布局相关类型。

## 语义

其语义和 `data` 不同，通常更靠近显式布局、低级表示或 ABI 边界。

level-1 中，`union` 不作为普通业务建模工具，而保留给低级表示、Metal 与 C ABI 等布局敏感场景。

它可以出现在 `#![Metal]` 这类显式低级模式下；在普通非 `#![Metal]` 代码里，若要使用 `union`，则应落在 `unsafe` 边界内。

其布局方向与 C ABI 保持一致，而不是走普通 `data` 的 managed value 路线。

## Usage

```chiba
#![Metal]

union Bits {
	u32v: u32,
	f32v: f32,
}
```

注释：`union` 是低级布局工具，不参与 `data` 的构造子与模式匹配语义。

## 边界

普通 level-1 代码应优先使用 `data`；只有进入显式低级边界时才使用 `union`。
