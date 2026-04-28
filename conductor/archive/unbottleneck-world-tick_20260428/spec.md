# Spec: Unbottleneck the World Tick

## Overview

The world tick (`convex/functions/world.ts`) currently processes agents in batches of 3 with 1-second delays (`BATCH_SIZE = 3`, `BATCH_DELAY_MS = 1000`). This was originally designed to avoid chat API rate limits, but the chat model has **no concurrency limit**. The 1s delay is pure waste, and a single agent failure cascades and blocks the entire batch.

This track refactors the tick to be fully parallel, removes artificial delays, adds error isolation with retry logic, and simplifies the retry/backoff system.

## Scope

This track covers only the world tick orchestration and retry logic. It does not modify:
- LLM prompt content or decision logic
- Embedding pipeline (separate Track C in Phase 8)
- Spatial queries (separate Track B in Phase 8)
- Any frontend code

## Functional Requirements

### F1. Parallelize All Agents
- Replace 3-at-a-time batched execution with full parallel execution via `Promise.all(agents.map(...))`
- All agents fire their LLM calls simultaneously
- No concurrency limiter — the chat API has no rate limits

### F2. Remove Inter-Batch Delay
- Delete `BATCH_DELAY_MS = 1000` constant
- Remove the `await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))` between batches
- The `BATCH_SIZE` constant can remain (for potential future use) or be cleaned up

### F3. Error Isolation with Retry
- Wrap each individual `processAgent` call in a try-catch block
- On failure: log the error via `addEvent` to the failed agent's sensory buffer, wait 500ms, retry once
- On second failure: log the double-failure, skip the agent for this tick
- A single agent failure must NOT block or delay other agents

### F4. Simplify Chat Retry Logic
- In `convex/functions/ai_helpers.ts`, update `fetchWithRetry` (or the equivalent retry function)
- Remove 429-specific backoff for **chat** calls (the chat model has no rate limits)
- Keep retries only for transient network errors (5xx, timeouts)
- **Embedding calls** retain their 429 backoff (separate rate limit concerns)

### F5. Tick Duration Verification
- After refactoring, tick time should drop from ~4s to ~2-3s (LLM latency bound)
- Include a mechanism to verify this (runtime logging or test assertion)

## Acceptance Criteria

- [ ] All 10 agents fire LLM calls in parallel — tick duration drops to ~2-3s
- [ ] No 1-second inter-batch delay exists in the tick loop
- [ ] A single agent failure (simulated) does NOT block other agents — the remaining 9 complete successfully
- [ ] Failed agents get 1 retry attempt after 500ms delay
- [ ] Chat calls no longer use 429-specific backoff; only network errors (5xx, timeouts) trigger retries
- [ ] Embedding calls still use 429 backoff (untouched by this track)
- [ ] Convex integration test: 9 of 10 agents succeed when 1 is forced to fail

## Out of Scope

- Batching embedding calls (Phase 8 Track C)
- Spatial query optimization (Phase 8 Track B)
- Configuration constants cleanup (Phase 8 Track C)
- Any frontend or UI changes

## Type

Refactor / Performance Optimization
