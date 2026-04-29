#ifndef CHIBA_RUNTIME_H
#define CHIBA_RUNTIME_H

#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef int64_t ChibaValue;
typedef ChibaValue (*ChibaFunPtr)(ChibaValue *args, int64_t argc);

typedef enum ChibaStepKind {
  CHIBA_STEP_RETURN = 0,
  CHIBA_STEP_CALL = 1,
  CHIBA_STEP_TAILCALL = 2,
  CHIBA_STEP_RESTORE = 3,
  CHIBA_STEP_HALT = 4
} ChibaStepKind;

typedef struct ChibaStep {
  ChibaStepKind kind;
  ChibaValue value;
  ChibaValue fun;
  ChibaValue *args;
  int64_t argc;
  int64_t ret_count;
} ChibaStep;

typedef struct ChibaContext {
  ChibaValue ret0;
  ChibaValue ret1;
  ChibaValue ret[8];
  int64_t ret_count;
  ChibaValue current_fun;
  ChibaValue *args;
  int64_t argc;
  void *frame_stack;
  void *prompt_stack;
  void *user_data;
} ChibaContext;

typedef struct ChibaTagged {
  int64_t tag;
  int64_t len;
  ChibaValue fields[];
} ChibaTagged;

typedef struct ChibaAsmContext {
  ChibaValue reserved0;
  ChibaValue heap_ptr;
  ChibaValue heap_limit;
} ChibaAsmContext;

static ChibaAsmContext chiba_asm_context = {0, 0, 0};

static inline ChibaValue chiba_ptr_to_value(const void *ptr) {
  return (ChibaValue)(intptr_t)ptr;
}

static inline void *chiba_value_to_ptr(ChibaValue value) {
  return (void *)(intptr_t)value;
}

static inline ChibaFunPtr chiba_value_to_fun(ChibaValue value) {
  return (ChibaFunPtr)(intptr_t)value;
}

static inline ChibaValue chiba_fun_to_value(ChibaFunPtr fun) {
  return (ChibaValue)(intptr_t)fun;
}

static inline ChibaValue chiba_align8(int64_t size) {
  int64_t non_negative = size < 0 ? 0 : size;
  return (non_negative + 7) & ~((int64_t)7);
}

static inline ChibaStep chiba_step_return(ChibaValue value) {
  ChibaStep step = {CHIBA_STEP_RETURN, value, 0, NULL, 0, 1};
  return step;
}

static inline ChibaStep chiba_step_call(ChibaValue fun, ChibaValue *args,
                                        int64_t argc) {
  ChibaStep step = {CHIBA_STEP_CALL, 0, fun, args, argc, 0};
  return step;
}

static inline ChibaStep chiba_step_tailcall(ChibaValue fun, ChibaValue *args,
                                            int64_t argc) {
  ChibaStep step = {CHIBA_STEP_TAILCALL, 0, fun, args, argc, 0};
  return step;
}

static inline ChibaStep chiba_step_restore(ChibaValue value) {
  ChibaStep step = {CHIBA_STEP_RESTORE, value, 0, NULL, 0, 1};
  return step;
}

static inline ChibaStep chiba_step_halt(ChibaValue value) {
  ChibaStep step = {CHIBA_STEP_HALT, value, 0, NULL, 0, 1};
  return step;
}

static inline ChibaValue chiba_runtime_asm_context_value(void) {
  return chiba_ptr_to_value(&chiba_asm_context);
}

__attribute__((used, noinline)) static void chiba_grow_heap(void) {
  size_t chunk_size = 64u * 1024u * 1024u;
  void *chunk = calloc(1, chunk_size);
  if (chunk == NULL) {
    fprintf(stderr, "[chiba-c] out of memory growing asm heap\n");
    abort();
  }
  chiba_asm_context.heap_ptr = chiba_ptr_to_value(chunk);
  chiba_asm_context.heap_limit = chiba_ptr_to_value((char *)chunk + chunk_size);
}

static inline ChibaValue chiba_runtime_unimplemented(const char *kind,
                                                     const char *name) {
  fprintf(stderr, "[chiba-c] unsupported %s: %s\n", kind, name);
  abort();
}

static inline ChibaValue chiba_runtime_bounds(const char *kind, int64_t idx,
                                              int64_t len) {
  fprintf(stderr, "[chiba-c] %s bounds error idx=%lld len=%lld\n", kind,
          (long long)idx, (long long)len);
  abort();
}

static inline ChibaTagged *chiba_make_tagged(int64_t tag, int64_t len) {
  size_t n = len < 0 ? 0 : (size_t)len;
  ChibaTagged *obj =
      (ChibaTagged *)calloc(1, sizeof(ChibaTagged) + n * sizeof(ChibaValue));
  if (obj == NULL) {
    fprintf(stderr, "[chiba-c] out of memory allocating tagged object\n");
    abort();
  }
  obj->tag = tag;
  obj->len = len;
  return obj;
}

static inline ChibaValue chiba_tag_of(ChibaValue value) {
  ChibaTagged *obj = (ChibaTagged *)chiba_value_to_ptr(value);
  if (obj == NULL) {
    return 0;
  }
  return obj->tag;
}

static inline ChibaValue chiba_get_field(ChibaValue value, int64_t idx) {
  ChibaTagged *obj = (ChibaTagged *)chiba_value_to_ptr(value);
  if (obj == NULL) {
    return chiba_runtime_unimplemented("tagged", "null-object");
  }
  if (idx < 0 || idx >= obj->len) {
    return chiba_runtime_bounds("field", idx, obj->len);
  }
  return obj->fields[idx];
}

static inline void chiba_set_field(ChibaValue value, int64_t idx,
                                   ChibaValue field) {
  ChibaTagged *obj = (ChibaTagged *)chiba_value_to_ptr(value);
  if (obj == NULL) {
    (void)chiba_runtime_unimplemented("tagged", "null-object");
    return;
  }
  if (idx < 0 || idx >= obj->len) {
    (void)chiba_runtime_bounds("field", idx, obj->len);
    return;
  }
  obj->fields[idx] = field;
}

static inline ChibaValue chiba_bump_alloc(int64_t size) {
  size_t aligned = (size_t)chiba_align8(size);
  void *ptr = calloc(1, aligned == 0 ? 1 : aligned);
  if (ptr == NULL) {
    fprintf(stderr, "[chiba-c] out of memory allocating heap bytes\n");
    abort();
  }
  return chiba_ptr_to_value(ptr);
}

static inline ChibaValue chiba_heap_load(ChibaValue base, int64_t offset) {
  ChibaValue *ptr = (ChibaValue *)chiba_value_to_ptr(base);
  if (ptr == NULL) {
    return chiba_runtime_unimplemented("heap", "null-load-base");
  }
  return ptr[offset];
}

static inline void chiba_heap_store(ChibaValue base, int64_t offset,
                                    ChibaValue value) {
  ChibaValue *ptr = (ChibaValue *)chiba_value_to_ptr(base);
  if (ptr == NULL) {
    (void)chiba_runtime_unimplemented("heap", "null-store-base");
    return;
  }
  ptr[offset] = value;
}

#endif