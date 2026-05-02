# Phase 10 Track B: Weather-Aware Frontend Speed — Implementation Plan

## Overview

Propagate the weather speed multiplier from `world_state.weather` to `AgentSprite` so frontend movement prediction matches backend speed in all weather conditions. Extract the multiplier logic into a shared utility to keep it DRY across frontend and backend.

## Implementation

### Phase 1: Shared Utility & Tests

#### Task 1: Extract Weather Multiplier Utility (TDD Red Phase)
- [ ] **Sub-task:** Create `src/lib/weather.ts` with pure function `getWeatherSpeedMultiplier(weather?: string): number`
- [ ] **Sub-task:** Write test: `getWeatherSpeedMultiplier('sunny')` returns `1.0`
- [ ] **Sub-task:** Write test: `getWeatherSpeedMultiplier('cloudy')` returns `1.0`
- [ ] **Sub-task:** Write test: `getWeatherSpeedMultiplier('rainy')` returns `0.8`
- [ ] **Sub-task:** Write test: `getWeatherSpeedMultiplier('stormy')` returns `0.5`
- [ ] **Sub-task:** Write test: `getWeatherSpeedMultiplier(undefined)` returns `1.0` (graceful degradation)
- [ ] **Sub-task:** Run tests and confirm they pass (this is a pure function, no mocks needed)

#### Task 2: Write Failing AgentSprite Tests (TDD Red Phase)
- [ ] **Sub-task:** Write test: AgentSprite with `speedMultiplier=0.5` (stormy) moves at half the default speed over 60s
- [ ] **Sub-task:** Write test: AgentSprite with no `speedMultiplier` defaults to original `6/180` speed
- [ ] **Sub-task:** Write test: AgentSprite's `setSpeedMultiplier(0.5)` dynamically changes tick speed
- [ ] **Sub-task:** Run tests and confirm they fail as expected

### Phase 2: Core Implementation

#### Task 3: Update AgentSprite with speedMultiplier Support (TDD Green Phase)
- [ ] **Sub-task:** Add private `speedMultiplier?: number` property to AgentSprite class
- [ ] **Sub-task:** Accept optional `speedMultiplier` as constructor parameter (for initial setup)
- [ ] **Sub-task:** Add public `setSpeedMultiplier(multiplier: number | undefined): void` method (for dynamic updates)
- [ ] **Sub-task:** Update `tick()` method at ~line 237:
  ```
  const speed = this.speedMultiplier !== undefined
    ? (6 * this.speedMultiplier) / 180
    : 6 / 180
  ```
- [ ] **Sub-task:** Run tests and confirm they pass

#### Task 4: Update GameCanvas to Pass Weather Multiplier
- [ ] **Sub-task:** Add `useQuery(api.functions.world.getState)` in GameCanvas
- [ ] **Sub-task:** Import and use `getWeatherSpeedMultiplier` to compute multiplier from worldState
- [ ] **Sub-task:** Pass `speedMultiplier` to new AgentSprite instances in constructor
- [ ] **Sub-task:** Call `setSpeedMultiplier()` on ALL existing AgentSprite instances in the sync effect (for dynamic weather changes)
- [ ] **Sub-task:** Add `worldState` to the sync effect's dependency array
- [ ] **Sub-task:** Run full test suite and confirm no regressions

#### Task 5: Refactor Backend to Use Shared Utility
- [ ] **Sub-task:** Import `getWeatherSpeedMultiplier` from `src/lib/weather`... *(wait — this won't work for Convex backend since it's in a separate runtime)*
- [ ] **Sub-task:** *(Backend world.ts already has inline logic — keep it as-is since Convex and frontend run in different JS contexts and can't share imports)*
- [ ] **Sub-task:** Add a code comment in `world.ts` line 468 referencing the shared utility location for cross-reference

### Phase 3: Verification

#### Task 6: Conductor - User Manual Verification 'Phase 10 Track B' (Protocol in workflow.md)
- [ ] **Sub-task:** Verify all tests pass with no regressions
- [ ] **Sub-task:** Verify integration: backend position delta matches frontend predicted delta over one tick interval

---

### Files to Create
- `src/lib/weather.ts` — Pure utility function for weather speed multiplier
- `src/__tests__/weather.test.ts` — Unit tests for the utility function

### Files to Modify
- `src/components/game/AgentSprite.ts` — Add speedMultiplier property, constructor param, setSpeedMultiplier method, update tick()
- `src/components/game/GameCanvas.tsx` — Query world_state, compute multiplier, pass to AgentSprite via constructor + setSpeedMultiplier
- `src/__tests__/AgentSprite_prediction.test.ts` — Add weather-aware speed tests
- `convex/functions/world.ts` — Add cross-reference comment to the shared utility

### Verification

1. Run all tests: all pass with no regressions
2. Manual: Start dev server, wait for stormy/rainy weather, observe smoother agent movement (no snap-back)
3. The backend position delta should match the frontend predicted delta over one tick interval
