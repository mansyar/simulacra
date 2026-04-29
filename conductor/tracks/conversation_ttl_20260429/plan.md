# Plan: Conversation TTL & Cleanup

## Phase 1: Schema, Config, and Cleanup Infrastructure

### Task 1.1: Add `conversationMaxTtlMs` to config table schema
- [ ] Add `conversationMaxTtlMs` field to the config table definition in `convex/schema.ts`
    - [ ] Type: `v.optional(v.float64())` with a comment `// ms; default 1800000 (30 min)`
- [ ] Update seed config in `convex/functions/seed.ts` to include `conversationMaxTtlMs: 1800000`
- [ ] Add migration logic for existing config rows (check if field is undefined, patch with default)

### Task 1.2: Write failing test for config TTL value
- [ ] Create test file `convex/conversation_ttl.test.ts`
- [ ] Write test: `config table contains conversationMaxTtlMs after seeding`
- [ ] Write test: `conversationMaxTtlMs defaults to 1800000 when not set`
- [ ] Run tests and confirm they fail as expected (Red Phase)

### Task 1.3: Implement cleanStaleConversations function
- [ ] Create `cleanStaleConversations` internal function in `convex/functions/world.ts`
    - [ ] Input: agents array, config object (conversationMaxTtlMs), current timestamp
    - [ ] Filter: agents with `conversationState` where `Date.now() - conversationState.startedAt > conversationMaxTtlMs`
    - [ ] For each stale conversation: call `clearConversationState` for both agents and log via `addEvent`
    - [ ] Return count of conversations cleaned
- [ ] Integrate `cleanStaleConversations` into `tick()` action:
    - [ ] Call it after fetching state/config, BEFORE processing agents (between line ~380 and ~384)
    - [ ] Use `config?.conversationMaxTtlMs ?? parseInt(process.env.CONVERSATION_MAX_TTL_MS ?? "1800000")` for the TTL value

### Task 1.4: Phase Completion Verification and Checkpointing Protocol (Protocol in workflow.md)
- [ ] Run tests to confirm Phase 1 tasks pass
- [ ] Verify cleanup routine correctly identifies stale conversations
- [ ] Commit Phase 1 changes

## Phase 2: Event Logging for Cleanup

### Task 2.1: Write failing test for cleanup event logging
- [ ] Add test to `convex/conversation_ttl.test.ts`
    - [ ] Test: `cleanup event logged for both agents when conversation is stale`
    - [ ] Test: `cleanup event description mentions partner name and stale duration`
- [ ] Run tests and confirm they fail (Red Phase)

### Task 2.2: Implement cleanup event logging
- [ ] In `cleanStaleConversations`, after determining a conversation is stale:
    - [ ] For the current agent: call `ctx.runMutation(api.functions.memory.addEvent, { ... })` with type `"interaction"` and description: `"Conversation with {partnerName} ended (stale after {duration} min)."`
    - [ ] For the partner agent: same event, with the current agent's name as the partner
    - [ ] Use `resetConversationEnd` mutation to clear state for both agents
- [ ] Run tests and confirm all pass (Green Phase)

### Task 2.3: Phase Completion Verification and Checkpointing Protocol (Protocol in workflow.md)
- [ ] Run full test suite to ensure no regressions
- [ ] Commit Phase 2 changes

## Phase 3: Edge Cases & Final Verification

### Task 3.1: Write failing test for edge cases
- [ ] Add tests to `convex/conversation_ttl.test.ts`:
    - [ ] Test: `active conversation (recent startedAt) is NOT cleaned up`
    - [ ] Test: `agent without conversationState is not affected`
    - [ ] Test: `cleanup handles stale partner who was already cleaned up (idempotent)`
    - [ ] Test: `env var CONVERSATION_MAX_TTL_MS overrides default`
- [ ] Run tests and confirm they fail (Red Phase)

### Task 3.2: Implement edge case handling
- [ ] Verify `cleanStaleConversations` handles all edge cases:
    - [ ] Idempotent: partner might have been cleaned up already → handle gracefully
    - [ ] Non-stale conversations are skipped
    - [ ] Agent without `conversationState` is not affected
    - [ ] TTL config value is read correctly from config table with env var fallback
- [ ] Run tests and confirm all pass (Green Phase)

### Task 3.3: Full test suite run
- [ ] Run `CI=true pnpm test` — all tests must pass
- [ ] Run `CI=true pnpm test:coverage` — verify no coverage regression
- [ ] Run `npx tsc --noEmit` — type checking passes

### Task 3.4: Phase Completion Verification and Checkpointing Protocol (Protocol in workflow.md)
- [ ] Run full test suite to confirm all tests pass
- [ ] Commit Phase 3 changes with proper message
- [ ] Attach git notes with task summary
