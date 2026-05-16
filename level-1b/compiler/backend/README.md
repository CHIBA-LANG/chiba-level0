# level-1b Wasm-GC backend

The backend starts from `OptimizedClosureModule`. It does not own source
semantics, type checking, continuation legality, or closure decisions.

The pass split is deliberately small:

- `layout.chiba` builds a stable Wasm-GC layout table.
- `core.chiba` lowers optimized closure Core to backend-neutral Wasm-GC Core.
- `validate_core.chiba` rejects dangling layouts/symbols, illegal tailcalls,
  and illegal continuation packages before emit.
- `wat_emit.chiba` serializes validated Core as WAT without semantic choices.

Binaryen, `wasm-opt`, and other wasm binary tools are external development or
CI helpers. The Chiba backend owns the WAT contract; binary emission and
optimization are downstream toolchain work.
