# Specification: Phase 8 Track B — Spatial Query Optimization

## Overview

Replace brute-force O(n²) Euclidean distance agent scans with Convex `by_position` index queries in both `recordPassivePerception` (agents.ts) and the nearby-agent check in `processAgent()` (world.ts). Currently both locations load ALL agents into memory and scan linearly — fine for 10 agents but prevents scaling to 25+.

## Functional Requirements

### FR1: `getNearbyAgents` Internal Query
- Add a new internal query in `convex/functions/agents.ts` that accepts `agentId`, `gridX`, `gridY`, and `radius` parameters
- Query the `agents` table using the existing `by_position` index with `gte`/`lte` on `gridX` to create a bounding box of `[gridX - radius, gridX + radius]`
- Filter returned results by Euclidean distance in memory (fast on reduced set)
- Exclude the calling agent (`_id !== agentId`)
- Return only documents within the interaction radius

### FR2: Optimize `recordPassivePerception`
- Replace `ctx.db.query("agents").collect()` + brute-force filter with a call to `getNearbyAgents`
- Keep the events insertion and cleanup logic unchanged

### FR3: Optimize `processAgent` nearby-agent check
- Replace the `agents.filter(...)` on line 265 of `world.ts` with a call to `ctx.runQuery(internal.functions.agents.getNearbyAgents, ...)`
- Keep the full `agents` array parameter for conversation partner lookups and target resolution by name (unrelated lookups)

### FR4: Performance Benchmark Test
- Add a convex-test integration test that creates 50+ agents and verifies tick duration is < 30 seconds
- Use the same test patterns as existing tests in the project

### FR5: Documentation
- Add code comments explaining the bounded-range query pattern
- Update `docs/ARCHITECTURE.md` with spatial query optimization notes

## Acceptance Criteria
1. `recordPassivePerception` uses `by_position` index instead of `collect()` + brute-force filter
2. `processAgent` nearby-agent check uses index-backed query
3. All existing tests continue to pass
4. 50+ agent benchmark tick completes in < 30s
5. Code comments document the spatial query optimization pattern
