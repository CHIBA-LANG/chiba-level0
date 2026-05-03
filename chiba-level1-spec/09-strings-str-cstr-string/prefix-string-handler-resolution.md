# Prefix String Handler Resolution

## 语法

该条目描述带 prefix 的字符串字面量如何解析到具体 handler。

## 语义

prefix 决定字符串进入哪个处理协议或构造路径。

## Usage

```chiba
let html_doc = html"<p>ok</p>"
let sql_text = sql"select * from users"
```

注释：这里的 `html` 与 `sql` 不是普通变量调用，而是字面量前缀分派入口；解析器先识别 prefix string surface，再把它交给对应 handler。

## 边界

需要单独明确：

- prefix 的命名空间
- 与普通方法解析是否共享一套规则
