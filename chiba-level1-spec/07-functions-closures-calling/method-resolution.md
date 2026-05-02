# Method Resolution

## 语法

该条目描述 method lookup 规则，不新增 surface syntax。

## 语义

解析需要结合：

- 方法名
- receiver shape
- concrete instantiation
- overload 候选

level-1 采用最佳候选规则。

若多个候选都可用，则按“同文件后定义覆盖先定义”的规则选择最新候选。

这是一条 level-1 规则，而不是把所有歧义都报错。

## Usage

```chiba
def Vec2.show(self): String = "old"
def Vec2.show(self): String = "new"

let s = v.show()
```

注释：这里的“最新”是同文件内更靠后的定义，而不是泛化成任意导入顺序或 namespace 深度上的最后一个。
