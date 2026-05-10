# level-1b Bootstrap Workspace

`level-1b` is the pre-Second-Bootstrap implementation workspace. It is a clean
level-1 source tree intended to grow into the replacement for the current
generator/compiler stack while still being buildable by the level-0 seed.

Current contract:

- `src/level1b_main.chiba` is the fixed smoke entry.
- `vp run level1b:smoke` must compile this project with the level-0 seed using
  `timeout 10`.
- The same source must lower through the current level-1 WAT path and run in
  Node via `tools/node/run-wat.mjs`.

Until the std surface is frozen, level-1b code should keep dependencies small.
Low-level pointer-like helpers belong behind `#![Metal]` modules only.
