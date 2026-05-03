# Level-1 区分值类型与引用类型

## 语法

该条目描述类型分类，不新增 surface syntax。

## 语义

level-1 必须区分：

- 值类型
- 引用类型
- continuation 等控制能力

因为 answer type、arena 边界、`send` 与 escape legality 都依赖这一分类。

level-1 中：

- 普通 `data` / tuple / record / closure value 默认按值语义进入 managed value 分类
- `Ref[T]` / `UnsafeRef[T]` / `Ptr[T]` 属于 capability / reference 类边界
- continuation 不是普通值类型，应单独按控制能力处理

## Usage

```chiba
let value = (1, 2)
let r: Ref[i32] = cell
```

注释：`value` 与 `r` 在 send、escape、arena 合法性上不受同一套规则对待；这正是 level-1 必须显式区分值与引用/能力类型的原因。

## 边界

closure value 默认仍按普通值看待；continuation 单独占一类控制能力，不并入普通值或普通引用。
