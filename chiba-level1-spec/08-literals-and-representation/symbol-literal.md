# Symbol Literal

## 语法

symbol literal 使用 atom / symbol 风格记法，如 `:tag`。

## 语义

它表示轻量命名常量，适合模式、标签和值级轻量枚举。

level-1 中，symbol literal 属于稳定值级字面量类别，不等价于字符串，也不等价于普通标识符引用。

## Usage

```chiba
let tag = :ok

match status {
	:ok => handle_ok()
	:error => handle_err()
}
```

注释：`:ok` 这类 literal 直接进入 symbol / atom 路线，而不是字符串协议。

## 边界

是否采用 intern 由实现决定；但语言语义上，symbol literal 已是独立于字符串的值类别。
