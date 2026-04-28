# Plan: Embedding Pipeline & Configuration Cleanup

**Track:** embedding-pipeline-cleanup_20260428
**Type:** Chore / Refactor / Optimization

---

## Phase: Embedding Pipeline & Configuration Cleanup

### Task 1: Batch Embedding Action (R1)

- [ ] **Sub-task 1.1: Write failing test for `batchEmbed`**
    - [ ] Create test in `convex/embedding_batch.test.ts` following `convex-test` pattern
    - [ ] Write test verifying `batchEmbed([text1, text2])` returns embeddings in the same order as input
    - [ ] Write test verifying `batchEmbed` with single text returns same result as `embed` (mock API equivalence)
    - [ ] Run tests and confirm they fail (no `batchEmbed` action exists yet)
- [ ] **Sub-task 1.2: Implement `batchEmbed` action in `ai_helpers.ts`**
    - [ ] Create `batchEmbed` action with args: `{ texts: v.array(v.string()) }`
    - [ ] Send API call with `{ model, input: args.texts }` (OpenAI-compatible batch endpoint)
    - [ ] Handle Google Gemini variant (separate calls internally if batch not supported)
    - [ ] Preserve 429 backoff for embedding calls (same as current `embed`)
    - [ ] Return `number[][]` with one embedding per input text in order
- [ ] **Sub-task 1.3: Integrate `batchEmbed` into memory retrieval**
    - [ ] Modify `retrieveMemoriesAction` to accept optional `embedding?: number[]` param
    - [ ] If `embedding` is provided, skip the individual `embed` call entirely
    - [ ] Ensure backward compatibility: existing callers without `embedding` still work
- [ ] **Sub-task 1.4: Verify all tests pass**
    - [ ] Run `pnpm test` and confirm embedding batch tests pass
    - [ ] Run existing memory/rag tests to confirm backward compatibility

### Task 2: Per-Tick Embedding Cache (R2)

- [ ] **Sub-task 2.1: Write failing test for cache behavior**
    - [ ] Write test verifying identical query texts reuse cached embeddings
    - [ ] Write test verifying cache is ephemeral (fresh each call)
    - [ ] Run tests and confirm they fail
- [ ] **Sub-task 2.2: Implement in-memory embedding cache**
    - [ ] Create `getOrCreateEmbedding` helper in `ai_helpers.ts` (or `memory.ts`):
        - `Map<string, number[]>` keyed by `simpleHash(text)`
        - On cache hit: return cached embedding
        - On cache miss: call `batchEmbed`, cache result, return
    - [ ] Ensure the cache is local to each action invocation (not global/leaky)
- [ ] **Sub-task 2.3: Wire cache into `buildFullContext` flow**
    - [ ] In `buildFullContext` (ai.ts), collect all unique memory queries across agents
    - [ ] Call `batchEmbed` once with deduplicated texts via the cache helper
    - [ ] Pass individual cached embeddings to each `retrieveMemoriesAction` call
    - [ ] This reduces N API calls to 1 per tick
- [ ] **Sub-task 2.4: Verify all tests pass**
    - [ ] Run full test suite

### Task 3: Trait Cap at 10 (R3)

- [ ] **Sub-task 3.1: Write failing test for trait capping**
    - [ ] Write test in `convex/agents.test.ts` verifying:
        - Agent with 10 traits, adding 1 more → oldest dropped, length stays 10
        - Agent with 5 traits, adding 2 → length becomes 7 (no cap triggered)
    - [ ] Run tests and confirm failures (current cap is 5, not 10, and behavior may differ)
- [ ] **Sub-task 3.2: Modify `updateIdentity` in `agents.ts`**
    - [ ] Change `.slice(0, 5)` to `.slice(0, 10)` in `updateIdentity` internal mutation
    - [ ] Keep uniqueness dedup logic (`Array.from(new Set(...))`)
- [ ] **Sub-task 3.3: Verify all tests pass**
    - [ ] Run `pnpm test` and confirm trait cap tests pass

### Task 4: Named Constants — Magic Number 480 (R4)

- [ ] **Sub-task 4.1: Replace magic number in `world.ts`**
    - [ ] Add at top of file (or near reflection logic):
      `const REFLECTION_INTERVAL_TICKS = 480;  // 480 ticks ≈ 10 simulated days (48 ticks/day, ~30 min per tick)`
    - [ ] Replace line 247: `if (currentTicks - lastReflected > (480 + jitter))` →
      `if (currentTicks - lastReflected > (REFLECTION_INTERVAL_TICKS + jitter))`
- [ ] **Sub-task 4.2: Verify build passes**
    - [ ] Run `npx tsc --noEmit` to confirm no type errors

### Task 5: Conductor — User Manual Verification 'Embedding Pipeline & Configuration Cleanup' (Protocol in workflow.md)

- [ ] Run automated test suite
- [ ] Present manual verification plan to user
- [ ] Await user confirmation
- [ ] Create checkpoint commit
- [ ] Attach verification report via git note
