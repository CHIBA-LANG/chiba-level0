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

typedef struct ChibaFrameDesc {
  int64_t kind;
  const char *name;
  int64_t resume_block;
  int64_t resume_fun;
} ChibaFrameDesc;

typedef struct ChibaFrame ChibaFrame;
typedef struct ChibaPrompt ChibaPrompt;
typedef struct ChibaContinuation ChibaContinuation;

struct ChibaFrame {
  const ChibaFrameDesc *desc;
  int64_t kind;
  int64_t resume_block;
  int64_t resume_fun;
  ChibaValue *slots;
  int64_t slot_count;
  ChibaFrame *parent;
  ChibaPrompt *prompt;
};

struct ChibaPrompt {
  int64_t tag;
  ChibaFrame *frame_boundary;
  ChibaPrompt *parent;
};

struct ChibaContinuation {
  ChibaFrame *frames;
  ChibaPrompt *prompt;
  int64_t frame_count;
  int64_t resume_fun;
  int64_t resume_block;
  int64_t multi_shot;
};

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

static inline const ChibaFrameDesc *
chiba_frame_desc_lookup(const ChibaFrameDesc *descs, int64_t count,
                        int64_t kind) {
  for (int64_t i = 0; i < count; i++) {
    if (descs[i].kind == kind) {
      return &descs[i];
    }
  }
  return NULL;
}

static inline void *chiba_runtime_calloc(size_t count, size_t size,
                                         const char *kind) {
  void *ptr = calloc(count, size);
  if (ptr == NULL) {
    fprintf(stderr, "[chiba-c] out of memory allocating %s\n", kind);
    abort();
  }
  return ptr;
}

static inline ChibaFrame *chiba_frame_new(const ChibaFrameDesc *desc,
                                          int64_t slot_count,
                                          ChibaFrame *parent,
                                          ChibaPrompt *prompt) {
  ChibaFrame *frame =
      (ChibaFrame *)chiba_runtime_calloc(1, sizeof(ChibaFrame), "frame");
  frame->desc = desc;
  frame->kind = desc == NULL ? 0 : desc->kind;
  frame->resume_block = desc == NULL ? 0 : desc->resume_block;
  frame->resume_fun = desc == NULL ? 0 : desc->resume_fun;
  frame->slot_count = slot_count < 0 ? 0 : slot_count;
  frame->parent = parent;
  frame->prompt = prompt;
  if (frame->slot_count > 0) {
    frame->slots = (ChibaValue *)chiba_runtime_calloc(
        (size_t)frame->slot_count, sizeof(ChibaValue), "frame slots");
  }
  return frame;
}

static inline ChibaPrompt *
chiba_prompt_new(int64_t tag, ChibaFrame *frame_boundary, ChibaPrompt *parent) {
  ChibaPrompt *prompt =
      (ChibaPrompt *)chiba_runtime_calloc(1, sizeof(ChibaPrompt), "prompt");
  prompt->tag = tag;
  prompt->frame_boundary = frame_boundary;
  prompt->parent = parent;
  return prompt;
}

static inline ChibaFrame *
chiba_context_push_frame(ChibaContext *ctx, const ChibaFrameDesc *descs,
                         int64_t desc_count, int64_t kind, int64_t slot_count) {
  const ChibaFrameDesc *desc = chiba_frame_desc_lookup(descs, desc_count, kind);
  ChibaFrame *frame =
      chiba_frame_new(desc, slot_count, (ChibaFrame *)ctx->frame_stack,
                      (ChibaPrompt *)ctx->prompt_stack);
  ctx->frame_stack = frame;
  return frame;
}

static inline ChibaPrompt *chiba_context_push_prompt(ChibaContext *ctx,
                                                     int64_t tag) {
  ChibaPrompt *prompt = chiba_prompt_new(tag, (ChibaFrame *)ctx->frame_stack,
                                         (ChibaPrompt *)ctx->prompt_stack);
  ctx->prompt_stack = prompt;
  return prompt;
}

static inline ChibaFrame *chiba_frame_clone_one(const ChibaFrame *src) {
  if (src == NULL) {
    return NULL;
  }
  ChibaFrame *copy =
      chiba_frame_new(src->desc, src->slot_count, NULL, src->prompt);
  copy->kind = src->kind;
  copy->resume_block = src->resume_block;
  copy->resume_fun = src->resume_fun;
  for (int64_t i = 0; i < src->slot_count; i++) {
    copy->slots[i] = src->slots[i];
  }
  return copy;
}

static inline ChibaFrame *chiba_frame_clone_chain(const ChibaFrame *src) {
  if (src == NULL) {
    return NULL;
  }
  ChibaFrame *copy = chiba_frame_clone_one(src);
  copy->parent = chiba_frame_clone_chain(src->parent);
  return copy;
}

static inline ChibaFrame *chiba_frame_clone_until(const ChibaFrame *src,
                                                  const ChibaFrame *boundary) {
  if (src == NULL || src == boundary) {
    return NULL;
  }
  ChibaFrame *copy = chiba_frame_clone_one(src);
  copy->parent = chiba_frame_clone_until(src->parent, boundary);
  return copy;
}

static inline int64_t chiba_frame_chain_count(const ChibaFrame *frame) {
  int64_t count = 0;
  while (frame != NULL) {
    count++;
    frame = frame->parent;
  }
  return count;
}

static inline ChibaContinuation *
chiba_continuation_capture_snapshot(ChibaFrame *frames, ChibaPrompt *prompt) {
  ChibaContinuation *cont = (ChibaContinuation *)chiba_runtime_calloc(
      1, sizeof(ChibaContinuation), "continuation");
  cont->frames = chiba_frame_clone_chain(frames);
  cont->prompt = prompt;
  cont->frame_count = chiba_frame_chain_count(cont->frames);
  cont->resume_fun = 0;
  cont->resume_block = 0;
  cont->multi_shot = 1;
  return cont;
}

static inline ChibaContinuation *
chiba_context_capture_continuation(ChibaContext *ctx, int64_t tag,
                                   int64_t resume_fun, int64_t resume_block) {
  ChibaPrompt *prev = NULL;
  ChibaPrompt *prompt = (ChibaPrompt *)ctx->prompt_stack;
  while (prompt != NULL && prompt->tag != tag) {
    prev = prompt;
    prompt = prompt->parent;
  }
  if (prompt == NULL) {
    fprintf(stderr, "[chiba-c] missing prompt tag=%lld\n", (long long)tag);
    abort();
  }
  if (prev == NULL) {
    ctx->prompt_stack = prompt->parent;
  } else {
    prev->parent = prompt->parent;
  }
  ChibaContinuation *cont = (ChibaContinuation *)chiba_runtime_calloc(
      1, sizeof(ChibaContinuation), "continuation");
  cont->frames = chiba_frame_clone_until((ChibaFrame *)ctx->frame_stack,
                                         prompt->frame_boundary);
  cont->prompt = prompt;
  cont->frame_count = chiba_frame_chain_count(cont->frames);
  cont->resume_fun = resume_fun;
  cont->resume_block = resume_block;
  cont->multi_shot = 1;
  return cont;
}

static inline ChibaFrame *
chiba_continuation_clone_frames(const ChibaContinuation *cont) {
  if (cont == NULL) {
    return NULL;
  }
  return chiba_frame_clone_chain(cont->frames);
}

static inline const ChibaContinuation *
chiba_context_restore_continuation(ChibaContext *ctx,
                                   const ChibaContinuation *cont) {
  if (cont == NULL) {
    fprintf(stderr, "[chiba-c] restore null continuation\n");
    abort();
  }
  ctx->frame_stack = chiba_continuation_clone_frames(cont);
  return cont;
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
  return obj->fields[idx];
}

static inline void chiba_set_field(ChibaValue value, int64_t idx,
                                   ChibaValue field) {
  ChibaTagged *obj = (ChibaTagged *)chiba_value_to_ptr(value);
  if (obj == NULL) {
    (void)chiba_runtime_unimplemented("tagged", "null-object");
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

static inline ChibaValue chiba_heap_store_value(ChibaValue base,
                                                int64_t offset,
                                                ChibaValue value) {
  chiba_heap_store(base, offset, value);
  return 0;
}

static inline ChibaValue chiba_heap_load8(ChibaValue base, int64_t offset) {
  uint8_t *ptr = (uint8_t *)chiba_value_to_ptr(base);
  if (ptr == NULL) {
    return chiba_runtime_unimplemented("heap", "null-load8-base");
  }
  return (ChibaValue)ptr[offset];
}

static inline ChibaValue chiba_heap_store8_value(ChibaValue base,
                                                 int64_t offset,
                                                 ChibaValue value) {
  uint8_t *ptr = (uint8_t *)chiba_value_to_ptr(base);
  if (ptr == NULL) {
    return chiba_runtime_unimplemented("heap", "null-store8-base");
  }
  ptr[offset] = (uint8_t)value;
  return 0;
}

static inline ChibaValue chiba_libc_exit_value(int64_t code) {
  exit((int)code);
  return 0;
}

static inline ChibaValue chiba_libc_wait4_value(
    ChibaValue pid,
    ChibaValue status_ptr,
    ChibaValue options,
    ChibaValue rusage
) {
    return (ChibaValue)wait4(
        (pid_t)pid,
        (int *)(intptr_t)status_ptr,
        (int)options,
        (struct rusage *)(intptr_t)rusage
    );
}

#endif