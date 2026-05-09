(module
  (import "wasi_snapshot_preview1" "args_sizes_get"
    (func $args_sizes_get (param i32 i32) (result i32)))
  (import "wasi_snapshot_preview1" "environ_sizes_get"
    (func $environ_sizes_get (param i32 i32) (result i32)))
  (memory (export "memory") 1)
  (func (export "_initialize"))
  (func (export "main") (result i64)
    (local $errno i32)
    i32.const 0
    i32.const 4
    call $args_sizes_get
    local.set $errno

    local.get $errno
    if
      local.get $errno
      i64.extend_i32_u
      i64.const 1000
      i64.add
      return
    end

    i32.const 8
    i32.const 12
    call $environ_sizes_get
    local.set $errno

    local.get $errno
    if
      local.get $errno
      i64.extend_i32_u
      i64.const 2000
      i64.add
      return
    end

    i32.const 0
    i32.load
    i32.const 100
    i32.mul
    i32.const 8
    i32.load
    i32.add
    i64.extend_i32_u)
)
