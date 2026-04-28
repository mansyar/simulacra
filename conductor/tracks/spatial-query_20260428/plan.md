# Implementation Plan: Phase 8 Track B — Spatial Query Optimization

## Overview

Optimize brute-force agent proximity scans using Convex `by_position` index queries for both `recordPassivePerception` and `processAgent` nearby-agent checks. Reduce per-agent spatial query from O(n) (all agents) to O(k) (k agents within bounding box).

---

### Phase 1: Add `getNearbyAgents` Internal Query

- [x] **Task: Write failing tests for getNearbyAgents** [4be5159]
    - [x] Write test: query returns agents within radius using by_position index
    - [x] Write test: query excludes the querying agent from results
    - [x] Write test: query returns empty array when no agents are nearby
    - [x] Write test: agent far outside radius is not included in results
    - [x] Run tests to confirm they fail (Red phase)

- [x] **Task: Implement getNearbyAgents internal query** [4be5159]
    - [x] Add `getNearbyAgents` internal query in `convex/functions/agents.ts`
    - [x] Accept args: `agentId`, `gridX`, `gridY`, `radius`
    - [x] Use `withIndex("by_position", q => q.gte("gridX", gridX-radius).lte("gridX", gridX+radius))` for bounding box
    - [x] Filter results by Euclidean distance and exclude self
    - [x] Run tests to confirm they pass (Green phase)

---

### Phase 2: Optimize `recordPassivePerception`

- [x] **Task: Write failing test for optimized recordPassivePerception** [c846884]
    - [x] Read existing `perception.test.ts` to understand current test patterns
    - [x] Write test: recordPassivePerception still detects nearby agents after optimization
    - [x] Run tests to confirm they fail (Red phase)

- [x] **Task: Refactor recordPassivePerception to use index query** [c846884]
    - [x] Replace `ctx.db.query("agents").collect()` + filter with `ctx.runQuery(internal.functions.agents.getNearbyAgents, {...})`
    - [x] Keep events insertion and cleanup logic unchanged
    - [x] Run tests to confirm they pass (Green phase)

---

### Phase 3: Optimize `processAgent` Nearby Check

- [x] **Task: Write failing test for optimized processAgent nearby check** [c846884]
    - [x] Write test: processAgent correctly identifies nearby agents using index-backed query
    - [x] Run tests to confirm they fail (Red phase)

- [x] **Task: Refactor processAgent to use getNearbyAgents query** [c846884]
    - [x] Replace line 265 filter with `await ctx.runQuery(internal.functions.agents.getNearbyAgents, ...)`
    - [x] Keep full `agents` array parameter for partner/target lookups
    - [x] Run tests to confirm they pass (Green phase)

---

### Phase 4: Performance Benchmark

- [x] **Task: Write 50+ agent scaling benchmark test** [f5bc109]
    - [x] Create benchmark test that seeds 50+ agents across the 64×64 grid
    - [x] Execute a full tick and measure duration
    - [x] Assert tick duration < 30,000ms
    - [x] Run the benchmark to verify

---

### Phase 5: Documentation & Cleanup

- [ ] **Task: Add code comments for optimized query patterns**
    - [ ] Document the bounded range query pattern in `getNearbyAgents`
    - [ ] Explain the tradeoff: Convex index range on gridX + in-memory Euclidean filter

- [ ] **Task: Update docs/ARCHITECTURE.md**
    - [ ] Add spatial query optimization section to Performance Architecture
    - [ ] Document the bounded-range query pattern and its O(k) vs O(n) benefit

- [ ] **Task: Final verification**
    - [ ] Run full test suite to confirm all tests pass
    - [ ] Run coverage report to verify >80%
    - [ ] Verify the final implementation matches the specification
