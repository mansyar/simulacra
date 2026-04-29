# Plan: Conversation TTL & Cleanup

## Phase 1: Schema, Config, and Cleanup Infrastructure [checkpoint: 07f6989]

### Task 1.1: Add `conversationMaxTtlMs` to config table schema [a9b3343]
- [x] Add `conversationMaxTtlMs` field to the config table definition in `convex/schema.ts`
    - [x] Type: `v.optional(v.float64())` with a comment `// ms override; computed default: 5 × tickInterval × 2 × 1000`
- [x] Update seed config in `convex/functions/seed.ts` to include `conversationMaxTtlMs: undefined` (leave unset — use computed default)
- [x] Add migration logic for existing config rows (no action needed for optional field)

### Task 1.2: Write failing test for config and TTL formula
- [x] Create test file `convex/conversation_ttl.test.ts`
- [x] Write test: `computed TTL default = 5 × tickInterval × 2 × 1000`
- [x] Write test: `config table conversationMaxTtlMs overrides computed default`
- [x] Write test: `env var CONVERSATION_MAX_TTL_MS overrides everything`
- [x] Run tests and confirm they fail as expected (Red Phase)

### Task 1.3: Implement cleanStaleConversations function (Hard Cleanup + Partner Dedup) [f657f96]
- [x] Create `cleanStaleConversations` internal function in `convex/functions/world.ts`
    - [x] Calculate TTL: `config?.conversationMaxTtlMs ?? (MAX_TURNS(5) × (config?.defaultTickInterval ?? 180) × SAFETY_MULTIPLIER(2) × 1000)`
    - [x] Fallback: `parseInt(process.env.CONVERSATION_MAX_TTL_MS ?? "1800000")` when config table unavailable
    - [x] **Partner dedup:** `const processed = new Set<string>()` to skip already-processed agents
    - [x] Guard: `if (!agent.conversationState) continue;` and `if (processed.has(agent._id)) continue;`
    - [x] Filter: agents where `Date.now() - conversationState.startedAt > ttlMs`
    - [x] **Hard cleanup — DB + in-memory:**
        - [x] DB: `ctx.runMutation(internal.functions.agents.resetConversationEnd, { agentId: agent._id })`
        - [x] In-memory: `agent.conversationState = undefined; agent.currentAction = "idle"; agent.interactionPartnerId = undefined;`
        - [x] Same for partner agent (DB + in-memory)
    - [x] Add processed IDs: `processed.add(agent._id); if (partner) processed.add(partner._id);`
    - [x] Return count of conversations cleaned
- [x] Integrate `cleanStaleConversations` into `tick()` action:
    - [x] Call after fetching state/config, BEFORE processing agents
    - [x] Log cleanup count: `console.log(\`[WORLD] Cleaned \${cleaned} stale conversations\`)`

### Task 1.4: Phase Completion Verification and Checkpointing Protocol (Protocol in workflow.md) [07f6989]
- [x] Run tests to confirm Phase 1 tasks pass
- [x] Verify cleanup routine correctly identifies stale conversations and mutates in-memory objects
- [x] Commit Phase 1 changes

## Phase 2: Event Logging for Cleanup

### Task 2.1: Write failing test for cleanup event logging
- [ ] Add test to `convex/conversation_ttl.test.ts`
    - [ ] Test: `cleanup event logged for both agents when conversation is stale`
    - [ ] Test: `cleanup event description contains dynamically computed stale duration`
- [ ] Run tests and confirm they fail (Red Phase)

### Task 2.2: Implement cleanup event logging
- [ ] In `cleanStaleConversations`, after determining a conversation is stale:
    - [ ] Compute stale duration: `const staleMinutes = Math.round((now - agent.conversationState.startedAt) / 60000);`
    - [ ] Find partner name: `partner?.name ?? "Unknown"`
    - [ ] For current agent: `ctx.runMutation(api.functions.memory.addEvent, { agentId: agent._id, type: "interaction", description: \`Conversation with \${partnerName} ended (stale after \${staleMinutes} min).\`, gridX: agent.gridX, gridY: agent.gridY })`
    - [ ] For partner agent: same event with current agent's name as the partner
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
    - [ ] Test: `after hard cleanup, processAgent does not see old conversationState in-memory`
    - [ ] Test: `partner dedup does not process the same conversation pair twice`
    - [ ] Test: `TTL scales correctly when tickInterval changes to 60s`
- [ ] Run tests and confirm they fail (Red Phase)

### Task 3.2: Implement edge case handling
- [ ] Verify `cleanStaleConversations` handles all edge cases:
    - [ ] Partner dedup Set prevents double-processing (already in Phase 1)
    - [ ] Idempotent: partner might have been cleaned up by previous iteration
    - [ ] Non-stale conversations are skipped
    - [ ] In-memory mutations prevent same-tick restart
    - [ ] TTL correctly reads from config table → computed default → env var → hardcoded fallback
- [ ] Run tests and confirm all pass (Green Phase)

### Task 3.3: Full test suite run
- [ ] Run `CI=true pnpm test` — all tests must pass
- [ ] Run `CI=true pnpm test:coverage` — verify no coverage regression (<80%)
- [ ] Run `npx tsc --noEmit` — type checking passes

### Task 3.4: Phase Completion Verification and Checkpointing Protocol (Protocol in workflow.md)
- [ ] Run full test suite to confirm all 250+ tests pass
- [ ] Commit Phase 3 changes with proper message
- [ ] Attach git notes with task summary
