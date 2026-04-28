# Specification: Bidirectional Conversation System

**Track ID:** `bidirectional-conversation_20260428`
**Type:** Bug Fix / Refactor
**Phase:** Phase 9 — Track A

## Overview

Fix the conversation system from a one-sided model (initiator drives, partner forced into `"listening"` and skipped) to a fully bidirectional model where both agents actively participate in conversations, each making LLM decisions on their turn.

**Current Critical Flaws (all to be fixed):**
1. **Partner never responds:** When Agent A talks to Agent B, B is force-set to `action: "listening"` and skipped via `if (listening) return` — B never makes an AI decision.
2. **Permanent freeze:** When the conversation ends, B's action is never reset from `"listening"`, permanently freezing B.
3. **State asymmetry:** `conversationState` is only set on the speaker, never on the partner — the partner has no record of the conversation when they eventually (if ever) get an LLM call.
4. **No multi-turn bidirectionality:** The current system simulates bidirectional conversations via a single initiator — there are no genuine back-and-forth exchanges where both agents decide what to say.

## Functional Requirements

### FR1: Remove Forced `"listening"` Action + Remove Listening Skip Guard
- **FR1.1:** Remove the `await ctx.runMutation(internal.functions.agents.updateAction, { agentId: targetAgentId, action: "listening" })` call from `processAgent()` in `world.ts`. Agents are never force-silenced.
- **FR1.2:** Keep `"listening"` in the AgentAction enum — AI agents may still genuinely choose `"listening"` as an action.
- **FR1.3:** **Remove** the `if (agent.currentAction === "listening") return;` guard. Every agent gets an LLM call every tick, ensuring they can change their action on the next tick if they previously chose `"listening"`.
- **Rationale:** Without removing the guard, an AI-chosen `"listening"` state recreates the same permanent freeze bug — the agent skips on the next tick with no way to change its action.

### FR2: Remove `lastPartnerSpeech` from `conversationState`
- **FR2.1:** Remove the `lastPartnerSpeech` field entirely from the `conversationState` schema object.
- **FR2.2:** Remove all references to `lastPartnerSpeech` in `schema.ts`, `agents.ts`, `world.ts`, and all test files.
- **Rationale:** With the new `myLastSpeech` approach (FR3), each agent stores only what THEY said. The partner's speech is read from the partner's own `myLastSpeech` via the in-memory agents list — no cross-document storage needed.

### FR3: Add `myLastSpeech` Field
- **FR3.1:** Add `myLastSpeech: v.optional(v.string())` to the `conversationState` schema object.
- **FR3.2:** Each agent stores only its own last spoken line in its own `conversationState.myLastSpeech`.

### FR4: Speech Attribution — Read Partner's Speech from In-Memory Agents
- **FR4.1:** When Alice talks to Bob, `handleConversationState` writes Alice's speech to `Alice.conversationState.myLastSpeech` only — **no writes to Bob's document**.
- **FR4.2:** When building the LLM context for Bob, the code reads Alice's `myLastSpeech` from the in-memory agents array: `alice.conversationState.myLastSpeech`.
- **FR4.3:** No cross-document patches needed. Each agent manages only its own state. Convex's whole-object `conversationState` patching works correctly.

### FR5: Fix Conversation End — Reset Partner to `"idle"`
- **FR5.1:** When either agent in a conversation chooses a non-`"talking"` action:
  - Clear the **current agent's** `conversationState` only (their action stays as AI-decided — `updateAction` runs after `handleConversationState` and will set it correctly).
  - Clear the **partner's** `conversationState` AND reset their `currentAction` to `"idle"` AND clear their `interactionPartnerId`.
- **FR5.2:** This fixes the permanently frozen partner bug (partner's action was never reset). The current agent keeps whatever action the AI chose (e.g., `"walking"` to walk away).
- **FR5.3:** Both agents make fresh AI decisions on the next tick.

### FR6: Update Conversation Context for LLM
- **FR6.1:** Remove `lastPartnerSpeech` references from the conversation context string in `processAgent()`.
- **FR6.2:** For the "what partner said" part, read the partner agent's `conversationState.myLastSpeech` from the in-memory agents array.
- **FR6.3:** For the "what I said" part, read the current agent's own `conversationState.myLastSpeech`.
- **FR6.4:** The context string should include:
  - Partner name and role
  - Turn count / max turns
  - "What you last said" (`myLastSpeech`)
  - "What [Partner] last said" (read from partner's `myLastSpeech` in agents list)
  - Instructions: continue by responding, or end by choosing a non-talking action
- **FR6.5:** Handle the edge case where `partner.myLastSpeech` is undefined (partner hasn't spoken yet — Alice just initiated).

### FR7: Update `handleConversationState` Function
- **FR7.1:** When creating/updating conversation state for a `"talking"` action:
  - Write `myLastSpeech: speech` to the **current agent's** document only.
  - Do NOT write to the partner's document (partner reads this from the agents array in their own tick).
- **FR7.2:** Preserve `startedAt` if the agent already has a `conversationState` (don't overwrite the conversation's true start time).
- **FR7.3:** When ending a conversation (non-talking action while in one):
  - Clear current agent's `conversationState`.
  - Clear partner's `conversationState`.
  - Reset partner's `currentAction` to `"idle"` AND clear partner's `interactionPartnerId`.
  - (Current agent's action is set by `updateAction` at line 327 — no reset needed.)

### FR8: Update Schema & Mutations
- **FR8.1:** Update `setConversationState` mutation: replace `lastPartnerSpeech` parameter with `myLastSpeech`.
- **FR8.2:** Remove the `updateRelationship` call with `+2` delta from the `talking` branch in `processAgent()` — it fires only on initiation and doesn't account for multi-turn conversations. (Sentiment-based affinity will be handled in Track B.)

## Non-Functional Requirements

- **Backward compatibility:** The new schema drops `lastPartnerSpeech` (adds `myLastSpeech`). Existing agents with `lastPartnerSpeech` in their `conversationState` will lose that field on next schema deploy — minor data loss acceptable since the field only stores transient conversation data that was inaccurate anyway.
- **Test coverage:** All new code must have >80% test coverage.
- **No performance regression:** Reading partner's `myLastSpeech` from the in-memory agents array is O(1) lookup — no additional database queries.

## Acceptance Criteria

1. Agent B responds to Agent A's initiation — B is NOT skipped on the tick after A talks to B.
2. Agent B can ignore Agent A and choose a different action — B is not forced into conversation.
3. Agent B is not frozen (not stuck in `"listening"` or stale state) after a conversation ends.
4. Conversation context for Bob correctly shows what Alice last said (read from Alice's `myLastSpeech` in the agents array).
5. Conversation context includes both "what you said" (`myLastSpeech`) and "what [partner] said" (partner's `myLastSpeech`).
6. When a conversation ends, the partner has `conversationState` cleared, `currentAction` reset to `"idle"`, and `interactionPartnerId` cleared.
7. Agents that AI-chose `"listening"` are not permanently stuck — they get an LLM call on the next tick.
8. All existing tests pass with updated field schema.

## Out of Scope

- Sentiment-based affinity during conversations (Phase 9 — Track B)
- Conversation TTL and cleanup (Phase 9 — Track C)
- Runtime configuration (Phase 9 — Track D)
- POI-aware agent behavior (Phase 9 — Track E)
- Hard turn cap enforcement (currently soft via LLM prompt, stays as-is)
- Conversation serialization (both agents may talk on same tick — accepted as organic bursty behavior)
