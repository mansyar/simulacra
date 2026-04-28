# Implementation Plan: Sensory Buffer in LLM Context

## Phase 1: Implement Sensory Event Retrieval in `buildFullContext()`

- [ ] Task: Write failing test for sensory events in `buildFullContext()` context
    - [ ] Create test file `convex/sensory_context.test.ts` following existing patterns (`convexTest` with schema + modules)
    - [ ] Test: Insert an agent with 3 events, call `buildFullContext`, verify returned string contains the `"## Recent Events"` header and all 3 event descriptions
    - [ ] Test: Insert an agent with no events, call `buildFullContext`, verify returned string contains `"(No recent events)"` fallback
    - [ ] Test: Verify events are formatted as `"- [X min ago] <type>: <description>"` in oldest-first order
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Implement sensory event retrieval in `buildFullContext()`
    - [ ] In `convex/functions/ai.ts`, modify `buildFullContext` action to call `getEvents` query for the agent
    - [ ] Compute relative timestamps (`X min ago`) from `_creationTime` vs `Date.now()`
    - [ ] Format events as `"- [X min ago] <type>: <description>"` sorted oldest-first
    - [ ] Prepend the `"## Recent Events"` section at the top of the full context string (before relationships and memories)
    - [ ] Handle empty events case: emit `"## Recent Events\n(No recent events)"`
    - [ ] Run tests and confirm they pass (Green phase)
- [ ] Task: Verify coverage and code quality
    - [ ] Run `pnpm test:coverage` to verify >80% coverage target
    - [ ] Run `npx tsc --noEmit` for type checking
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)
