# Chiba Level 1 Memory Model Draft

## 0. 目标

本文描述 Chiba level-1 的内存模型、隐式 `reset`、值与引用区分、以及 escape legality。

本文只讨论 level-1。

## 1. 基本立场

level-1 不采用 Rust 风格 borrow checker。

level-1 的目标是：

- 普通值默认走 managed value 路线
- 普通函数调用与 closure 调用蕴含隐式 `reset`
- `reset` 对应 arena / region 边界
- 通过 escape 规则决定值是否需要提升
- 在 level-1 就区分值类型与引用类型

## 2. Managed Value

level-1 的普通 `data`、tuple、record、closure env 默认按 managed value 处理。

这意味着：

- 用户不需要显式为普通 ADT 书写 unique 注解
- 编译器内部可以追踪 uniqueness，但它不是用户必须书写的 surface type constructor
- 值优先待在最便宜、最局部、最短命的位置

## 3. 值类型与引用类型

### 3.1 值类型

值类型包括：

- 标量
- tuple
- 普通 record
- 普通 `data`
- closure value

### 3.2 引用类型

引用类型包括：

- `Ptr[T]`
- `Ref[T]`
- `UnsafeRef[T]`

这一区分是 level-1 的必要前提，因为 escape legality、continuation、`send`、answer type 边界都依赖它。

## 4. `Ptr[T]`、`Ref[T]`、`UnsafeRef[T]`

### 4.1 `Ptr[T]`

`Ptr[T]` 是边界型能力，主要面向：

- FFI
- Metal
- ABI
- unsafe 内存操作

它不应成为普通 ADT 建模的默认手段。

### 4.2 `Ref[T]`

`Ref[T]` 表示单 world 内的受控可变引用单元。

它不是普通 record field 的默认存储方式，而是显式引入的可变性能力。

### 4.3 `UnsafeRef[T]`

`UnsafeRef[T]` 是更低级的同步/并发边界能力。

它与 `#[sync]`、跨 world 共享、以及后续更强同步规则相关。

## 5. 隐式 `reset`

普通函数调用蕴含隐式 `reset`。

closure 调用也蕴含隐式 `reset`。

因此，哪怕用户没有显式写 `reset`，调用边界本身也形成局部 region / arena 边界。

## 6. `reset` 作为 Arena 边界

在 level-1 的方向里，`reset` 不只是控制边界，也是天然的 arena 边界。

因此一个值初始上更适合待在：

- 当前显式 `reset`
- 或当前函数/closure 调用对应的隐式 `reset`

只有当生命周期要求它跨出当前边界时，才发生提升。

## 7. Escape 点

至少有下面几类 escape 点：

- `return`
- closure capture
- `send`
- continuation capture
- 存入更长生命周期对象

这些点决定某个值不能继续停留在当前最内层 arena 中。

## 8. 提升规则

本文暂不写死完整实现算法，但至少要求下面几点：

- 值不能在离开其所属 arena 后仍被引用
- 返回值不能保留对 callee 局部 arena 的悬空引用
- closure env 若跨越当前调用边界，则必须被提升
- continuation 若捕获了局部控制上下文，其合法性必须受 arena 边界约束

后续实现可选择：

- 提升到 caller region
- 提升到更外层 arena
- 提升到 RC 管理区

但 level-1 规范至少要先把“不能留在当前局部 arena”写清楚。

## 9. Uniqueness

uniqueness 在 level-1 中可以是编译器内部事实，但不是要求用户普遍书写的 surface annotation。

这意味着：

- 编译器可利用 uniqueness 做 FBIP 或原地复用
- 用户不需要把普通递归 ADT 都写成显式 unique 型
- API 设计不以 uniqueness annotation 为核心

## 10. `send` 与 World 边界

延续整体路线，跨 world 数据传递依赖 `send`。

因此 level-1 至少要表达：

- 什么类型默认 `!send`
- `Ref[T]` 与 `send` 的关系
- continuation 与 `send` 的关系
- 何时必须拒绝跨 world 传递

当前方向应保持保守。

## 11. 与 Continuation 的关系

continuation 不是纯粹的普通数据；它会把控制上下文与 arena 边界绑在一起。

因此本文倾向于：

- continuation 默认不能自由跨 arena / world 边界
- continuation 默认不能被当成普通 managed value 任意移动
- continuation legality 需要同时看 answer type 与 memory boundary

## 12. 与 Generics 的关系

generic × memory legality 是 level-1 的重要交叉点。

generic 本体可以先收集 obligation，但实例化后的 concrete type / concrete shape 若触发不合法 escape，仍需在实例化或检查点报错。

## 13. 编译速度约束

为了兼顾编译速度，level-1 memory model 需要：

- 尽量把规则表达为局部 escape legality
- 不引入 Rust 风格 borrow checker
- 不把 uniqueness 暴露成处处都要显式书写的用户负担
- 优先使用隐式 `reset` 边界表达短命值

## 14. 暂定非目标

下列内容不是当前 level-1 首批目标：

- 完整 borrow checking
- 复杂 region polymorphism
- answer type polymorphism
- 依赖 interface 的内存能力系统
- 把普通数据类型全面变成显式 unique API

## 15. 开放问题

- caller region / outer arena / RC 区三者之间的精确选择策略仍可由实现决定，但不得超出这三类正式目标空间
- `Ref[T]` 的具体 surface API 名称仍可在方法面与赋值协议之间继续细化
- continuation 的存储、返回与跨边界限制粒度仍需要在 continuation 专项条目里进一步压实
