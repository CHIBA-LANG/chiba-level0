.intel_syntax noprefix

#define SYS_write   1
#define SYS_mmap    9
#define SYS_munmap  11
#define SYS_exit    60

#define PROT_READ       1
#define PROT_WRITE      2
#define PROT_RW         3
#define MAP_PRIVATE     0x02
#define MAP_ANONYMOUS   0x20
#define MAP_PRIV_ANON   0x22

#define CTX_HEAP_BASE     0
#define CTX_HEAP_PTR      8
#define CTX_HEAP_LIMIT   16
#define CTX_CUR_FRAG     24
#define CTX_CUR_FRAME    32
#define CTX_RET0         40
#define CTX_RET1         48
#define CTX_PROMPT_TOP   56
#define CTX_FOREIGN      64
#define CTX_SIZE         88

#define FRAG_PREV         0
#define FRAG_BASE         8
#define FRAG_TOP         16
#define FRAG_LIMIT       24
#define FRAG_HEADER_SIZE 32

#define HEAP_SIZE         (1024 * 1024 * 1024)
#define FRAG_BODY_SIZE    (64 * 1024 * 1024)
#define FRAG_TOTAL_SIZE   (FRAG_BODY_SIZE + FRAG_HEADER_SIZE)

#define STDOUT 1

    .text
    .align 16
itoa_i64:
    lea rdi, [rsp + 23]
    mov byte ptr [rdi], 10
    dec rdi
    xor r8d, r8d
    test rax, rax
    jns .Litoa_positive
    neg rax
    mov r8d, 1
.Litoa_positive:
    mov rcx, 10
.Litoa_loop:
    xor edx, edx
    div rcx
    add dl, '0'
    mov [rdi], dl
    dec rdi
    test rax, rax
    jnz .Litoa_loop

    test r8d, r8d
    jz .Litoa_done
    mov byte ptr [rdi], '-'
    dec rdi
.Litoa_done:
    inc rdi
    lea rdx, [rsp + 24]
    sub rdx, rdi
    mov rsi, rdi
    ret

    .globl chiba_grow_fragment
    .type chiba_grow_fragment, @function
    .align 16
chiba_grow_fragment:
    mov rax, [r15 + CTX_CUR_FRAG]
    mov [rax + FRAG_TOP], r14

    xor edi, edi
    mov esi, FRAG_TOTAL_SIZE
    mov edx, PROT_RW
    mov r10d, MAP_PRIV_ANON
    mov r8, -1
    xor r9d, r9d
    mov eax, SYS_mmap
    syscall
    test rax, rax
    js .Lfail_exit

    mov rcx, [r15 + CTX_CUR_FRAG]
    mov [rax + FRAG_PREV], rcx
    lea rdx, [rax + FRAG_HEADER_SIZE]
    mov [rax + FRAG_BASE], rdx
    mov [rax + FRAG_TOP], rdx
    lea rcx, [rax + FRAG_TOTAL_SIZE]
    mov [rax + FRAG_LIMIT], rcx
    mov [r15 + CTX_CUR_FRAG], rax
    mov r14, rdx
    ret

    .globl chiba_rewind_fragment
    .type chiba_rewind_fragment, @function
    .align 16
chiba_rewind_fragment:
.Lrewind_frag_loop:
    mov rax, [r15 + CTX_CUR_FRAG]
    cmp r14, [rax + FRAG_BASE]
    jb .Lrewind_frag_prev
    cmp r14, [rax + FRAG_LIMIT]
    jbe .Lrewind_frag_found
.Lrewind_frag_prev:
    mov rcx, [rax + FRAG_PREV]
    test rcx, rcx
    jz .Lfail_exit
    mov [r15 + CTX_CUR_FRAG], rcx
    jmp .Lrewind_frag_loop
.Lrewind_frag_found:
    mov [rax + FRAG_TOP], r14
    ret

    .globl chiba_grow_heap
    .type chiba_grow_heap, @function
    .align 16
chiba_grow_heap:
    xor edi, edi
    mov esi, HEAP_SIZE
    mov edx, PROT_RW
    mov r10d, MAP_PRIV_ANON
    mov r8, -1
    xor r9d, r9d
    mov eax, SYS_mmap
    syscall
    test rax, rax
    js .Lfail_exit
    mov [r15 + CTX_HEAP_PTR], rax
    lea rcx, [rax + HEAP_SIZE]
    mov [r15 + CTX_HEAP_LIMIT], rcx
    ret

    .globl _start
    .type _start, @function
    .align 16
_start:
    mov rax, [rsp]
    mov [rip + chiba_argc], rax
    lea rax, [rsp + 8]
    mov [rip + chiba_argv], rax

    xor edi, edi
    mov esi, HEAP_SIZE
    mov edx, PROT_RW
    mov r10d, MAP_PRIV_ANON
    mov r8, -1
    xor r9d, r9d
    mov eax, SYS_mmap
    syscall
    test rax, rax
    js .Lfail_exit
    mov r12, rax

    xor edi, edi
    mov esi, FRAG_TOTAL_SIZE
    mov edx, PROT_RW
    mov r10d, MAP_PRIV_ANON
    mov r8, -1
    xor r9d, r9d
    mov eax, SYS_mmap
    syscall
    test rax, rax
    js .Lfail_exit
    mov r13, rax

    mov qword ptr [r13 + FRAG_PREV], 0
    lea rcx, [r13 + FRAG_HEADER_SIZE]
    mov [r13 + FRAG_BASE], rcx
    mov [r13 + FRAG_TOP], rcx
    lea rdx, [r13 + FRAG_TOTAL_SIZE]
    mov [r13 + FRAG_LIMIT], rdx

    sub rsp, CTX_SIZE
    mov rdi, rsp
    xor eax, eax
    mov ecx, CTX_SIZE
.Lzero_ctx:
    mov byte ptr [rdi], al
    inc rdi
    dec ecx
    jnz .Lzero_ctx

    mov [rsp + CTX_HEAP_BASE], r12
    mov [rsp + CTX_HEAP_PTR], r12
    lea rax, [r12 + HEAP_SIZE]
    mov [rsp + CTX_HEAP_LIMIT], rax
    mov [rsp + CTX_CUR_FRAG], r13

    mov rdi, rsp
    call chiba_entry
    mov rbx, rax

    sub rsp, 24
    mov rax, rbx
    call itoa_i64
    mov edi, STDOUT
    mov eax, SYS_write
    syscall
    add rsp, 24

    mov rdi, r12
    mov esi, HEAP_SIZE
    mov eax, SYS_munmap
    syscall

    mov rdi, r13
    mov esi, FRAG_TOTAL_SIZE
    mov eax, SYS_munmap
    syscall

    xor edi, edi
    mov eax, SYS_exit
    syscall

.Lfail_exit:
    mov edi, 1
    mov eax, SYS_exit
    syscall

    .bss
    .align 8
    .globl chiba_argc
chiba_argc:
    .quad 0

    .globl chiba_argv
chiba_argv:
    .quad 0


