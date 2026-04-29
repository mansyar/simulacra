# Track: Conversation TTL & Cleanup

## Overview

`conversationState` on agents persists forever with no timeout. If the tick interval is 180s and the conversation cap is 5 turns, conversations span ~15 minutes. If both agents go idle or the LLM keeps them talking without resolution, the conversation state is never cleaned up, leaving stale data that can interfere with future interactions and the frontend conversation line rendering.

This track adds a TTL (Time-To-Live) mechanism that auto-cleanups stale conversations, ensuring conversation state is garbage-collected after a configurable timeout.

## Functional Requirements

### FR1: Configure Conversation TTL
- Add `conversationMaxTtlMs` field to the `config` table with a default value of `1800000` (30 minutes).
- Fall back to `CONVERSATION_MAX_TTL_MS` env var when config table value is not set.
- Fall back to `1800000` if neither config table nor env var is available.

### FR2: Stale Conversation Detection
- At the **start** of the `tick()` action (after fetching state, before processing agents), iterate all loaded agents.
- Detect stale conversations using the existing `conversationState.startedAt` field.
- A conversation is considered stale when: `Date.now() - conversationState.startedAt > CONVERSATION_MAX_TTL_MS`
- **Approach:** Use existing `startedAt` field — no new schema fields needed.

### FR3: Stale Conversation Cleanup
- When a stale conversation is detected, call `resetConversationEnd` on the agent (the same mutation used when a conversation ends naturally).
- For each stale conversation partner, also call `resetConversationEnd` on the partner agent.
- Log a cleanup event to both agents' sensory buffers via `addEvent`.
  - Event description format: `'Conversation with {partnerName} ended (stale after 30 min).'`
  - Event type: `'interaction'`

### FR4: Cleanup Runs Every Tick
- The cleanup routine runs every tick, regardless of whether any agents are actively processing.
- If no stale conversations are found, the tick proceeds normally with zero overhead from the cleanup check.

## Acceptance Criteria

- [ ] Stale conversations are detected and cleaned up at the start of each tick
- [ ] Both agents in a stale conversation have their `conversationState`, `currentAction`, `interactionPartnerId`, and `speech` reset
- [ ] Cleanup events are logged to the sensory buffer for both agents
- [ ] Config table `conversationMaxTtlMs` value overrides env var default
- [ ] Env var `CONVERSATION_MAX_TTL_MS` overrides hardcoded default
- [ ] All existing tests continue to pass

## Out of Scope

- Adding `lastTurnAt` field — using existing `startedAt` per user choice
- Per-agent TTL overrides (single global TTL is sufficient)
- Frontend notifications for cleanup events (handled implicitly via sensory events)
- Storing cleanup count or metrics (can be added later if needed)
