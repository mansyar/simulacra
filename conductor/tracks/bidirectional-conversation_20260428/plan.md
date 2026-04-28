# Implementation Plan: Bidirectional Conversation System

**Track ID:** `bidirectional-conversation_20260428`
**Phase:** Phase 9 — Track A

## Phase 1: Schema & Mutation Refactoring [checkpoint: de5efa7]

**Goal:** Remove `lastPartnerSpeech` field, add `myLastSpeech` field, update all mutations.

- [x] Task: Write failing tests for new field schema
    - [x] Write test: `myLastSpeech` field exists on `setConversationState` and persists in conversationState
    - [x] Write test: `lastPartnerSpeech` no longer exists in conversationState
    - [x] Run tests and confirm they fail (Red phase)
- [x] Task: Update schema.ts
    - [x] Remove `lastPartnerSpeech: v.optional(v.string())` from `conversationState` object
    - [x] Add `myLastSpeech: v.optional(v.string())` to `conversationState` object
- [x] Task: Update mutations in agents.ts
    - [x] Update `setConversationState` mutation args: replace `lastPartnerSpeech` with `myLastSpeech`
    - [x] Update `setConversationState` handler to write `myLastSpeech` and preserve existing `startedAt` (don't overwrite)
- [x] Task: Make schema tests pass (Green phase)
    - [x] Run tests and confirm they pass
- [x] Task: Conductor - User Manual Verification 'Phase 1: Schema & Mutation Refactoring' (Protocol in workflow.md)

## Phase 2: Backend Logic Refactoring

**Goal:** Remove forced listening + listening skip guard, update `handleConversationState` to self-only writes, fix conversation end cleanup.

- [ ] Task: Write failing tests for bidirectional conversation behavior
    - [ ] Write test: Agent B responds to Agent A's initiation (B gets LLM call, is not skipped)
    - [ ] Write test: Agent B can ignore Agent A and choose a different action (not forced to talk)
    - [ ] Write test: Agent B is not stuck after conversation ends (action reset to idle, interactionPartnerId cleared)
    - [ ] Write test: Conversation context for Bob includes Alice's `myLastSpeech` (read from agents array)
    - [ ] Write test: Partner has `conversationState` cleared and `currentAction` reset to `"idle"` when conversation ends
    - [ ] Write test: Agent that chose `"listening"` via AI self-recovers on next tick (guard removed)
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Remove forced `"listening"` action from processAgent
    - [ ] Delete `await ctx.runMutation(internal.functions.agents.updateAction, { agentId: targetAgentId, action: "listening", interactionPartnerId: agent._id })` from the `talking` branch in `world.ts`
    - [ ] Remove the `+2` relationship update from the same branch (deferred to Track B)
- [ ] Task: Remove `"listening"` skip guard
    - [ ] Delete the `if (agent.currentAction === "listening") return;` line from `processAgent()`
- [ ] Task: Update `handleConversationState` for self-only speech writes
    - [ ] When `isTalking && targetAgentId`: write ONLY `myLastSpeech: speech` to current agent's `conversationState`
    - [ ] Do NOT write to partner's document
    - [ ] Preserve existing `startedAt` if re-entering conversation
- [ ] Task: Fix conversation end logic (non-talking while in conversation)
    - [ ] Clear current agent's `conversationState` only
    - [ ] Clear partner's `conversationState`
    - [ ] Reset partner's `currentAction` to `"idle"`
    - [ ] Clear partner's `interactionPartnerId`
    - [ ] (Current agent's action is handled by `updateAction` at line 327 — no reset needed)
- [ ] Task: Make all backend tests pass (Green phase)
    - [ ] Run tests and confirm they pass
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend Logic Refactoring' (Protocol in workflow.md)

## Phase 3: LLM Context & Conversation Prompt Updates

**Goal:** Update LLM conversation context to read partner's `myLastSpeech` from in-memory agents list.

- [ ] Task: Write failing tests for updated conversation context
    - [ ] Write test: Conversation context includes "What you last said" from agent's own `myLastSpeech`
    - [ ] Write test: Conversation context includes "What [Partner] last said" from partner's `myLastSpeech` in agents array
    - [ ] Write test: Conversation context handles case where partner hasn't spoken yet (`myLastSpeech` undefined)
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Update conversation context in processAgent
    - [ ] Read partner agent from in-memory `agents` array by `conversationState.partnerId`
    - [ ] Read partner's `myLastSpeech` from `partner.conversationState?.myLastSpeech`
    - [ ] Read current agent's own `myLastSpeech` from `agent.conversationState.myLastSpeech`
    - [ ] Build context string with both perspectives
    - [ ] Handle undefined partner speech gracefully ("Partner hasn't said anything yet")
- [ ] Task: Make context tests pass (Green phase)
    - [ ] Run tests and confirm they pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: LLM Context Updates' (Protocol in workflow.md)

## Phase 4: Existing Test Updates & Full Suite Verification

**Goal:** Update all existing tests to remove `lastPartnerSpeech` references, add `myLastSpeech`, run full suite, verify >80% coverage.

- [ ] Task: Update existing tests for new schema
    - [ ] Update `conversation_flow.test.ts` — replace `lastPartnerSpeech` with `myLastSpeech` in `setConversationState` calls
    - [ ] Update `conversation_speech.test.ts` — replace `lastPartnerSpeech` with `myLastSpeech`
    - [ ] Update `conversation_state.test.ts` — replace `lastPartnerSpeech` with `myLastSpeech`
    - [ ] Update `user_prompt_context.test.ts` if it references conversation state
    - [ ] Update `schema.test.ts` for any `"listening"` related assertions
- [ ] Task: Run full test suite
    - [ ] Execute `CI=true npx vitest run`
    - [ ] Fix any failures
- [ ] Task: Verify code coverage
    - [ ] Execute coverage command and confirm >80%
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Test Suite Completion' (Protocol in workflow.md)
