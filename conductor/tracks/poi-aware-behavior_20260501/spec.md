# Specification: POI-Aware Agent Behavior

**Track ID:** `poi-aware-behavior_20260501`
**Type:** Feature
**Phase:** Phase 9 — Track E

---

## Overview

Make agents aware of Points of Interest (POIs) so they walk to contextual locations for activities, with location-based need multipliers for deeper gameplay.

Currently, POIs (Library, Plaza, Cafe, Forest Grove) are rendered on the canvas and stored in the database, but the LLM has no awareness they exist. Agents eat, sleep, and work while standing in place — the world feels empty because locations have no meaning to the AI.

This track fixes that by:
1. Injecting POI context into LLM decisions so agents know where things are
2. Resolving POI names to coordinates for movement
3. Overriding activity actions to "walking" when a POI is targeted
4. Logging POI-specific arrival events for richer thought stream output
5. Applying location-based need multipliers for meaningful gameplay benefit

---

## Functional Requirements

### FR1: POI Context in LLM Decisions

- Add `poiContext: string` return field to `buildFullContext` action
- Query the `pois` table, compute Euclidean distance from agent's grid position
- Format each POI as:
  ```
  - Cozy Cafe (45, 15): Fresh coffee and good conversation. [1.2 tiles away]
  ```
- Add a `## Nearby Locations` section to `buildContextPrompt()` with:
  - All POI names, coordinates, descriptions, and distances
  - Activity suggestions per POI type (e.g., "eating → Cozy Cafe", "working → The Great Library")
  - Valid POI list disclaimer to reduce LLM hallucination:
    ```
    Valid destinations: Cozy Cafe, The Great Library, Central Plaza, Forest Grove.
    Do not invent locations.
    ```
- Pass `poiContext` through the `decision` action args to the prompt builder

### FR2: POI Name → Coordinate Resolution

- In `processAgent()`, after existing agent-name lookup, add POI name lookup
- Use case-insensitive `includes()` matching (e.g., `"Cafe"` resolves to `"Cozy Cafe"`)
- If multiple POIs match, prefer the closest one by Euclidean distance
- If NO POI matches AND no agent name matches AND coordinates can't be parsed → fall back to a random nearby coordinate within 5 tiles of the agent's current position (prevents the agent from standing still when the LLM outputs a hallucinated target)

### FR3: POI Target + Non-Walking Action Override

- When the LLM returns a POI name as target with an activity action (e.g., `{action: "eating", target: "Cozy Cafe"}`), override action to `"walking"` so the agent actually moves toward the POI
- Exception: if agent is already within 1 tile of the POI, keep the original action (they're already there)

### FR4: POI Arrival Events

- When an agent reaches coordinates that match a POI, log event like `"Arrived at Cozy Cafe to eat."` instead of the generic `"Arrived at destination (45, 15)"`
- Include the agent's current action in the event description for rich context
- If the agent was already at the POI (didn't walk there), log `"Already at Cozy Cafe"` to avoid misleading "arrival" messages

### FR5: Location-Based Need Multipliers

- Modify `updateNeeds` to accept optional `gridX`/`gridY` parameters (agent position)
- Query the `pois` table; check if the agent is within 1 tile of a matching POI type
- Matching rules (POI type → matching action):
  - `cafe` → `eating`
  - `library` → `working`
  - `plaza` → `talking`
  - `nature` → `exploring`
- Multiplier rule when at a matching POI:
  - All beneficial deltas: ×2
  - All draining deltas: ×0.5
- No POI nearby, or non-matching action at a POI → normal deltas (no multiplier)
- Update `processAgent` to pass agent grid position to `updateNeeds`

---

## Acceptance Criteria

- [ ] LLM context (`buildFullContext`) includes POI names, coordinates, descriptions, and distances
- [ ] `processAgent()` resolves POI names to coordinates (exact match + partial `includes()` match)
- [ ] Multiple matching POIs → closest by distance is preferred
- [ ] Hallucinated POI name → fallback to random nearby coordinate within 5 tiles
- [ ] Activity action + POI target → overridden to "walking" unless already within 1 tile
- [ ] POI arrival events logged with POI name when agent reaches coordinates
- [ ] "Already at POI" message when agent was already at the location
- [ ] Need deltas multiplied when agent is near a matching POI type
- [ ] All existing tests still pass

---

## Out of Scope

- Dynamic POI creation/deletion
- UI changes to highlight active POI effects on the canvas
- POI interaction beyond need multipliers (e.g., quests, narrative events at POIs)
- Changes to frontend AgentSprite or POISprite rendering
- Bounds clamping or arrival cleanup for movement (covered by Phase 10)
