- 2026-05-19 checkpoint
  - parser/frontend
    - fixed the real grammar bug in `src/frontend/chiba-level1.chibacc`: block/stmt sequencing must not use `_:trivia_list _:stmt_separator` because `trivia_list` already consumes `Newline`
    - added `comment_trivia` / `comment_trivia_list` and used them in `block_body`, `block_expr_or_stmt`, `stmt_list`, `stmt_list_rest`
    - regenerated `src/frontend/chiba_level1_parser.chiba` with `./chibacc.o`
    - rebuilt `target/debug/parser_spec.o` and revalidated previously failing `if ... else ...` / `else if` forms plus `level-1b/supports/chibacc-mini/codegen_contract.chiba` parse path
  - C06 chibacc status
    - `target/debug/level1c.o` was rebuilt successfully after parser regeneration
    - `level1c.o check level-1b/supports/chibacc-mini/codegen_contract.chiba` now passes
    - `level1c.o wat level-1b/supports/chibacc-mini/codegen_contract.chiba` still fails, but the real blocker is **not parser**
    - current blocker is backend/Core lowering for imported nominal/record/data constructors and values (`GrammarName`, `GrammarAction`, `LoweredAlternative`, `LoweredRule`, `LoweredParser`, `RecoveryNone`, `RecoveryInsert`, etc.)
    - nanopass dump shows `validation err("dangling symbol")` on those constructor refs during L8 validated Core, so the next real fix belongs to object/type/data lowering or symbol synthesis, not to smoke syntax
  - immediate next step
    - add/finish a minimal backend path for nominal record/data object construction + field access that `std.chibacc` runtime values need, then retry `codegen_contract` wat/run

- string interpolation
  - `"a {y} b"` == `"a " + Y.to_string(y) + " b"`
- methods
  - has methods m for type T, but on namespace x which is not imported, then `T.m` should not be called (missing imports)
  - define methods for a type
  - calling methods
  - define multiple methods with same name raise error
- operator overloading
  - for + - * / etc
  - for [x] (op_index) [x..y] (op_index_slice)
- template/generics
- row poly
  - also check for this kind: `def f(x:{r|y:z}) : r` `r` is the `T`
- auto generic `def id(x) = x` == `def id[T](x:T):T = x`
- call with specific generics `x[T](v)`
- global variable like `def ONE:i64 = 1`
  - checking `def VAR:type = {...}`
    - body to init block
    - init block calling before main
    - VAR could be used in other function
  - checking `def VAR2:type = VAR`, could define, and correct
  - checking co-dependent global var could not pass

- Self type
  - especially `type X[T] {x:T}` with `def X[T].update_x(self: Self, new_x: T):Self = {self|x:new_x}` for generics

- deep pattern matching for
  - `match` expr
  - `if let` expr

- pipe behaviour
  - `a.b() == a |> A.b`
  - `a.b().c() == a |> A.b |> A.`c
  - `a |> f(b,_,_) == f(b,a,a)`
  - `a |> f == f(a)`
  - `a |> f |> g == g(f(a))`

- tuple to ADT, ADT to tuple: spec ADT Ctor to undescore like HttpError to :http_error, value to tuple body, `HttpError(400, "...")` => `(:http_error, 400, "...")` and reverse
  - for example HttpResult has HttpOk and HttpError, 
  - `tuple_to_adt[HttpResult[String]]((:http_ok, ...))`
  - `adt_to_tuple[Tuple[Symbol, u8, String]](HttpError(400, "..."))`
  - function before should be built in method

- ADT Ctor after type/exhaustive check lower to upper tuple -> lower to record
  - `HttpError(i64, String)` -> `def __ADT_CTOR_HttpError(...) = (:http_error, ...)` like this

- pattern args for funcs
  - `def name(Some(x): Option[X]): Y = {...}`
  - `def name(None:Option[X]):Y = {...}`
  - 这个会被翻译成
    `def name(_var:Option[X]):Y={
    match {
    Some(x) => _name1(x),
    None=> _name2(None)
    }
    }`
