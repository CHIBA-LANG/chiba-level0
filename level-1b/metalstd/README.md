# level-1b metalstd

`metalstd` is the only low-level library layer. Every Chiba source file in this
directory must be `#![Metal]`.

This layer owns Wasm-GC allocation intrinsics, WASI preview1 ABI shims, typed
pointer capabilities, atomic capabilities, traps, and linear-memory scratch used
only for host ABI boundaries. It must not provide high-level collections,
strings, parser helpers, regex helpers, or ordinary user IO facades.

Public APIs need `///` doc comments, and every unsafe boundary needs a
`/// Safety` section describing the caller obligations.

Every callable Metal item must also carry `#[compile_if(...)]`. The level-1b
Wasm path uses `backend="wasm-gc"` and the WASI boundary additionally requires
`target="wasm32-unknown-wasi"`.

`__metal_intrinsic("...")` is not an extern ABI. It is a compiler-known
primitive that is accepted only in `#![Metal]` files, resolved during semantic
checking, validated against the selected target facts, and lowered by the
Wasm-GC Core/backend into the matching object, linear-memory, atomic, trap, or
host-boundary operation.
