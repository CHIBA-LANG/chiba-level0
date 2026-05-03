# `Ptr[T]` 与 FFI / Metal / ABI 边界

## 语法

该条目不新增语法，描述 `Ptr[T]` 在边界场景中的合法使用。

## 语义

`Ptr[T]` 是语言面与外部内存模型接触的主要桥梁之一。

它主要服务于：

- FFI
- C / ABI 边界
- Metal / device / raw buffer 场景
- 其他需要显式地址语义的低级接口

`Ptr[T]` 不承担 managed value 的保活与生命周期管理承诺；调用方必须显式进入相应边界协议。

在非 `#![Metal]` 的普通 level-1 代码里，使用 `Ptr[T]` 应落在 `unsafe` 责任边界内。

## Usage

```chiba
extern "c" def memcpy(dst: Ptr[u8], src: Ptr[u8], n: usize): Ptr[u8]
```

注释：`Ptr[T]` 的目标就是把语言值系统与外部裸地址世界隔开，而不是给普通业务值提供默认引用形式。

## 边界

layout、alignment、nullability 等 ABI 细节可在更低层规范继续展开；但 level-1 已固定 `Ptr[T]` 的角色是“裸地址 capability”，不是 managed 引用。
