# Track: LLM Sees Its Own Trajectory

## Overview

Agents currently make decisions without any awareness of their own ongoing trajectory. The LLM receives no information about the agent's current action, current position, or destination in `buildAgentContext`. Every 180-second tick is a blank slate — the LLM picks a new random destination every time, causing agents to zigzag instead of completing journeys.

This track fixes this by injecting trajectory awareness into the LLM decision context at two levels: the structured `agentState` in the `decision` action, and the narrative `agentContext` string in the `## Your Identity` section of the user prompt.

## Functional Requirements

### FR1: Structured trajectory data in `decision` action

- Add `currentAction` (string) to the `agentState` object in the `decision` action's args schema in `convex/functions/ai.ts`.
- Update `world.ts` to pass `agent.currentAction` when invoking the `decision` action.

### FR2: Trajectory context in `buildAgentContext`

Modify the `buildAgentContext` internal query in `convex/functions/ai.ts` to append the following fields to the context string:

- `Current Action: <currentAction>` — e.g., `"walking"`, `"idle"`, `"eating"`, etc.
- `Current Position: (<gridX>, <gridY>)` — the agent's current grid coordinates.
- `Destination: (<targetX>, <targetY>)` when a target is set, or `"None"` when `targetX/targetY` are undefined.
- `Distance Remaining: ~N tiles` — Euclidean distance from current position to target, when a target exists. Omit this line when no target is set.

Distance should be calculated inside the query (the agent doc already has `gridX`, `gridY`, `targetX`, `targetY`).

## Acceptance Criteria

- [ ] `<agentContext>` returned by `buildAgentContext` contains the string `"Current Action"`
- [ ] `<agentContext>` returned by `buildAgentContext` contains the string `"Current Position"`
- [ ] `<agentContext>` returned by `buildAgentContext` contains the string `"Destination"`
- [ ] `<agentContext>` shows `"None"` when `targetX` and `targetY` are undefined
- [ ] `<agentContext>` includes `"Distance Remaining"` when a target is set and omits it when none is set
- [ ] `decision` action's `agentState` argument includes `currentAction`
- [ ] The full LLM decision user prompt contains the agent's trajectory information

## Out of Scope

- Weather-aware frontend speed (Phase 10 Track B)
- Arrival cleanup (Phase 10 Track C)
- Bounds clamping (Phase 10 Track D)

## Non-Functional Requirements

- All existing tests must continue to pass
- No changes to the `DECISION_SYSTEM_PROMPT` or output schema
- Distance calculation must be lightweight (simple Euclidean, no DB calls beyond the already-queried agent doc)
