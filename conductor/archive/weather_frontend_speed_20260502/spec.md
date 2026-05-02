# Phase 10 Track B: Weather-Aware Frontend Speed

## Overview

The frontend `AgentSprite` hardcodes movement speed as `6 / 180` (grid units per second), ignoring the weather speed multiplier that the backend applies. During rainy (0.8x) or stormy (0.5x) weather, the frontend predicts movement at full speed while the backend advances at reduced speed, causing a jarring 500ms snap-back course correction every tick.

This track propagates the weather-based speed multiplier from `world_state.weather` to `AgentSprite` so frontend movement prediction matches backend speed in all weather conditions.

## Functional Requirements

### FR1: Shared Weather Multiplier Utility
- A pure utility function `getWeatherSpeedMultiplier(weather?: string): number` shall be extracted to `src/lib/weather.ts`
- The utility shall use the same mapping as the backend:
  - `sunny` → 1.0, `cloudy` → 1.0, `rainy` → 0.8, `stormy` → 0.5
- Default to `1.0` when weather is `undefined` or unknown
- This utility replaces the inline multiplier logic in `convex/functions/world.ts` to keep the mapping DRY

### FR2: Weather Multiplier Propagation
- `GameCanvas` shall query `world_state` via `useQuery(api.functions.world.getState)`
- GameCanvas shall compute a `speedMultiplier` using the shared utility: `getWeatherSpeedMultiplier(worldState?.weather)`
- The computed multiplier shall be passed to each `AgentSprite` instance

### FR3: Multiplier Applied in Tick Calculation
- `AgentSprite` shall accept an optional `speedMultiplier` constructor parameter for initial setup
- `AgentSprite` shall expose a `setSpeedMultiplier(multiplier: number | undefined): void` method for dynamic updates
- In the tick method, the movement speed calculation shall change from:
  ```
  const speed = 6 / 180
  ```
  to:
  ```
  const speed = this.speedMultiplier !== undefined
    ? (6 * this.speedMultiplier) / 180
    : 6 / 180
  ```
- When `speedMultiplier` is `undefined`, the original behavior shall be preserved (backward compatibility)
- No additional per-frame allocations in `AgentSprite.tick()`

### FR4: Graceful Degradation
- If `world_state` query returns `null` or `undefined`, no multiplier shall be passed (AgentSprite uses default behavior)
- No error shall be thrown if weather data is unavailable

### FR5: Dynamically Updated
- When weather changes (e.g., sunny → stormy), `AgentSprite` instances that were created earlier must receive the updated multiplier
- This shall be achieved by calling `setSpeedMultiplier()` on all sprites in the existing sync effect
- The sync effect's dependency array must include `worldState` to re-run on weather changes

## Non-Functional Requirements

- **Performance**: No additional per-frame allocations in `AgentSprite.tick()`
- **Backward Compatibility**: Existing test for `6/180` speed shall still pass when no multiplier is provided
- **Consistency**: Frontend speed calculation shall match backend `resolveMovement` logic exactly

## Acceptance Criteria

- [ ] AgentSprite moves at reduced speed during rainy (0.8x) and stormy (0.5x) weather
- [ ] Default behavior (no multiplier) matches original `6 / 180` speed
- [ ] Weather changes dynamically update the multiplier on existing AgentSprite instances
- [ ] No errors when world_state is null/undefined
- [ ] Backend position delta matches frontend predicted delta over one tick interval in all weather conditions

## Out of Scope

- Adding weather information to the AgentData type (weather stays in world_state)
- Changing the backend weather multiplier logic
- Adding visual weather effects to the PixiJS canvas
