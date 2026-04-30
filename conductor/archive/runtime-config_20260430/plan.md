# Plan: Runtime Configuration & Integration Testing

## Phase 1: Config Table Schema & Helpers

### Task 1.1: Extend config table schema
- [x] Add `maxTraits` field to config table (`v.optional(v.float64())`, comment: `Max coreTraits entries per agent`)
- [x] Add `reflectionIntervalTicks` field (`v.optional(v.float64())`, comment: `Ticks between agent reflections`)
- [x] Add `maxConversationTurns` field (`v.optional(v.float64())`, comment: `Max turns in a single conversation`)
- [x] Add `safetyMultiplier` field (`v.optional(v.float64())`, comment: `TTL formula multiplier`)
- [x] Add `agentSpeed` field (`v.optional(v.float64())`, comment: `Grid units per tick for agent movement`)

### Task 1.2: Write failing tests for config extraction (Red Phase)
- [x] Create test file `convex/config_runtime.test.ts`
- [x] Write test: `config table maxTraits overrides hardcoded 10`
- [x] Write test: `config table reflectionIntervalTicks overrides hardcoded 480`
- [x] Write test: `config table maxConversationTurns overrides hardcoded 5`
- [x] Write test: `config table safetyMultiplier overrides hardcoded 2`
- [x] Write test: `config table agentSpeed overrides hardcoded 6`
- [x] Write test: `env var fallback for each config field`
- [x] Run tests and confirm they fail as expected (Red Phase)

### Task 1.3: Create config helper functions (Green Phase)
- [x] Create `getConfigValue` helper in `convex/functions/config.ts` that accepts optional field name
- [x] Add env var fallback logic: `process.env.MAX_TRAITS ?? config?.maxTraits ?? 10`
- [x] Add env var fallback logic: `process.env.REFLECTION_INTERVAL_TICKS ?? config?.reflectionIntervalTicks ?? 480`
- [x] Add env var fallback logic: `process.env.MAX_CONVERSATION_TURNS ?? config?.maxConversationTurns ?? 5`
- [x] Add env var fallback logic: `process.env.SAFETY_MULTIPLIER ?? config?.safetyMultiplier ?? 2`
- [x] Add env var fallback logic: `process.env.AGENT_SPEED ?? config?.agentSpeed ?? 6`
- [x] Run tests and confirm all pass (Green Phase) [e90a65f]

### Task 1.4: Update seed config data
- [x] Update `convex/functions/seed.ts` to include all new config fields with defaults (no changes needed — optional fields default to undefined, getConfigValue handles fallback)
- [x] Add migration logic for existing config rows (no action needed for optional fields)

- [x] Task: Conductor - Phase Completion Verification 'Phase 1: Config Table Schema & Helpers' (Protocol in workflow.md) [checkpoint: 1413182]

## Phase 2: Code Updates — Replace Hardcoded Constants

### Task 2.1: Write failing tests for code-level extraction (Red Phase)
- [~] Update `convex/config_runtime.test.ts` or create additional tests
- [~] Write test: `updateIdentity uses config maxTraits`
- [~] Write test: `updateRelationship uses config maxConversationTurns for valenceHistory`
- [~] Write test: `processAgent reflection interval reads from config`
- [~] Write test: `cleanStaleConversations reads maxConversationTurns and safetyMultiplier from config`
- [~] Write test: `resolveMovement uses config agentSpeed`
- [~] Write test: `conversation context string shows correct turn cap from config`
- [x] Run tests and confirm they fail as expected (Red Phase) — 3/17 tests fail

### Task 2.2: Update agents.ts (Green Phase)
- [x] In `updateIdentity`: Replace `.slice(0, 10)` with config-driven value from `maxTraits`
- [x] In `updateRelationship`: Replace `.slice(0, 5)` with config-driven value from `maxConversationTurns`
- [x] In `resolveMovement`: Replace `const AGENT_SPEED = 6` with config-driven value from `agentSpeed`

### Task 2.3: Update world.ts (Green Phase)
- [x] Remove `const REFLECTION_INTERVAL_TICKS = 480` — replace with config/env var read
- [x] Replace `/5` in conversation context string with config value
- [x] In `cleanStaleConversations`: Replace `const MAX_TURNS = 5, SAFETY_MULTIPLIER = 2` with config/env var reads
- [x] Pass config values through `processAgent` parameters or use internal query
- [x] Handle config read performance: read config once at start of tick, pass down to helpers

### Task 2.4: Verify all tests pass
- [x] Run full test suite — 298 tests pass (69 test files)
- [x] Confirm all tests pass (258+ tests)
- [x] Verify coverage remains >80% [4d67246]

- [ ] Task: Conductor - Phase Completion Verification 'Phase 2: Code Updates' (Protocol in workflow.md)

## Phase 3: Integration Tests

### Task 3.1: Write integration test — Config-driven behavior
- [x] Write integration test: Seed config with non-default values, run tick, verify behavior
- [x] Run test and confirm it passes

### Task 3.2: Write integration test — Sleep mode bypass
- [x] Write integration test: Sleep mode bypass via skipSleep flag
- [x] Run test and confirm it passes

### Task 3.3: Final verification
- [x] Run full test suite — 301 tests pass (69 test files)
- [x] Verify coverage >80%
- [x] Run `npx tsc --noEmit` — no type errors

- [x] Task: Conductor - Phase Completion Verification 'Phase 3: Integration Tests' (Protocol in workflow.md) [289876c]

## Phase: Review Fixes
- [x] Task: Apply review suggestions [f38113a]
