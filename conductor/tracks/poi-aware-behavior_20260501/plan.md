# Implementation Plan: POI-Aware Agent Behavior

**Track ID:** `poi-aware-behavior_20260501`
**Type:** Feature
**Phase:** Phase 9 — Track E

---

## Phase 1: POI Context in LLM Decisions (FR1)

- [x] Task: Write failing tests for POI context in LLM decisions
    - [x] Test: `buildFullContext` returns a `poiContext` string field with all POI data
    - [x] Test: `poiContext` contains POI names (`"Cozy Cafe"`, `"The Great Library"`, etc.)
    - [x] Test: `poiContext` includes POI coordinates, descriptions, and distances from agent
    - [x] Test: `buildContextPrompt` output contains `"## Nearby Locations"` section header
    - [x] Run tests and confirm they fail (Red phase)
- [x] Task: Implement POI context retrieval in `buildFullContext`
    - [x] Query POIs table, compute Euclidean distance from agent position
    - [x] Format each POI as `"- Cozy Cafe (45, 15): description [1.2 tiles away]"`
    - [x] Return `poiContext` as new field in `buildFullContext` action
    - [x] Update the `buildFullContext` return type signature
- [x] Task: Add `## Nearby Locations` section to `buildContextPrompt`
    - [x] Add `poiContext` optional parameter to `buildContextPrompt`
    - [x] Add `## Nearby Locations` section with activity suggestions per POI type
    - [x] Append valid POI list disclaimer: `"Valid destinations: ... Do not invent locations."`
    - [x] Pass `poiContext` through `decision` action to the prompt builder
    - [x] Update `decision` action args to accept `poiContext`
- [x] Task: Run tests and confirm they pass (Green phase)
- [x] Task: Verify coverage and run full test suite
    - [x] Run `pnpm test` to confirm all tests pass
    - [x] Run `pnpm test:coverage` to verify >80% coverage
- [x] Task: Conductor - User Manual Verification 'Phase 1: POI Context in LLM Decisions' (Protocol in workflow.md) [64564e5]

---

## Phase 2: POI Name Resolution & Target Override (FR2 + FR3)

> **Testing note:** `processAgent` is a private function inside `world.ts`. All tests in this phase must use the established integration pattern: mock `global.fetch` to return specific LLM decisions, then call `tick()` and inspect resulting agent position/action/events.

- [ ] Task: Write failing tests for POI name resolution and action override
    - [ ] Test: Mock fetch returns `{action:"walking", target:"Cozy Cafe"}` → agent targetX/Y set to (45, 15)
    - [ ] Test: Mock fetch returns `{action:"walking", target:"Cafe"}` → resolves via `includes()` to Cozy Cafe coords
    - [ ] Test: Multiple POIs match (e.g., "The") → closest by distance is selected
    - [ ] Test: Mock fetch returns hallucinated name + unparseable coords → agent target is within 5 tiles, clamped to [0, 63]
    - [ ] Test: `{action:"eating", target:"Cozy Cafe"}` → action overridden to `"walking"`, target set to POI coords
    - [ ] Test: Already within 1 tile of POI → no action override (keeps `"eating"`)
    - [ ] Test: `{action:"talking", target:"Cozy Cafe"}` (no agent named Cozy Cafe) → overridden to `"walking"` like other activity actions
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Implement POI name resolution in `processAgent`
    - [ ] After existing agent-name lookup, add POI name lookup with case-insensitive `includes()` matching
    - [ ] Multiple POI matches → closest by distance wins
    - [ ] Fallback: no match → random coordinate within 5 tiles, clamped to [0, 63]
- [ ] Task: Implement action override for POI targets
    - [ ] When LLM returns activity action (eating/sleeping/working/exploring) + POI target, override to "walking"
    - [ ] When LLM returns "talking" + POI target that doesn't match any agent name, also override to "walking"
    - [ ] Check distance to POI: within 1 tile → keep original action (already there)
- [ ] Optimization: Query POIs once at the start of `processAgent` and pass the list to all consumers (target resolution, action override check, arrival events, updateNeeds) to avoid 4× redundant queries per tick
- [ ] Task: Run tests and confirm they pass (Green phase)
- [ ] Task: Verify coverage and run full test suite
    - [ ] Run `pnpm test` to confirm all tests pass
    - [ ] Run `pnpm test:coverage` to verify >80% coverage
- [ ] Task: Conductor - User Manual Verification 'Phase 2: POI Name Resolution & Target Override' (Protocol in workflow.md)

---

## Phase 3: POI Arrival Events (FR4)

- [ ] Task: Write failing tests for POI arrival events
    - [ ] Test: Agent reaches POI coordinates → event logged with POI name and action
    - [ ] Test: Agent already at POI → `"Already at <POI Name>"` message logged
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Implement POI-aware arrival event logging
    - [ ] After `resolveMovement` returns `arrived: true`, check if destination is a POI (reuse POI list from the top of `processAgent`)
    - [ ] Log `"Arrived at Cozy Cafe to eat"` if action is `"eating"` at Cafe, etc.
    - [ ] Log `"Already at Cozy Cafe"` if agent was already at the POI (didn't walk) instead of a generic "arrived" message
- [ ] Task: Run tests and confirm they pass (Green phase)
- [ ] Task: Verify coverage and run full test suite
    - [ ] Run `pnpm test` to confirm all tests pass
    - [ ] Run `pnpm test:coverage` to verify >80% coverage
- [ ] Task: Conductor - User Manual Verification 'Phase 3: POI Arrival Events' (Protocol in workflow.md)

---

## Phase 4: Location-Based Need Multipliers (FR5)

- [ ] Task: Write failing tests for POI need multipliers in `updateNeeds`
    - [ ] Test: Eating at Cozy Cafe → hunger delta is -40 (×2 of baseline -20, beneficial)
    - [ ] Test: Working at The Great Library → energy delta is -2 (×0.5 of baseline -5, draining)
    - [ ] Test: Talking at Central Plaza → social delta is +20 (×2 of baseline +10, beneficial)
    - [ ] Test: Exploring at Forest Grove → energy delta is -2 (×0.5 of baseline -3, draining)
    - [ ] Test: No POI nearby → normal deltas applied (no change)
    - [ ] Test: Non-matching action at POI location → normal deltas (no multiplier)
    - [ ] Test: Multiplied values are rounded (e.g., 5 × 0.5 = Math.round(2.5) = 3, not 2.5)
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Implement POI-aware need multipliers in `updateNeeds`
    - [ ] **No signature change** — `updateNeeds` already reads agent `gridX`/`gridY` from DB internally
    - [ ] Query POIs table from within `updateNeeds`, check if agent is within 1 tile of a matching POI
    - [ ] Define POI type → action mappings: cafe→eating, library→working, plaza→talking, nature→exploring
    - [ ] Apply precise multiplier logic per need type and delta sign:
        - `(hunger && delta < 0) || (energy && delta > 0) || (social && delta > 0)` → beneficial → ×2
        - Otherwise → draining → ×0.5
    - [ ] Round all multiplied deltas with `Math.round()` to prevent float drift
- [ ] Task: Run tests and confirm they pass (Green phase)
- [ ] Task: Verify coverage and run full test suite
    - [ ] Run `pnpm test` to confirm all 300+ tests pass
    - [ ] Run `pnpm test:coverage` to verify >80%
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Location-Based Need Multipliers' (Protocol in workflow.md)

---

## Phase 5: Final Integration & Full Test Suite

- [ ] Task: Run full integration test suite
    - [ ] Verify all 300+ existing tests still pass
    - [ ] Verify all new POI tests pass
    - [ ] Run `npx tsc --noEmit` for type checking
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Final Integration' (Protocol in workflow.md)
