# Implementation Plan: Increase Test Coverage

## Phase 1: Utility Modules

### Task 1.1: Write tests for `src/lib/convex.ts`
- [ ] Write failing unit test: Verify `VITE_CONVEX_URL` missing throws error
- [ ] Write failing unit test: Verify client creation when URL is set
- [ ] Implement to make tests pass
- [ ] Verify coverage >80% for `src/lib/convex.ts`
- [ ] Commit changes (`test(lib): Add unit tests for convex client initialization`)

### Task 1.2: Write tests for `src/lib/server-functions.ts`
- [ ] Write failing unit tests: Mock ConvexHttpClient and verify each server function triggers the correct API call
- [ ] Implement to make tests pass
- [ ] Verify coverage >80% for `src/lib/server-functions.ts`
- [ ] Commit changes (`test(lib): Add unit tests for server function wrappers`)

- [ ] Task: Conductor - User Manual Verification 'Phase 1: Utility Modules' (Protocol in workflow.md)

---

## Phase 2: Backend Functions

### Task 2.1: Write unit tests for `convex/functions/ai_helpers.ts` (pure functions)
- [ ] Write failing unit test: `simpleHash` produces stable, deterministic output
- [ ] Write failing unit test: `simpleHash` handles empty strings and special characters
- [ ] Write failing unit test: `getCachedEmbedding` returns cached value on repeated call
- [ ] Write failing unit test: `getCachedEmbedding` fetches and caches new embeddings
- [ ] Write failing unit test: `fetchWithRetry` succeeds on first attempt
- [ ] Write failing unit test: `fetchWithRetry` retries on network errors
- [ ] Write failing unit test: `fetchWithRetry` respects maxRetries
- [ ] Write failing unit test: `fetchWithRetry` handles 429 with skip429Backoff flag
- [ ] Implement to make tests pass
- [ ] Verify coverage for pure functions
- [ ] Commit changes (`test(convex): Add unit tests for ai_helpers pure functions`)

### Task 2.2: Write integration tests for `convex/functions/ai_helpers.ts` (Convex actions)
- [ ] Write failing integration test: `chat` action returns mock content when no API key
- [ ] Write failing integration test: `embed` action returns random embedding when no API key
- [ ] Write failing integration test: `batchEmbed` action returns empty array for empty input
- [ ] Write failing integration test: `batchEmbed` returns fallback embeddings when no API key
- [ ] Write failing integration test: `listModels` returns error when no API key
- [ ] Implement to make tests pass
- [ ] Verify coverage >80% for `convex/functions/ai_helpers.ts`
- [ ] Commit changes (`test(convex): Add integration tests for ai_helpers actions`)

- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend Functions' (Protocol in workflow.md)

---

## Phase 3: Coverage Configuration Fix [DONE]

### Task 3.1: Update `vitest.config.ts` coverage exclusions
- [x] Remove `src/lib/**`, `src/routes/**`, `src/components/**` from coverage exclude list
- [x] Keep legitimate exclusions (node_modules, config files, generated files, test files)
- [x] Commit changes (`chore(config): Fix vitest coverage exclusions for frontend code`)

### Task 3.2: Verify coverage thresholds are enforceable
- [x] Run `pnpm test:coverage` and verify the report measures frontend code
- [x] Confirm 80% lines / 80% functions / 70% branches / 80% statements thresholds
- [x] Verify all existing tests still pass
- [x] Commit changes (`chore(config): Verify coverage thresholds with updated exclusions`)

- [x] Task: Conductor - User Manual Verification 'Phase 3: Coverage Configuration Fix' (Protocol in workflow.md)
