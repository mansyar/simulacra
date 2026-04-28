# Track: Embedding Pipeline & Configuration Cleanup

**Phase 8 — Track C** | **Type:** Chore / Refactor / Optimization

## Overview

Four accumulating issues around the embedding layer and configuration hygiene in the world tick:

1. **Separate embedding API calls per agent** — Each agent's `retrieveMemoriesAction` makes an individual embedding API call, meaning 10 calls/tick at 180s = ~3.3 RPM. At 50 agents / 60s this approaches the 100 RPM limit.
2. **Uncached embedding results** — Embedding results for similar query texts are recomputed every tick.
3. **Unbounded `coreTraits`** — The `coreTraits` array in `updateIdentity` grows without limit (append-only).
4. **Magic number `480`** — The reflection interval is hardcoded as `480` ticks with no documentation or named constant.

## Requirements

### R1: Batch Embedding Calls

- Create a `batchEmbed` action in `convex/functions/ai.ts` (or `ai_helpers.ts`) that sends multiple texts in a single API call via `input: [text1, text2, ...]`.
- This replaces N individual embedding calls with 1 call per tick.
- The batched endpoint must return embeddings in the same order as the input texts.

### R2: Per-Tick Embedding Cache

- Implement an in-memory `Map<string, number[]>` cache within the tick context, keyed by a hash of the input text content.
- When multiple agents query with identical or overlapping context texts, the cached embedding is reused.
- The cache is ephemeral — garbage-collected after each tick completes.

### R3: Trait Cap

- In `updateIdentity()` (in `convex/functions/agents.ts` or wherever defined), cap `coreTraits` at **10 items**.
- When a new trait would push the count beyond 10, silently drop the oldest entry.
- No archival — dropped traits are simply discarded.

### R4: Named Constants

- Replace the magic number `480` in `convex/functions/world.ts` with a named constant:
  ```ts
  const REFLECTION_INTERVAL_TICKS = 480;  // 480 ticks ≈ 10 simulated days (48 ticks/day, ~30 min per tick)
  ```
- Strict scope: only the `480` magic number. Do not extract other magic thresholds.

### Tests

- **T1:** Write a test verifying `batchEmbed` returns identical results to individual embedding calls (single vs batched equivalence).
- **T2:** Write a test verifying trait capping behavior (adding traits beyond 10 drops oldest).

## Out of Scope

- Config table extraction of named constants (deferred to Phase 9 Track C)
- Embedding cache persistence across ticks
- Archived/deprecated trait storage
- Other magic number extractions beyond `480`

## Acceptance Criteria

- [ ] Embedding calls reduced from N/tick to 1/tick (batched)
- [ ] Agents with overlapping context texts share cached embeddings
- [ ] `coreTraits` never exceeds 10 entries
- [ ] All magic thresholds `480` replaced with `REFLECTION_INTERVAL_TICKS` and documented
- [ ] Batch embedding equivalence test passes
- [ ] Trait capping behavior test passes
