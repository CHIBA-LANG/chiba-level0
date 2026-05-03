# chibalex

[![chibalex-ci](https://github.com/CHIBA-LANG/chibalex/actions/workflows/ci.yml/badge.svg)](https://github.com/CHIBA-LANG/chibalex/actions/workflows/ci.yml)

`chibalex` is Chiba's lexer generator: it takes a `.chibalex` file and produces a `.chiba` lexer module that can be imported directly.

Current CLI:

- `./chibalex/target/debug/main.o input.chibalex -o output.chiba`
- or build it first from the repository root with `./main.o --project chibalex`

The generator does the following:

1. Reads the `.chibalex` file
2. Parses the header / charclasses / macros / token rules / footer
3. Expands `$name` and `@name`
4. Emits lexer source code based on the current regex VM

## File structure

A `.chibalex` file looks like this:

```text
#![CHIBALEX]

{
    namespace lexer.demo
    use metalstd.str.*
}

$digit = [0-9]
@ws    = $WS+
@ident = $XID_START $XID_CONTINUE*

tokens :-
    @ws      ;
    "let"    { KwLet }
    @ident   { Ident(s) }
    "="      { Eq }

{
    data Token {
        KwLet,
        Ident(Str),
        Eq,
        LexError(i64),
        Eof,
    }
}
```

Meaning:

- `#![CHIBALEX]`: file marker
- first `{ ... }`: copied verbatim to the top of the generated file, usually for `namespace` and `use`
- `$name = ...`: character class definition
- `@name = ...`: regex macro definition
- `tokens :-`: token rule section
- `;`: skip this rule and emit no token
- `{ Expr }`: emit `Some(Expr)` when the rule matches
- final `{ ... }`: copied verbatim into the generated file, usually for `Token` definitions and helper functions

## Rule syntax

### 1. Character classes

```text
$digit = [0-9]
$hex   = [0-9A-Fa-f]
```

Use them inside patterns through `$digit`.

### 2. Macros

```text
@ident = $XID_START $XID_CONTINUE*
@int   = $ASCII_DIGIT+
```

Use them inside patterns through `@ident`.

### 3. Token rules

```text
tokens :-
    $WS+      ;
    "if"      { KwIf }
    @ident    { Ident(s) }
```

Rules are prioritized by declaration order when match lengths are equal.

### 4. `s` inside actions

Action expressions can use `s` directly. It is the matched slice as a `Str`.

Example:

```text
":" @ident { Atom(mk_str(s.ptr + 1, s.len - 1)) }
```

## Built-in character classes

Current built-ins:

- `$ASCII_DIGIT` → `[0-9]`
- `$ASCII_ALPHA` → `[A-Za-z]`
- `$ASCII_ALPHANUMERIC` → `[A-Za-z0-9]`
- `$ASCII_UPPER` → `[A-Z]`
- `$ASCII_LOWER` → `[a-z]`
- `$ASCII_HEX` → `[0-9A-Fa-f]`
- `$ASCII_OCT` → `[0-7]`
- `$ASCII_BIN` → `[01]`
- `$WS` → `[ \t\r\n]`
- `$NEWLINE` → `(?:\r\n|\r|\n)`
- `$ANY` → `.`, matching one full UTF-8 codepoint
- `$XID_START`
- `$XID_CONTINUE`

### About `$XID_START` / `$XID_CONTINUE`

The current implementation is not strict Unicode XID.

At runtime these use native codepoint tables and also accept:

- `_`
- emoji ranges from the current identifier table

So code like this is currently valid:

```text
def 火() : _🥲 = {}
```

## Override behavior

User-defined `$name` entries can override built-ins with the same name.

Example:

```text
$WS = [ ]
```

This overrides the default `$WS`.

## Current regex features

`.chibalex` patterns currently support:

- literals: `"let"`
- character classes: `[abc]`, `[^abc]`, `[a-z]`
- grouping: `(...)`
- alternation: `a | b`
- repetition: `*`, `+`, `?`
- built-in escapes: `\d`, `\D`, `\w`, `\W`, `\s`, `\S`
- built-in identifier escapes: `\i`, `\j` (used by `$XID_START` / `$XID_CONTINUE`)
- `.`: match one UTF-8 codepoint

## Current limitations

This version already matches at UTF-8 codepoint granularity, but still has some limits:

- no `\uHHHH` yet
- no `\U{HHHHHH}` yet
- token actions are inserted into generated code as-is, without extra validation
- the engine is still a runtime regex VM, not a DFA table-driven backend

## Minimal example

```text
#![CHIBALEX]

{
    namespace lexer.min
    use metalstd.str.*
}

@ident = $XID_START $XID_CONTINUE*
@ws    = $WS+

tokens :-
    @ws     ;
    "def"   { KwDef }
    @ident  { Ident(s) }
    "("     { LParen }
    ")"     { RParen }
    "="     { Eq }

{
    data Token {
        KwDef,
        Ident(Str),
        LParen,
        RParen,
        Eq,
        LexError(i64),
        Eof,
    }
}
```

Generate it with:

- `./chibalex/target/debug/main.o demo.chibalex -o demo_lexer.chiba`

Then in another Chiba file:

- `use lexer.min.*`
- call `lex_all(src.ptr, src.len, file_id)`

## Repository example

For a full example, see [chibalex/chiba.chibalex](chiba.chibalex).
