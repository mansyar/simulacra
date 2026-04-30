# Track: Runtime Configuration & Integration Testing

**Phase 9 — Track D** | **Type:** Refactor/Chore

## Overview

Several thresholds remain as magic numbers or disconnected values across files. No integration tests verify config-driven behavior end-to-end. This track extracts hardcoded constants into the Config table (with env var fallbacks) and adds integration tests to validate config-driven behavior.

## Functional Requirements

### FR1: Config Table Schema Extension

Add the following fields to the `config` table in `convex/schema.ts`:

| Field | Type | Default | Description |
|---|---|---|---|
| `maxTraits` | `v.optional(v.float64())` | 10 | Max `coreTraits` entries per agent |
| `reflectionIntervalTicks` | `v.optional(v.float64())` | 480 | Ticks between agent reflections (~10 simulated days) |
| `maxConversationTurns` | `v.optional(v.float64())` | 5 | Max turns in a single conversation |
| `safetyMultiplier` | `v.optional(v.float64())` | 2 | TTL multiplier (`maxConversationTurns × tickInterval × safetyMultiplier × 1000`) |
| `agentSpeed` | `v.optional(v.float64())` | 6 | Grid units per tick for agent movement |

### FR2: Config-Driven Source of Truth

Update all affected files to read from the config table with env var fallbacks:

**`convex/functions/agents.ts`**
- `updateIdentity`: Replace hardcoded `.slice(0, 10)` with value from config field `maxTraits` (fallback: 10).
- `updateRelationship`: Replace hardcoded `.slice(0, 5)` with value from config field `maxConversationTurns` (fallback: 5).
- `resolveMovement`: Replace hardcoded `const AGENT_SPEED = 6` with config field `agentSpeed` (fallback: 6).

**`convex/functions/world.ts`**
- Remove `const REFLECTION_INTERVAL_TICKS = 480` — read from config field `reflectionIntervalTicks` (fallback: 480), with env var `REFLECTION_INTERVAL_TICKS` override.
- Replace hardcoded `/5` in conversation context string with config value.
- In `cleanStaleConversations`: Replace `const MAX_TURNS = 5, SAFETY_MULTIPLIER = 2` with config fields `maxConversationTurns` and `safetyMultiplier` (fallbacks: 5, 2).

**`convex/functions/seed.ts`**
- Update seed config mutation to include all new fields with defaults.

### FR3: Env Var Fallbacks

Each config value must have an env var override:

| Config Field | Env Var |
|---|---|
| `maxTraits` | `MAX_TRAITS` |
| `reflectionIntervalTicks` | `REFLECTION_INTERVAL_TICKS` |
| `maxConversationTurns` | `MAX_CONVERSATION_TURNS` |
| `safetyMultiplier` | `SAFETY_MULTIPLIER` |
| `agentSpeed` | `AGENT_SPEED` |

### FR4: Integration Tests

**Test 1: Config-driven behavior**
- Seed config with non-default values (e.g., `maxTraits=3`, `maxConversationTurns=2`)
- Run a full world tick
- Verify behavior matches the config values (e.g., trait cap at 3, conversation turn cap at 2)

**Test 2: Sleep mode bypass**
- Set `enableSleepMode = true` in config
- Run tick with `skipSleep = true`
- Verify agents are processed even though sleep mode is enabled

## Acceptance Criteria

1. All 5 config fields added to schema and seed data
2. All hardcoded constants in `agents.ts` and `world.ts` replaced with config reads
3. Env var fallbacks work for each config value
4. Integration test: set config → run tick → verify behavior matches
5. Integration test: disable sleep mode → run tick → verify agents process
6. All existing tests still pass (258+ tests)

## Out of Scope

- `SENTIMENT_AFFINITY_BOOST` constant — does not exist in current code and is not being added
- POI-aware agent behavior (Track E, separate track)
- Config UI / admin panel for runtime configuration changes (future)
