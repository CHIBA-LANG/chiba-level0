# Atom Symbol Literal

## 语法

atom symbol literal 使用类似 `:tag` 的语法。


```chiba
let status = (:ok, value)
// ...
if let (:ok, value) = status {

} else {

}
```

## 语义

它们用于表达轻量命名值，通常与：

- 模式匹配
- 标签化数据
- 轻量枚举风格常量

因为尺八默认的返回ABI在level1之后将会是2个返回值，所以轻量的tag可以使用atom来加速实现
多用于opentag，比如open的错误类型

采用 [60-bit Index : 4-bit Tag] 的结构。索引指向一个全局连续数组，数组项包含字符串指针和哈希值。

## TODO

chiba 将不会设计 dynamic 的 atom, 但是会预留函数 `to_atom[T:ToString](T)` 这个函数将会生成和ABI一样的Atom用于用户动态创建Atom和静态的Atom进行比较