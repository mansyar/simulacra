# Implementation Plan: Bidirectional Conversation System

**Track ID:** `bidirectional-conversation_20260428`
**Phase:** Phase 9 — Track A

## Phase 1: Schema & Mutation Refactoring

**Goal:** Rename `lastPartnerSpeech` to `partnerLastSpeech`, add `myLastSpeech` field, update all mutations.

- [ ] Task: Write failing tests for new field schema
    - [ ] Write test: `partnerLastSpeech` field exists on setConversationState
    - [ ] Write test: `myLastSpeech` field exists on setConversationState
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Update schema.ts
    - [ ] Rename `lastPartnerSpeech` to `partnerLastSpeech` in `conversationState` object
    - [ ] Add `myLastSpeech: v.optional(v.string())` to `conversationState` object
- [ ] Task: Update mutations in agents.ts
    - [ ] Update `setConversationState` mutation args: rename `lastPartnerSpeech` → `partnerLastSpeech`, add `myLastSpeech`
    - [ ] Update `setConversationState` handler to write both fields
    - [ ] Update `getActiveConversations` if needed
- [ ] Task: Make tests pass (Green phase)
    - [ ] Run tests and confirm they pass
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Schema & Mutation Refactoring' (Protocol in workflow.md)

## Phase 2: Backend Logic Refactoring

**Goal:** Remove forced listening, implement bidirectional state writes, fix conversation end cleanup.

- [ ] Task: Write failing tests for bidirectional conversation behavior
    - [ ] Write test: Agent B responds to Agent A's initiation (bidirectional flow — B gets LLM call, is not skipped)
    - [ ] Write test: Agent B can ignore Agent A and choose a different action
    - [ ] Write test: Agent B is not stuck (action reset to idle) after conversation ends
    - [ ] Write test: `partnerLastSpeech` is correctly attributed (Alice's words stored as Bob's `partnerLastSpeech`)
    - [ ] Write test: Both agents reset to `"idle"` when conversation ends
    - [ ] Write test: Conversation context includes both `myLastSpeech` and `partnerLastSpeech`
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Remove forced `"listening"` action from processAgent
    - [ ] Delete `await ctx.runMutation(internal.functions.agents.updateAction, { agentId: targetAgentId, action: "listening" })` from the `talking` branch in `world.ts`
- [ ] Task: Update `handleConversationState` for bidirectional writes
    - [ ] When talking + has target: write `myLastSpeech` to current agent, write speech as `partnerLastSpeech` to partner agent
    - [ ] Update `setConversationState` call with new fields (`myLastSpeech` + `partnerLastSpeech`)
- [ ] Task: Fix conversation end logic
    - [ ] When conversation ends (non-talking action while in conversation):
        - [ ] Clear current agent's `conversationState`
        - [ ] Clear partner's `conversationState`
        - [ ] Reset current agent's `currentAction` to `"idle"`
        - [ ] Reset partner's `currentAction` to `"idle"`
- [ ] Task: Make all tests pass (Green phase)
    - [ ] Run tests and confirm they pass
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend Logic Refactoring' (Protocol in workflow.md)

## Phase 3: LLM Context & Conversation Prompt Updates

**Goal:** Update LLM conversation context to include `myLastSpeech` and `partnerLastSpeech`.

- [ ] Task: Write failing tests for updated conversation context
    - [ ] Write test: Conversation context string includes `myLastSpeech` content
    - [ ] Write test: Conversation context string includes `partnerLastSpeech` content
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Update conversation context in processAgent
    - [ ] Rename `lastPartnerSpeech` to `partnerLastSpeech` in context string
    - [ ] Add `myLastSpeech` section showing "What you last said"
    - [ ] Update format: include both perspectives
- [ ] Task: Make tests pass (Green phase)
    - [ ] Run tests and confirm they pass
- [ ] Task: Conductor - User Manual Verification 'Phase 3: LLM Context Updates' (Protocol in workflow.md)

## Phase 4: Existing Test Updates & Full Suite Verification

**Goal:** Update all existing tests for renamed fields, run full suite, verify >80% coverage.

- [ ] Task: Update existing tests for new field naming
    - [ ] Update `conversation_flow.test.ts` — rename all `lastPartnerSpeech` to `partnerLastSpeech`, add `myLastSpeech` where needed
    - [ ] Update `conversation_speech.test.ts` — rename `lastPartnerSpeech` to `partnerLastSpeech`
    - [ ] Update `conversation_state.test.ts` — rename `lastPartnerSpeech` to `partnerLastSpeech`
    - [ ] Update `user_prompt_context.test.ts` if it references conversation state
    - [ ] Update `schema.test.ts` for any `"listening"` related assertions
- [ ] Task: Run full test suite
    - [ ] Execute `CI=true npx vitest run`
    - [ ] Fix any failures
- [ ] Task: Verify code coverage
    - [ ] Execute coverage command and confirm >80%
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Test Suite Completion' (Protocol in workflow.md)
