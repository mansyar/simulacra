# Specification: Sensory Buffer in LLM Context

## Overview
The agent's sensory buffer (Tier 1 memory — last 10 events stored in the `events` table) is not included in the LLM decision context. The `buildFullContext()` action only queries the `memories` table (Tier 2 vector store), leaving the LLM unaware of what just happened to the agent. This track adds sensory event retrieval to `buildFullContext()` so every LLM decision call includes recent events.

## Functional Requirements

**FR1 — Sensory Event Retrieval in `buildFullContext()`**
- Modify the `buildFullContext` action in `convex/functions/ai.ts` to query the agent's last 10 sensory events from the `events` table
- Use the existing `getEvents` query from `memory.ts` to retrieve events

**FR2 — Event Formatting**
- Format events as a chronologically ordered list (oldest first) prefixed with `"## Recent Events"`
- Each event line shall include: relative timestamp, event type, and description
- Format: `"- [X min ago] <type>: <description>"`

**FR3 — Context Placement**
- The `"## Recent Events"` section shall be placed at the beginning of the full context string, before relationships and memories

**FR4 — Empty State Handling**
- If the agent has no recent events, include an empty `"## Recent Events\n(No recent events)"` section rather than omitting it entirely

## Acceptance Criteria

- [ ] `buildFullContext()` returns a string that includes the last 10 sensory events from the `events` table
- [ ] Events are formatted as `"- [X min ago] <type>: <description>"` in oldest-first chronological order
- [ ] The `"## Recent Events"` section appears before relationships and memories in the context string
- [ ] Agents with no events still render the "## Recent Events" section with a placeholder
- [ ] A test verifies that sensory events appear in the LLM decision context string

## Out of Scope
- Restructuring the user prompt or `contextOverride` mechanism (covered by Track B)
- Modifying archetype prompt handling or `DECISION_SYSTEM_PROMPT` (covered by Track C)
- Changing how `getEvents` stores/trims events
- Any changes to the `decision` action's system/user prompt structure
