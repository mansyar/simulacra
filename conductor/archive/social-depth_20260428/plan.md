# Track: Social Depth — Implementation Plan

## Phase 1: C1 — Relationship Context in AI Prompts

### Task 1.1: Inject relationship data into `buildFullContext`
- [x] **1.1.1** Write unit tests for `buildRelationshipContext` function that formats relationship data into human-readable strings
- [x] **1.1.2** Implement `buildRelationshipContext` in `convex/functions/ai.ts` — query relationships table for deciding agent, format as "You like Alice (affinity: +14)"
- [x] **1.1.3** Modify `buildFullContext` to append relationship context to the existing context string
- [x] **1.1.4** Run tests and verify they pass

### Task 1.2: Apply recency-weighted affinity
- [x] **1.2.1** Write unit tests for recency-weighting function that decays affinity based on `lastInteractionAt` timestamp
- [x] **1.2.2** Implement `computeRecencyWeightedAffinity(lastInteractionAt, currentTime)` — decay factor: weight = exp(-daysSince * 0.1), weightedAffinity = affinity * weight
- [x] **1.2.3** Integrate into `buildRelationshipContext` so displayed affinity values reflect recency weighting
- [x] **1.2.4** Run tests and verify they pass

### Task 1.3: Relationship-aware RAG query
- [x] **1.3.1** Modify the RAG query in world tick to include nearby agent names: "What should I do next given my goal X and what's happened recently with [agent names]?"
- [x] **1.3.2** Verify that the modified query retrieves conversation-relevant memories
- [x] **1.3.3** Run tests and verify they pass

### Task 1.4: Phase Completion Verification (C1)
- [x] **1.4.1** Task: Conductor — User Manual Verification 'Phase 1: C1' (Protocol in workflow.md)

---

## Phase 2: C2 — Multi-Turn Conversations

### Task 2.1: Add `conversationState` to agent schema
- [x] **2.1.1** Write unit tests for conversation state validation (types, required fields, termination conditions)
- [x] **2.1.2** Add `conversationState` field to agents table in `convex/schema.ts` (partnerId, role, turnCount, lastPartnerSpeech, startedAt)
- [x] **2.1.3** Update `convex/agents.ts` with helper: `setConversationState`, `clearConversationState`, `getActiveConversations`
- [x] **2.1.4** Run Convex codegen and verify schema compiles with `npx convex deploy --dry-run`
- [x] **2.1.5** Run tests and verify they pass

### Task 2.2: Modify world tick for multi-turn conversation flow
- [x] **2.2.1** Write unit tests for conversation continuation logic: agent with active state generates response, agent decides to end, partner walks away, turn cap exceeded
- [x] **2.2.2** Refactor `tick()` in `convex/functions/world.ts`:
    - At start of agent processing, check if `conversationState` exists
    - If yes → pass `lastPartnerSpeech` into AI decision prompt as conversation context
    - Pass role (initiator/responder) and turnCount into prompt
    - After decision, check if action is still "talking" with same target → increment turnCount
    - If action changes or target changes → clear conversationState on both agents
- [x] **2.2.3** Handle conversation cleanup: when conversation ends, clear `conversationState` on both agents
- [x] **2.2.4** Update AI decision prompt to include instruction: "If you are in an active conversation, continue it by responding to what your partner just said. To end the conversation, change your action to something other than 'talking'."
- [x] **2.2.5** Run tests and verify they pass

### Task 2.3: Multi-turn speech persistence
- [x] **2.3.1** Write unit tests for speech bubble visibility logic when conversation is active
- [x] **2.3.2** Modify `AgentSprite.ts` tick() — keep speechContainer visible while agent has `conversationState` with active partnerId
- [x] **2.3.3** Run tests and verify they pass

### Task 2.4: Phase Completion Verification (C2)
- [x] **2.4.1** Task: Conductor — User Manual Verification 'Phase 2: C2' (Protocol in workflow.md)

---

## Phase 3: C3 — Conversation Visual Indicators

### Task 3.1: Dotted connection line between conversing agents
- [x] **3.1.1** Write unit tests for conversation line rendering logic (line creation, update, fade-out)
- [x] **3.1.2** Create `ConversationLines.ts` in `src/components/game/` — PixiJS `Graphics` object that:
    - Listens for agents with active `conversationState`
    - Draws a dotted/segmented line between their current positions
    - Uses one partner's archetype color
    - Redraws every frame only when conversation state changes (use dirty flag)
- [x] **3.1.3** Integrate `ConversationLines` into `GameCanvas.tsx` — add to PixiJS display list, update on each frame
- [x] **3.1.4** Add fade-out animation (500ms alpha transition) when conversation ends
- [x] **3.1.5** Run tests and verify they pass

### Task 3.2: Chat icon indicator above conversing agents
- [x] **3.2.1** Write unit tests for chat icon visibility logic
- [x] **3.2.2** Modify `AgentSprite.ts` — add a 💬 icon (PixiJS `Text`) above each agent that has active `conversationState`
- [x] **3.2.3** Position icon above the speech bubble, scale it to 0.6x for subtle appearance
- [x] **3.2.4** Fade out icon over 500ms when conversation ends
- [x] **3.2.5** Run tests and verify they pass

### Task 3.3: Integration and cleanup
- [x] **3.3.1** Wire conversation state from Convex query to `ConversationLines` and `AgentSprite` — ensure `AgentData` interface includes `conversationState`
- [x] **3.3.2** Verify all agents correctly show/hide conversation indicators based on state
- [x] **3.3.3** Run full test suite and verify coverage >80%
- [x] **3.3.4** Run type checker: `npx tsc --noEmit`

### Task 3.4: Phase Completion Verification (C3)
- [x] **3.4.1** Task: Conductor — User Manual Verification 'Phase 3: C3' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions d966c91
