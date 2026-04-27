# Track C: Social Depth — Specification

## Overview

Multi-turn conversations, relationship-aware AI prompts, and conversation visual indicators to deepen social interactions between AI agents in the virtual world. Built on top of the existing proximity detection, relationship tracking, and speech bubble infrastructure.

---

## Functional Requirements

### C1: Relationship Context in AI Prompts

**Goal:** AI agents should be aware of their relationships when making decisions.

- **Inject relationship data into `buildFullContext`:** Before each AI decision, query the `relationships` table for all relationships involving the deciding agent and append them to the context string (e.g., "You like Alice (affinity: +14), you distrust Bob (affinity: -8)").
- **Apply recency-weighted affinity:** Decay older interactions so that recent conversations have more weight than stale ones. Use `lastInteractionAt` timestamps to compute a time-decayed score.
- **Include relationship-aware RAG query:** When retrieving semantic memories via `retrieveMemoriesAction`, include the names of nearby agents in the query to pull up conversation-relevant memories (e.g., "What should I do next given my goal X? What has happened recently with Alice or Bob?").
- **Verify AI decisions reference relationship context:** Spot-check agent decisions to confirm they naturally incorporate relationship data.

### C2: Multi-Turn Conversations

**Goal:** Open-ended, one-exchange-per-tick conversations that persist across multiple world ticks.

**Design:** Agent A initiates on tick N, Agent B responds on tick N+1, and so on until one agent ends the conversation or walks away.

- **Add `conversationState` to agent schema:**
  ```typescript
  conversationState: v.optional(v.object({
    partnerId: v.id("agents"),
    role: v.union(v.literal("initiator"), v.literal("responder")),
    turnCount: v.number(),
    lastPartnerSpeech: v.optional(v.string()),
    startedAt: v.number(),
  }))
  ```
- **Modify world tick (`tick()`):** If agent has an active `conversationState`, generate a **response** (continuation) instead of a fresh independent decision. Pass the `lastPartnerSpeech` and conversation context into the AI prompt.
- **Conversation termination conditions:**
  - AI decides to end it (action is not "talking" or target is different)
  - Partner walked away (partner no longer in range or partner's action indicates disengagement)
  - `turnCount` exceeds cap of 5 exchanges
- **Store each exchange as a `"conversation"` event** with partner reference (`targetId`), so both agents' events reference the same conversation.
- **Speech bubble persistence:** Both agents' speech bubbles remain visible for the **entire duration** of the active conversation (not just 8 seconds).

### C3: Conversation Visual Indicators

**Goal:** Observers can see which agents are actively conversing.

- **Dotted connection line:** Draw a subtle dotted line or soft beam between two agents in an active conversation using PixiJS `Graphics`. Line color matches one of the conversing agents' archetype colors. Line fades out when conversation ends.
- **Chat icon indicator:** Show a floating 💬 (or equivalent) chat icon above each agent in an active conversation pair, positioned above the speech bubble.
- **Cleanup:** When conversation ends, remove the line and icon with a brief fade-out (500ms).

---

## Non-Functional Requirements

- **Performance:** Dotted line rendering must be lightweight. Use a single `Graphics` object shared across all conversation lines, redrawn each frame only when conversation state changes.
- **Backward compatibility:** Existing single "talking → listening" interactions must continue to work. The new multi-turn system should be an enhancement, not a replacement.
- **No regression:** All existing tests must pass. Existing relationship valence history (5 entries) and affinity tracking must remain intact.

---

## Acceptance Criteria

1. ✅ AI decisions reference relationship context (e.g., "I like Alice, I'll go talk to her" in thought stream)
2. ✅ Agents hold multi-turn conversations across ticks (one exchange per tick, up to 5 turns)
3. ✅ Conversation pairs are visually linked on the canvas with dotted line and chat icon
4. ✅ Conversations end naturally when agents decide to stop or walk away
5. ✅ Each exchange is logged as a `"conversation"` event with `targetId` referencing the partner

---

## Out of Scope

- Relationship type labels (friend/rival/mentor) — affinity score used directly
- Three-way or group conversations
- Conversation branching or player choice in conversations
- AI training / fine-tuning on conversation patterns

---

## Implementation Order

```
C1 (Relationship Context in AI Prompts)
  → C2 (Multi-Turn Conversations)
  → C3 (Conversation Visual Indicators)
```
