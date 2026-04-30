# Implementation Plan: POI-Aware Agent Behavior

**Track ID:** `poi-aware-behavior_20260501`
**Type:** Feature
**Phase:** Phase 9 — Track E

---

## Phase 1: POI Context in LLM Decisions (FR1)

- [ ] Task: Write failing tests for POI context in LLM decisions
    - [ ] Test: `buildFullContext` returns a `poiContext` string field with all POI data
    - [ ] Test: `poiContext` contains POI names (`"Cozy Cafe"`, `"The Great Library"`, etc.)
    - [ ] Test: `poiContext` includes POI coordinates, descriptions, and distances from agent
    - [ ] Test: `buildContextPrompt` output contains `"## Nearby Locations"` section header
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Implement POI context retrieval in `buildFullContext`
    - [ ] Query POIs table, compute Euclidean distance from agent position
    - [ ] Format each POI as `"- Cozy Cafe (45, 15): description [1.2 tiles away]"`
    - [ ] Return `poiContext` as new field in `buildFullContext` action
    - [ ] Update the `buildFullContext` return type signature
- [ ] Task: Add `## Nearby Locations` section to `buildContextPrompt`
    - [ ] Add `poiContext` optional parameter to `buildContextPrompt`
    - [ ] Add `## Nearby Locations` section with activity suggestions per POI type
    - [ ] Append valid POI list disclaimer: `"Valid destinations: ... Do not invent locations."`
    - [ ] Pass `poiContext` through `decision` action to the prompt builder
    - [ ] Update `decision` action args to accept `poiContext`
- [ ] Task: Run tests and confirm they pass (Green phase)
- [ ] Task: Verify coverage and run full test suite
    - [ ] Run `pnpm test` to confirm all tests pass
    - [ ] Run `pnpm test:coverage` to verify >80% coverage
- [ ] Task: Conductor - User Manual Verification 'Phase 1: POI Context in LLM Decisions' (Protocol in workflow.md)

---

## Phase 2: POI Name Resolution & Target Override (FR2 + FR3)

- [ ] Task: Write failing tests for POI name resolution and action override
    - [ ] Test: `processAgent()` resolves exact POI name ("Cozy Cafe") to coordinates
    - [ ] Test: `processAgent()` resolves partial POI name via `includes()` ("Cafe" → "Cozy Cafe")
    - [ ] Test: Multiple POIs match → prefer closest by Euclidean distance
    - [ ] Test: No POI/agent match + unparseable coords → random coordinate within 5 tiles of agent
    - [ ] Test: `{action:"eating", target:"Cozy Cafe"}` → action overridden to `"walking"`
    - [ ] Test: Already within 1 tile of POI → no action override (keep `"eating"`)
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Implement POI name resolution in `processAgent`
    - [ ] After existing agent-name lookup, add POI name lookup
    - [ ] Use case-insensitive `includes()` matching
    - [ ] Multiple POI matches → closest by distance wins
    - [ ] Fallback: no match → random coordinate within 5 tiles
- [ ] Task: Implement action override for POI targets
    - [ ] When LLM returns activity action + POI target, override to "walking"
    - [ ] Check distance to POI: within 1 tile → keep original action
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
    - [ ] After `resolveMovement` returns `arrived: true`, check if destination is a POI
    - [ ] Log `"Arrived at Cozy Cafe to eat"` if action is `"eating"` at Cafe, etc.
    - [ ] Log `"Already at Cozy Cafe"` if agent was already at the POI (didn't walk)
- [ ] Task: Run tests and confirm they pass (Green phase)
- [ ] Task: Verify coverage and run full test suite
    - [ ] Run `pnpm test` to confirm all tests pass
    - [ ] Run `pnpm test:coverage` to verify >80% coverage
- [ ] Task: Conductor - User Manual Verification 'Phase 3: POI Arrival Events' (Protocol in workflow.md)

---

## Phase 4: Location-Based Need Multipliers (FR5)

- [ ] Task: Write failing tests for POI need multipliers in `updateNeeds`
    - [ ] Test: Eating at Cozy Cafe → hunger delta is -40 (×2 of baseline -20)
    - [ ] Test: Working at The Great Library → energy delta is -2 (×0.5 of baseline -5)
    - [ ] Test: Talking at Central Plaza → social delta is +20 (×2 of baseline +10)
    - [ ] Test: Exploring at Forest Grove → energy delta is -2 (×0.5 of baseline -3)
    - [ ] Test: No POI nearby → normal deltas applied
    - [ ] Test: Non-matching action at POI location → normal deltas (no multiplier)
    - [ ] Run tests and confirm they fail (Red phase)
- [ ] Task: Implement POI-aware need multipliers in `updateNeeds`
    - [ ] Accept optional `gridX`/`gridY` parameters in `updateNeeds`
    - [ ] Query POIs table, check if agent is within 1 tile of a matching POI
    - [ ] Define POI type → action mappings: cafe→eating, library→working, plaza→talking, nature→exploring
    - [ ] Apply multiplier: beneficial deltas ×2, draining deltas ×0.5
    - [ ] Update `processAgent` call to pass agent position to `updateNeeds`
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
