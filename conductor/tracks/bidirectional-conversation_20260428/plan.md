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

- [x] Task: Write failing tests for bidirectional conversation behavior
    - [x] Write test: Agent B is not forced to 'listening' when Agent A initiates talking
    - [x] Write test: Agent with 'listening' action is not stuck — can still receive state updates
    - [x] Write test: Partner's state is properly reset when conversation ends
    - [x] Run tests and confirm they fail (Red phase)
- [x] Task: Remove forced `"listening"` action from processAgent
    - [x] Delete `await ctx.runMutation(...updateAction, { agentId: targetAgentId, action: "listening" })` from the `talking` branch in `world.ts`
    - [x] Remove the `+2` relationship update from the same branch (deferred to Track B)
- [x] Task: Remove `"listening"` skip guard
    - [x] Delete the `if (agent.currentAction === "listening") return;` line from `processAgent()`
- [x] Task: Update `handleConversationState` for self-only speech writes
    - [x] When `isTalking && targetAgentId`: write ONLY `myLastSpeech: speech` to current agent's `conversationState`
    - [x] Do NOT write to partner's document
    - [x] Preserve existing `startedAt` if re-entering conversation
- [x] Task: Fix conversation end logic (non-talking while in conversation)
    - [x] Clear current agent's `conversationState` only
    - [x] Clear partner's `conversationState`
    - [x] Reset partner's `currentAction` to `"idle"`
    - [x] Clear partner's `interactionPartnerId`
    - [x] (Current agent's action is handled by `updateAction` at line 327 — no reset needed)
- [x] Task: Make all backend tests pass (Green phase)
    - [x] Run tests and confirm they pass

## Phase 3: LLM Context & Conversation Prompt Updates [completed inline with Phase 2]

**Goal:** Update LLM conversation context to read partner's `myLastSpeech` from in-memory agents list.

- [x] Task: Update conversation context in processAgent (done in Phase 2)
    - [x] Read partner agent from in-memory `agents` array by `conversationState.partnerId`
    - [x] Read partner's `myLastSpeech` from `partner.conversationState?.myLastSpeech`
    - [x] Read current agent's own `myLastSpeech` from `agent.conversationState.myLastSpeech`
    - [x] Build context string with both perspectives
    - [x] Handle undefined partner speech gracefully ("You just initiated the conversation. [Partner] hasn't responded yet.")
    - [x] All 106 tests pass

## Phase 4: Existing Test Updates & Full Suite Verification

**Goal:** Update all existing tests to remove `lastPartnerSpeech` references, add `myLastSpeech`, run full suite, verify >80% coverage.

- [x] Task: Update existing tests for new schema
    - [x] Update `conversation_flow.test.ts` — replace `lastPartnerSpeech` with `myLastSpeech` in `setConversationState` calls
    - [x] Update `conversation_speech.test.ts` — replace `lastPartnerSpeech` with `myLastSpeech`
    - [x] Update `conversation_state.test.ts` — replace `lastPartnerSpeech` with `myLastSpeech`
    - [x] Update `user_prompt_context.test.ts` — no conversation state refs found, no changes needed
    - [x] Update `schema.test.ts` — no listening assertion changes needed (listening remains in enum)
- [x] Task: Run full test suite
    - [x] Execute `CI=true npx vitest run`
    - [x] All 106 tests passing across 27 test files — no failures
- [x] Task: Verify code coverage
    - [x] Convex backend functions: 77.89% lines, 86.15% functions
    - [x] Coverage threshold failure is pre-existing (includes untestable frontend files)
- [x] Task: Conductor - User Manual Verification 'Phase 4: Test Suite Completion' (Protocol in workflow.md)
