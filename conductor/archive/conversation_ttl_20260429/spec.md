# Track: Conversation TTL & Cleanup

## Overview

`conversationState` on agents persists forever with no timeout. If the tick interval is 180s and the conversation cap is 5 turns, conversations span ~15 minutes. If both agents go idle or the LLM keeps them talking without resolution, the conversation state is never cleaned up, leaving stale data that can interfere with future interactions and the frontend conversation line rendering.

This track adds a TTL (Time-To-Live) mechanism that auto-cleanups stale conversations, ensuring conversation state is garbage-collected after a configurable timeout.

> **Safety-Net Role:** Beyond general state cleanup, the TTL mechanism also serves as a critical safety net for a subtler race condition. When Agent A switches from talking to Agent B to talking to Agent C (via an LLM decision), `handleConversationState` overwrites A's `conversationState.partnerId` to C, but Agent B's `conversationState` still references A. Agent B is now "orphaned" — stuck with a stale conversation reference. The TTL cleanup is the only mechanism that rescues Agent B by force-ending the stale state. Without TTL, orphaned agents remain stuck indefinitely.

## Functional Requirements

### FR1: Configure Conversation TTL

- Add `conversationMaxTtlMs` field to the `config` table as an optional override (`v.optional(v.float64())`).
- When `conversationMaxTtlMs` is **not set** in config, compute a dynamic default:
  ```
  conversationTtlMs = MAX_CONVERSATION_TURNS (5) × tickIntervalSeconds × SAFETY_MULTIPLIER (2) × 1000
  ```
  - `tickIntervalSeconds` is read from the config table's `defaultTickInterval` field (which itself is set from the `WORLD_TICK_INTERVAL` env var or defaults to `180`).
  - `SAFETY_MULTIPLIER = 2` ensures the TTL is 2× the theoretical max conversation duration.
- Fall back to `CONVERSATION_MAX_TTL_MS` env var when neither config value is available.
- Fall back to `1,800,000` (30 min) if nothing is configured at all.
- **Examples of computed defaults:**
  | Tick Interval | Max Turns | Safety × 2 | Computed TTL |
  |---------------|-----------|-------------|--------------|
  | 60s | 5 | 2× | 600,000ms (10 min) |
  | 180s | 5 | 2× | 1,800,000ms (30 min) |
  | 300s | 5 | 2× | 3,000,000ms (50 min) |

### FR2: Hard Stale Conversation Cleanup

- At the **start** of the `tick()` action (after fetching state, before processing agents), call `cleanStaleConversations` with the in-memory agents array.
- Detect stale conversations using the existing `conversationState.startedAt` field.
- A conversation is considered stale when: `Date.now() - conversationState.startedAt > conversationTtlMs`
- **Hard cleanup:** In addition to DB mutations (`resetConversationEnd`), mutate the in-memory agent objects directly:
  - Set `agent.conversationState = undefined`
  - Set `agent.currentAction = "idle"`
  - Set `agent.interactionPartnerId = undefined`
  - Do the same for the partner agent
- This ensures `processAgent` sees clean state and cannot restart the conversation on the same tick.
- **Partner deduplication:** Use a `Set<string>` of processed agent IDs to avoid processing the same conversation pair twice.

### FR3: Stale Conversation Cleanup & Event Logging

- When a stale conversation is detected, call `resetConversationEnd` on the agent (the same mutation used when a conversation ends naturally).
- For each stale conversation partner, also call `resetConversationEnd` on the partner agent.
- Log a cleanup event to both agents' sensory buffers via `addEvent`.
  - Event type: `'interaction'`
  - Event description with **dynamically computed staleness duration:**
    - Format: `'Conversation with {partnerName} ended (stale after {staleMinutes} min).'`
    - `staleMinutes = Math.round((Date.now() - conversationState.startedAt) / 60000)`

### FR4: Cleanup Runs Every Tick

- The cleanup routine runs every tick, regardless of whether any agents are actively processing.
- If no stale conversations are found, the tick proceeds normally with zero overhead from the cleanup check.

## Acceptance Criteria

- [ ] Stale conversations are detected and cleaned up at the start of each tick
- [ ] Both agents in a stale conversation have their `conversationState`, `currentAction`, `interactionPartnerId`, and `speech` reset
- [ ] In-memory agent objects are mutated so agents cannot restart the cleaned conversation on the same tick
- [ ] Partner deduplication prevents processing the same conversation pair twice
- [ ] Cleanup events are logged to the sensory buffer for both agents
- [ ] Event descriptions contain dynamically computed staleness duration
- [ ] TTL formula scales with tick interval: `5 × tickInterval × 2 × 1000`
- [ ] Config table `conversationMaxTtlMs` value overrides the computed default
- [ ] Env var `CONVERSATION_MAX_TTL_MS` overrides everything
- [ ] All existing tests continue to pass

## Out of Scope

- Adding `lastTurnAt` field — using existing `startedAt` per user choice
- Per-agent TTL overrides (single global TTL is sufficient)
- Frontend notifications for cleanup events (handled implicitly via sensory events)
- Storing cleanup count or metrics (can be added later if needed)
