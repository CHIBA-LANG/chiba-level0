# Multiline String

## 语法

multiline string 允许普通字符串跨越多行。

## 语义

它保留换行并改变字符串终止规则。

level-1 支持 multiline string，并允许它与 raw / interpolation 组合。

multiline 默认保留换行；更细的缩进裁剪规则可后续补充，但不改变它进入统一 string literal protocol 的事实。

## Usage

```chiba
let text = ##"
hello
${name}
"##
```

注释：multiline 只是字符串 surface 的一种；它和 interpolation、delimiter 规则一起进入统一协议处理。

## 边界

缩进处理可按后续单独规则细化，但 multiline / raw / interpolation 的可组合性已在本层确定。
