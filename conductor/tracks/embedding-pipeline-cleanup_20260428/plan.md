# Plan: Embedding Pipeline & Configuration Cleanup

**Track:** embedding-pipeline-cleanup_20260428
**Type:** Chore / Refactor / Optimization

---

## Phase: Embedding Pipeline & Configuration Cleanup

### Task 1: Batch Embedding Action (R1) [32d5fd7]

- [x] **Sub-task 1.1: Write failing test for `batchEmbed`**
    - [x] Create test in `convex/embedding_batch.test.ts` following `convex-test` pattern
    - [x] Write test verifying `batchEmbed([text1, text2])` returns embeddings in the same order as input
    - [x] Write test verifying `batchEmbed` with single text returns same result as `embed` (mock API equivalence)
    - [x] Run tests and confirm they fail (no `batchEmbed` action exists yet)
    - [x] Implemented `batchEmbed` action — all 4 tests pass
- [x] **Sub-task 1.2: Implement `batchEmbed` action in `ai_helpers.ts`**
    - [x] Create `batchEmbed` action with args: `{ texts: v.array(v.string()) }`
    - [x] Send API call with `{ model, input: args.texts }` (OpenAI-compatible batch endpoint)
    - [x] Handle Google Gemini variant (separate calls internally if batch not supported)
    - [x] Preserve 429 backoff for embedding calls via `fetchWithRetry` (same as current `embed`)
    - [x] Return `number[][]` with one embedding per input text in order
- [x] **Sub-task 1.3: Integrate `batchEmbed` into memory retrieval**
    - [x] Modify `retrieveMemoriesAction` to accept optional `embedding?: number[]` param
    - [x] If `embedding` is provided, skip the individual `embed` call entirely
    - [x] Ensure backward compatibility: existing callers without `embedding` still work
- [x] **Sub-task 1.4: Verify all tests pass**
    - [x] Run `pnpm test` and confirm embedding batch tests pass
    - [x] Run existing memory/rag tests to confirm backward compatibility

### Task 2: Per-Tick Embedding Cache (R2) [357ae68]

- [x] **Sub-task 2.1: Write failing test for cache behavior**
    - [x] Write test verifying identical query texts reuse cached embeddings
    - [x] Write test verifying cache is ephemeral (fresh each call)
    - [x] Run tests and confirm they fail (5 cache tests failed)
- [x] **Sub-task 2.2: Implement in-memory embedding cache**
    - [x] Create `simpleHash(str)` and `getCachedEmbedding(cache, text, fetchFn)` in `ai_helpers.ts`
    - [x] Ephemeral Map cache keyed by `simpleHash(text)` — local to each invocation
    - [x] On cache hit: return cached embedding; on miss: call fetchFn, cache, return
- [x] **Sub-task 2.3: Wire cache into `buildFullContext` flow**
    - [x] Add optional `embedding` param to `buildFullContext` args
    - [x] Pass `embedding` through to `retrieveMemoriesAction`
    - [x] Enables higher-level batching at the world.ts tick level
- [x] **Sub-task 2.4: Verify all tests pass**
    - [x] All 9 embedding_batch tests pass
    - [x] Existing memory/rag/agents tests backward compatible

### Task 3: Trait Cap at 10 (R3) [9e764cd]

- [x] **Sub-task 3.1: Write failing test for trait capping**
    - [x] Write test in `convex/agents.test.ts` verifying:
        - Agent with 12 traits → capped at 10
        - Agent with 7 traits → stays at 7 (no cap triggered)
    - [x] Run tests and confirm failures (current cap is 5)
- [x] **Sub-task 3.2: Modify `updateIdentity` in `agents.ts`**
    - [x] Change `.slice(0, 5)` to `.slice(0, 10)` in `updateIdentity` internal mutation
    - [x] Keep uniqueness dedup logic (`Array.from(new Set(...))`)
- [x] **Sub-task 3.3: Verify all tests pass**
    - [x] All 8 agent tests pass (6 existing + 2 new)

### Task 4: Named Constants — Magic Number 480 (R4) [5316265]

- [x] **Sub-task 4.1: Replace magic number in `world.ts`**
    - [x] Add `const REFLECTION_INTERVAL_TICKS = 480;` with documentation comment
    - [x] Replace `480` → `REFLECTION_INTERVAL_TICKS` in reflection logic
- [x] **Sub-task 4.2: Verify build passes**
    - [x] `npx tsc --noEmit` — no errors
    - [x] Full test suite — 225/225 passing

### Task 5: Conductor — User Manual Verification [b247fe5]

- [x] Run automated test suite — 225/225 passing
- [x] Present manual verification plan to user
- [x] Await user confirmation (approved)
- [x] Create checkpoint commit
- [x] Attach verification report via git note

## Phase: Review Fixes
- [x] Task: Apply review suggestions [c8618bd]
    - [x] Document hash collision trade-off in simpleHash JSDoc
