# Phase 10 Track B: Weather-Aware Frontend Speed — Implementation Plan

## Overview

Propagate the weather speed multiplier from `world_state.weather` to `AgentSprite` so frontend movement prediction matches backend speed in all weather conditions.

## Implementation

### Phase 1: Core Implementation

#### Task 1: Write Failing Tests (TDD Red Phase)
- [ ] **Sub-task:** Write test: AgentSprite with `speedMultiplier=0.5` (stormy) moves at half the default speed over 60s
- [ ] **Sub-task:** Write test: AgentSprite with no `speedMultiplier` defaults to original `6/180` speed
- [ ] **Sub-task:** Write test: `speedMultiplier` can be dynamically updated on an existing AgentSprite
- [ ] **Sub-task:** Write test: GameCanvas computes correct multiplier from weather (sunny→1.0, rainy→0.8, stormy→0.5, cloudy→1.0)
- [ ] **Sub-task:** Write test: GameCanvas handles null/undefined world_state gracefully
- [ ] **Sub-task:** Run tests and confirm they fail as expected

#### Task 2: Update AgentSprite to Accept speedMultiplier (TDD Green Phase)
- [ ] **Sub-task:** Add optional `speedMultiplier` property to AgentSprite class
- [ ] **Sub-task:** Accept `speedMultiplier` as optional constructor parameter
- [ ] **Sub-task:** Update tick() method to use `(6 * speedMultiplier) / 180` when defined, fall back to `6 / 180` when undefined
- [ ] **Sub-task:** Run tests and confirm they pass

#### Task 3: Update GameCanvas to Pass Weather Multiplier
- [ ] **Sub-task:** Add `useQuery(api.functions.world.getState)` in GameCanvas to access world_state
- [ ] **Sub-task:** Compute `speedMultiplier` from weather using the same mapping as backend
- [ ] **Sub-task:** Pass `speedMultiplier` to each AgentSprite in the sync effect where agents are created
- [ ] **Sub-task:** Update existing AgentSprite instances when worldState or agentsData changes (via the existing sync effect)
- [ ] **Sub-task:** Run full test suite and confirm no regressions

#### Task 4: Conductor - User Manual Verification 'Phase 10 Track B' (Protocol in workflow.md)

---

### Files to Modify
- `src/components/game/AgentSprite.ts` — Add speedMultiplier property, update tick()
- `src/components/game/GameCanvas.tsx` — Query world_state, compute multiplier, pass to AgentSprite
- `src/__tests__/AgentSprite_prediction.test.ts` — Add weather-aware speed tests

### Verification

1. Run all tests: all pass with no regressions
2. Manual: Start dev server, wait for stormy/rainy weather, observe smoother agent movement (no snap-back)
3. The backend position delta should match the frontend predicted delta over one tick interval
