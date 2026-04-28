# Plan: Unbottleneck the World Tick

## Phase 1: Parallelize Agent Processing

- [ ] Task 1.1: Write failing tests for partial batch failure recovery
    - [ ] Create a Convex integration test setup that simulates the world tick with 10 agents
    - [ ] Write test: inject a forced failure into 1 agent's `processAgent` → verify remaining 9 succeed
    - [ ] Write test: verify failed agent gets 1 retry attempt
    - [ ] RUN tests and confirm they fail (Red phase)

- [ ] Task 1.2: Implement parallel agent execution
    - [ ] Remove `BATCH_DELAY_MS = 1000` constant from world.ts
    - [ ] Remove the `await new Promise(...)` inter-batch delay loop
    - [ ] Replace the batched execution with `Promise.all(agents.map(processAgent))`
    - [ ] RUN tests to confirm they pass (Green phase)

- [ ] Task 1.3: Implement error isolation with retry
    - [ ] Wrap each individual `processAgent` call in a try-catch block (within the Promise.all)
    - [ ] On first failure: log error via `addEvent` to agent's sensory buffer, wait 500ms, retry once
    - [ ] On second failure: log double-failure, skip this agent for the current tick
    - [ ] Ensure failed agent errors do NOT propagate and do NOT block Promise.all
    - [ ] RUN tests and confirm they pass

- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Simplify Chat Retry Logic

- [ ] Task 2.1: Write failing tests for retry simplification
    - [ ] Write unit test: verify chat calls no longer apply 429-specific backoff
    - [ ] Write unit test: verify network error retries (5xx, timeout) still work for chat calls
    - [ ] Write unit test: verify embedding calls still use 429 backoff (unchanged)
    - [ ] RUN tests and confirm they fail (Red phase)

- [ ] Task 2.2: Implement retry simplification in ai_helpers.ts
    - [ ] Update `fetchWithRetry` (or equivalent retry function) to distinguish chat vs embedding calls
    - [ ] Remove 429-specific backoff for chat calls — only retry on 5xx/timeouts
    - [ ] Preserve 429 backoff for embedding calls unchanged
    - [ ] RUN tests and confirm they pass (Green phase)

- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Integration & Verification

- [ ] Task 3.1: Add tick duration monitoring
    - [ ] Add runtime logging to capture tick execution duration
    - [ ] Assert tick duration drops from ~4s to ~2-3s (LLM latency bound) — log-based verification

- [ ] Task 3.2: Run full test suite and coverage
    - [ ] Run `CI=true pnpm test` — all tests pass
    - [ ] Run coverage — verify >80%
    - [ ] Run `npx tsc --noEmit` — no type errors

- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

---

**Track Type:** Refactor / Performance Optimization
**Total Phases:** 3
