# `extern "syscall"` 的现状

## 语法

该条目描述 `extern "syscall"` 的表面形式与当前支持状态。

## 语义

它更接近平台特定边界，而不是普通可移植 ABI。

## 边界

需要单独明确：

- 是否进入 level-1 正式规范
- 与 Metal / low-level backend 的关系
