# Track: LLM Sees Its Own Trajectory

## Overview

Agents currently make decisions without any awareness of their own ongoing trajectory. The LLM receives no information about the agent's current action, current position, or destination in `buildAgentContext`. Every 180-second tick is a blank slate — the LLM picks a new random destination every time, causing agents to zigzag instead of completing journeys.

This track fixes this by injecting trajectory awareness into the LLM decision context at three touchpoints:

1. **Structured `agentState`** — `currentAction` is passed as structured data to the `decision` action
2. **`## Your State` section** — `currentAction` is rendered in the user prompt alongside hunger/energy/social
3. **`## Your Identity` section** — current position, destination, and distance remaining are appended to the `agentContext` string

## Functional Requirements

### FR1: Structured `currentAction` in `agentState`

- Add `currentAction: v.string()` to the `agentState` object in the `decision` action's args schema in `convex/functions/ai.ts`.
- Update `world.ts` to pass `agent.currentAction` when invoking the `decision` action.

### FR2: Render `currentAction` in `## Your State`

- Update `buildContextPrompt` in `convex/functions/ai.ts` to render `currentAction` alongside hunger/energy/social in the `## Your State` section of the user prompt.
- Update the `agentState` type parameter of `buildContextPrompt` to include `currentAction: string`.

### FR3: Position, target & distance in `## Your Identity`

Modify the `buildAgentContext` internal query in `convex/functions/ai.ts` to append the following fields to the end of the context string (after the Personality & Instructions block):

- `Current Position: (<gridX>, <gridY>)` — the agent's current grid coordinates.
- `Destination: (<targetX>, <targetY>)` when a target is set, or `"None"` when `targetX/targetY` are undefined.
- `Distance Remaining: ~N tiles` — Euclidean distance from current position to target, when a target exists. Omit this line when no target is set.

Distance should be calculated inside the query (the agent doc already has `gridX`, `gridY`, `targetX`, `targetY`).

## Acceptance Criteria

### FR1 (agentState)
- [ ] `decision` action's `agentState` argument includes `currentAction: v.string()`

### FR2 (## Your State)
- [ ] `buildContextPrompt` output contains `"Current Action: <action>"` in the `## Your State` section
- [ ] `currentAction` renders alongside `Hunger`, `Energy`, `Social` in the user prompt

### FR3 (## Your Identity)
- [ ] `<agentContext>` returned by `buildAgentContext` contains the string `"Current Position"`
- [ ] `<agentContext>` returned by `buildAgentContext` contains the string `"Destination"`
- [ ] `<agentContext>` shows `"None"` when `targetX` and `targetY` are undefined
- [ ] `<agentContext>` includes `"Distance Remaining"` when a target is set and omits it when none is set
- [ ] Position/target/distance fields appear after `Personality & Instructions` in the context string

### Integration
- [ ] The full LLM decision user prompt contains both `currentAction` (from `## Your State`) and trajectory info (from `## Your Identity`)

## Out of Scope

- Weather-aware frontend speed (Phase 10 Track B)
- Arrival cleanup (Phase 10 Track C)
- Bounds clamping (Phase 10 Track D)

## Non-Functional Requirements

- All existing tests must continue to pass
- No changes to the `DECISION_SYSTEM_PROMPT` or output schema
- Distance calculation must be lightweight (simple Euclidean, no DB calls beyond the already-queried agent doc)
