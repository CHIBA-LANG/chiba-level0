[1:1 len=9] KwNamespace
[1:11 len=5] Ident("lexer")
[1:16 len=1] Dot
[1:17 len=4] Ident("spec")
[1:21 len=1] Dot
[1:22 len=7] Ident("strings")
[1:29 len=1] Dot
[1:30 len=5] Ident("basic")
[1:35 len=2] Newline("\n\n")
[3:1 len=3] KwDef
[3:5 len=7] Ident("strings")
[3:12 len=1] LParen
[3:13 len=1] RParen
[3:14 len=1] Colon
[3:16 len=3] Ident("i32")
[3:20 len=1] Eq
[3:22 len=6] LBrace
[4:5 len=3] KwLet
[4:9 len=5] Ident("plain")
[4:15 len=1] Eq
[4:17 len=1] StringStart("", raw=0, hashes=0)
[4:18 len=11] StringChunk("hello world")
[4:29 len=1] StringEnd
[4:30 len=5] Newline("\n    ")
[5:5 len=3] KwLet
[5:9 len=7] Ident("escaped")
[5:17 len=1] Eq
[5:19 len=1] StringStart("", raw=0, hashes=0)
[5:20 len=20] StringChunk("line1\\nline2\\tindent")
[5:40 len=1] StringEnd
[5:41 len=5] Newline("\n    ")
[6:5 len=3] KwLet
[6:9 len=6] Ident("c_text")
[6:16 len=1] Eq
[6:18 len=1] StringStart("c", raw=0, hashes=0)
[6:20 len=16] StringChunk("hello from c abi")
[6:36 len=1] StringEnd
[6:37 len=5] Newline("\n    ")
[7:5 len=3] KwLet
[7:9 len=7] Ident("raw_one")
[7:17 len=1] Eq
[7:19 len=1] StringStart("", raw=1, hashes=0)
[7:21 len=18] StringChunk("raw keeps \\\\n text")
[7:39 len=1] StringEnd
[7:40 len=5] Newline("\n    ")
[8:5 len=3] KwLet
[8:9 len=8] Ident("raw_hash")
[8:18 len=1] Eq
[8:20 len=1] StringStart("", raw=1, hashes=1)
[8:23 len=16] StringChunk("raw can contain ")
[8:39 len=1] StringChunk("\"")
[8:40 len=6] StringChunk("quotes")
[8:46 len=1] StringChunk("\"")
[8:47 len=1] StringEnd
[8:49 len=5] Newline("\n    ")
[9:5 len=3] KwLet
[9:9 len=5] Ident("trick")
[9:15 len=1] Eq
[9:17 len=4] StringStart("", raw=0, hashes=3)
[9:21 len=2] StringChunk("##")
[9:23 len=1] StringChunk("\"")
[9:24 len=2] StringChunk("##")
[9:26 len=1] StringChunk("\"")
[9:27 len=8] StringChunk(" \n    ;;")
[10:7 len=1] StringEnd
[10:11 len=1] Semicolon
[10:12 len=6] Semicolon
[11:5 len=3] KwLet
[11:9 len=8] Ident("prefixed")
[11:18 len=1] Eq
[11:20 len=3] StringStart("sql", raw=0, hashes=0)
[11:24 len=32] StringChunk("select * from users where id = 1")
[11:56 len=1] StringEnd
[11:57 len=5] Newline("\n    ")
[12:5 len=3] KwLet
[12:9 len=12] Ident("prefixed_raw")
[12:22 len=1] Eq
[12:24 len=4] StringStart("sql", raw=1, hashes=1)
[12:30 len=7] StringChunk("select ")
[12:37 len=1] StringChunk("\"")
[12:38 len=4] StringChunk("name")
[12:42 len=1] StringChunk("\"")
[12:43 len=11] StringChunk(" from users")
[12:54 len=1] StringEnd
[12:56 len=5] Newline("\n    ")
[13:5 len=6] KwReturn
[13:12 len=1] IntLit("0")
[13:13 len=2] RBrace
[14:2 len=1] Newline("\n")
[0:0 len=0] Eof
