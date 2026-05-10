# Semantic Gates Before Second Bootstrap

These fixtures pin down level-1 semantic obligations that must not regress while
the full HM/row/answer-type pipeline is still being rewritten in level-1.

`vp run semantic:gates` checks:

- method call routing order: field callable, receiver method, qualified callee
- row polymorphism surface: one row bound, canonical field order, field access
- namespace merge: two files contributing to one namespace and a third consumer
- memory capabilities: `Ref[T]`, `UnsafeRef[T]`, `Ptr[T]`, `Atomic[T]`, `:=`
- delimited continuation multi-entry: classic multi-shot shift/reset shape

The gates first require every fixture to parse with the level-1 parser. They then
apply spec-level checks that are stricter than the current bootstrap backend, so
Second Bootstrap work has executable targets before the complete typed pipeline
exists.
