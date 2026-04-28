# Implementation Plan: Sensory Buffer in LLM Context

## Phase 1: Implement Sensory Event Retrieval in `buildFullContext()` [checkpoint: 750f7ae]

- [x] Task: Write failing test for sensory events in `buildFullContext()` context [7d0f8d1]
    - [x] Create test file `convex/sensory_context.test.ts` following existing patterns (`convexTest` with schema + modules)
    - [x] Test: Insert an agent with 3 events, call `buildFullContext`, verify returned string contains the `"## Recent Events"` header and all 3 event descriptions
    - [x] Test: Insert an agent with no events, call `buildFullContext`, verify returned string contains `"(No recent events)"` fallback
    - [x] Test: Verify events are formatted as `"- [X min ago] <type>: <description>"` in oldest-first order
    - [x] Run tests and confirm they fail (Red phase)
- [x] Task: Implement sensory event retrieval in `buildFullContext()` [7d0f8d1]
    - [x] In `convex/functions/ai.ts`, modify `buildFullContext` action to call `getEvents` query for the agent
    - [x] Compute relative timestamps (`X min ago`) from `_creationTime` vs `Date.now()`
    - [x] Format events as `"- [X min ago] <type>: <description>"` sorted oldest-first
    - [x] Prepend the `"## Recent Events"` section at the top of the full context string (before relationships and memories)
    - [x] Handle empty events case: emit `"## Recent Events\n(No recent events)"`
    - [x] Run tests and confirm they pass (Green phase)
- [x] Task: Verify coverage and code quality [750f7ae]
    - [x] Run `pnpm test:coverage` to verify >80% coverage target
    - [x] Run `npx tsc --noEmit` for type checking
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md) [750f7ae]
