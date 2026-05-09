(module
  (import "wasi_snapshot_preview1" "path_open"
    (func $path_open
      (param i32 i32 i32 i32 i32 i64 i64 i32 i32)
      (result i32)))
  (import "wasi_snapshot_preview1" "fd_read"
    (func $fd_read (param i32 i32 i32 i32) (result i32)))
  (import "wasi_snapshot_preview1" "fd_close"
    (func $fd_close (param i32) (result i32)))
  (memory (export "memory") 1)
  (data (i32.const 128) "supports/bootstrap/wasi-read-input.txt")
  (func (export "_initialize"))
  (func (export "main") (result i64)
    (local $errno i32)
    (local $fd i32)

    i32.const 3
    i32.const 0
    i32.const 128
    i32.const 38
    i32.const 0
    i64.const 2
    i64.const 0
    i32.const 0
    i32.const 0
    call $path_open
    local.set $errno

    local.get $errno
    if
      local.get $errno
      i64.extend_i32_u
      i64.const 1000
      i64.add
      return
    end

    i32.const 0
    i32.load
    local.set $fd

    i32.const 8
    i32.const 64
    i32.store
    i32.const 12
    i32.const 16
    i32.store

    local.get $fd
    i32.const 8
    i32.const 1
    i32.const 24
    call $fd_read
    local.set $errno

    local.get $fd
    call $fd_close
    drop

    local.get $errno
    if
      local.get $errno
      i64.extend_i32_u
      i64.const 2000
      i64.add
      return
    end

    i32.const 64
    i32.load8_u
    i64.extend_i32_u)
)
