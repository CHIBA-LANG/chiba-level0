# level-1b closure pipeline

The closure pipeline starts after answer/control checking and one-pass CPS. It
keeps the nanopass boundary narrow:

- `usage_cps.chiba` recomputes `0 | 1 | many` usage facts on CPS Core.
- `continuation_simplify.chiba` deletes unused continuations, inlines
  single-use continuations, and marks many-use continuations for packages.
- `closure_convert.chiba` builds explicit closure and continuation environment
  layouts while rejecting world/thread/unsafe captures.
- `lambda_lift.chiba` assigns stable symbols to nested functions.
- `env_simplify.chiba` shrinks environments, erases no-capture closures, and
  directifies single-use known closures.

No pass in this directory owns raw memory, Metal APIs, or backend layout emit.
Wasm-GC lowering consumes `OptimizedClosureModule` in C11.
