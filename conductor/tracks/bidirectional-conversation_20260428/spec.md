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

### FR1: Remove Forced `"listening"` Action
- **FR1.1:** Remove the `await ctx.runMutation(internal.functions.agents.updateAction, { agentId: targetAgentId, action: "listening" })` call from `processAgent()` in `world.ts`.
- **FR1.2:** Keep `"listening"` in the AgentAction enum — AI agents may still genuinely choose "listening" as an action.
- **FR1.3:** Keep the `if (agent.currentAction === "listening") return;` guard — AI-chosen listening still causes the agent to skip.
- **Rationale:** Agents are never force-silenced. If the AI genuinely chooses to listen, that's a valid choice.

### FR2: Rename `lastPartnerSpeech` to `partnerLastSpeech`
- **FR2.1:** Rename the `lastPartnerSpeech` field in the `conversationState` schema to `partnerLastSpeech`.
- **FR2.2:** Update all references in `schema.ts`, `agents.ts`, `world.ts`, and all test files.

### FR3: Add `myLastSpeech` Field
- **FR3.1:** Add a `myLastSpeech: v.optional(v.string())` field to the `conversationState` schema object.
- **FR3.2:** Each agent stores its own last spoken line in `myLastSpeech`.

### FR4: Bidirectional Speech Attribution
- **FR4.1:** When Alice talks to Bob, `handleConversationState` writes Alice's speech to:
  - `Alice.conversationState.myLastSpeech` (what Alice last said)
  - `Bob.conversationState.partnerLastSpeech` (what Bob last heard)
- **FR4.2:** This means `handleConversationState` performs TWO document patches (self + partner) instead of one.
- **FR4.3:** Each agent's document is self-contained — Bob reads his own `partnerLastSpeech` to know what Alice said.

### FR5: Fix Conversation End — Reset Both to `"idle"`
- **FR5.1:** When either agent in a conversation chooses a non-`"talking"` action, clear BOTH agents' `conversationState` AND reset BOTH agents' `currentAction` to `"idle"`.
- **FR5.2:** This fixes the permanently frozen partner bug (action was never reset).
- **FR5.3:** Both agents will make fresh AI decisions on the next tick (no stale state).

### FR6: Update Conversation Context for LLM
- **FR6.1:** Rename `lastPartnerSpeech` to `partnerLastSpeech` in the conversation context string built in `processAgent()`.
- **FR6.2:** Add `myLastSpeech` to the context so the AI knows what IT last said (can refer to its own prior statement).
- **FR6.3:** The context string should include:
  - Partner name and role
  - Turn count / max turns
  - "What you last said" (`myLastSpeech`)
  - "What [Partner] last said" (`partnerLastSpeech`)
  - Instructions: continue by responding, or end by choosing a non-talking action

### FR7: Update `handleConversationState` Function
- **FR7.1:** Change the function signature and logic to write speech fields to both agents' documents.
- **FR7.2:** When creating/updating conversation state, write `myLastSpeech` to the current agent and write the same speech as `partnerLastSpeech` to the partner agent.
- **FR7.3:** When ending a conversation (non-talking action while in one): clear both agents' state AND set both agents' `currentAction` to `"idle"`.

### FR8: Update Schema & Mutations
- **FR8.1:** Update `setConversationState` mutation to accept `myLastSpeech` and `partnerLastSpeech` parameters (rename from `lastPartnerSpeech`).
- **FR8.2:** Add a new or updated mutation to set a partner's `partnerLastSpeech` field separately (for cross-document writes).

## Non-Functional Requirements

- **Backward compatibility:** The new schema must handle agents that may still have old `lastPartnerSpeech` fields (graceful degradation or migration).
- **Test coverage:** All new code must have >80% test coverage.
- **No performance regression:** The cross-document write (FR4.1) adds minimal overhead — one additional `ctx.db.patch` per conversation turn.

## Acceptance Criteria

1. Agent B responds to Agent A's initiation — B is NOT skipped on the tick after A talks to B.
2. Agent B can ignore Agent A and choose a different action — B is not forced into conversation.
3. Agent B is not frozen (not in `"listening"` state) after a conversation ends.
4. `partnerLastSpeech` is correctly attributed — Alice's words appear as Bob's `partnerLastSpeech`.
5. Conversation context in LLM prompt includes both `myLastSpeech` and `partnerLastSpeech`.
6. When either agent ends a conversation, both agents have `conversationState` cleared and `currentAction` reset to `"idle"`.
7. All existing tests pass with updated field names.

## Out of Scope

- Sentiment-based affinity during conversations (Phase 9 — Track B)
- Conversation TTL and cleanup (Phase 9 — Track C)
- Runtime configuration (Phase 9 — Track D)
- POI-aware agent behavior (Phase 9 — Track E)
- Hard turn cap enforcement (currently soft via LLM prompt, stays as-is)
