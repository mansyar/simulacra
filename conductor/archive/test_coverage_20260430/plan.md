# Implementation Plan: Increase Test Coverage

## Phase 1: Utility Modules

### Task 1.1: Write tests for `src/lib/convex.ts`
- [x] Write failing unit test: Verify `VITE_CONVEX_URL` missing throws error
- [x] Write failing unit test: Verify client creation when URL is set
- [x] Implement to make tests pass
- [x] Verify coverage >80% for `src/lib/convex.ts`
- [x] Commit changes (`test(lib): Add unit tests for convex client initialization`) [e8e5d33]

### Task 1.2: Write tests for `src/lib/server-functions.ts`
- [x] Write failing unit tests: Mock ConvexHttpClient and verify each server function triggers the correct API call
- [x] Implement to make tests pass
- [x] Verify coverage >80% for `src/lib/server-functions.ts`
- [x] Commit changes (`test(lib): Add unit tests for server function wrappers`) [a948b8f]

- [x] Task: Conductor - User Manual Verification 'Phase 1: Utility Modules' (Protocol in workflow.md) [checkpoint: d324fda]

---

## Phase 2: Backend Functions

### Task 2.1: Write unit tests for `convex/functions/ai_helpers.ts` (pure functions)
- [x] Write failing unit test: `simpleHash` produces stable, deterministic output
- [x] Write failing unit test: `simpleHash` handles empty strings and special characters
- [x] Write failing unit test: `getCachedEmbedding` returns cached value on repeated call
- [x] Write failing unit test: `getCachedEmbedding` fetches and caches new embeddings
- [x] Write failing unit test: `fetchWithRetry` succeeds on first attempt (existing in retry_simplification.test.ts)
- [x] Write failing unit test: `fetchWithRetry` retries on network errors (existing in retry_simplification.test.ts)
- [x] Write failing unit test: `fetchWithRetry` respects maxRetries (existing in retry_simplification.test.ts)
- [x] Write failing unit test: `fetchWithRetry` handles 429 with skip429Backoff flag (existing in retry_simplification.test.ts)
- [x] Implement to make tests pass
- [x] Verify coverage for pure functions
- [x] Commit changes (`test(convex): Add unit tests for ai_helpers pure functions`) [0afc54d]

### Task 2.2: Write integration tests for `convex/functions/ai_helpers.ts` (Convex actions)
- [x] Write failing integration test: `chat` action returns mock content when no API key (existing in ai_coverage.test.ts)
- [x] Write failing integration test: `embed` action returns random embedding when no API key
- [x] Write failing integration test: `batchEmbed` action returns empty array for empty input
- [x] Write failing integration test: `batchEmbed` returns fallback embeddings when no API key
- [x] Write failing integration test: `listModels` returns error when no API key
- [x] Implement to make tests pass
- [x] Verify coverage >80% for `convex/functions/ai_helpers.ts`
- [x] Commit changes (`test(convex): Add integration tests for ai_helpers actions`) [abae2ee]

- [x] Task: Conductor - User Manual Verification 'Phase 2: Backend Functions' (Protocol in workflow.md) [checkpoint: 732cca4]



