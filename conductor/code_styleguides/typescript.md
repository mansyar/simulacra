# TypeScript Style Guide

## Overview

This guide establishes TypeScript coding conventions for the Simulacra project.

---

## Type Definitions

### Prefer Explicit Types
```typescript
// Good: Explicit return types
function getAgentPosition(agent: Agent): Coordinate {
  return { x: agent.gridX, y: agent.gridY }
}

// Good: Explicit parameter types
function calculateDistance(a: Coordinate, b: Coordinate): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}
```

### Use Type Aliases for Clarity
```typescript
// Good: Descriptive type aliases
type AgentId = string
type GridCoordinate = { x: number; y: number }
type WorldTick = {
  tickNumber: number
  timestamp: number
  agents: Agent[]
}
```

### Interface vs Type
```typescript
// Use interface for object shapes that may be extended
interface Agent {
  _id: AgentId
  name: string
  archetype: AgentArchetype
  position: GridCoordinate
}

// Use type for unions, intersections, primitives
type AgentArchetype = 'builder' | 'socialite' | 'philosopher' | 'explorer' | 'nurturer'
```

---

## Generics

### Use Generics for Reusable Code
```typescript
// Good: Generic query hook
function useQuery<T>(queryFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queryFn().then(setData).finally(() => setLoading(false))
  }, [queryFn])

  return { data, loading }
}
```

---

## Null Handling

### Optional Chaining and Nullish Coalescing
```typescript
// Good: Safe property access
const agentName = agent?.name ?? 'Unknown'
const position = agent?.position?.x ?? 0

// Good: Early returns for null checks
if (!agent) {
  return null
}
```

### Discriminated Unions
```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function handleResult<T>(result: Result<T>) {
  if (result.success) {
    console.log(result.data) // TypeScript knows data exists
  } else {
    console.error(result.error) // TypeScript knows error exists
  }
}
```

---

## Enums and Constants

### Use Const Objects Instead of Enums
```typescript
// Preferred: Const object
const AgentAction = {
  IDLE: 'idle',
  WALK_TO: 'walk_to',
  TALK_TO: 'talk_to',
  WORK: 'work',
  EXPLORE: 'explore',
  EAT: 'eat',
  SLEEP: 'sleep',
} as const

type AgentAction = typeof AgentAction[keyof typeof AgentAction]
```

### Const for Values That Don't Change
```typescript
const GRID_SIZE = 64
const TILE_WIDTH = 32
const TILE_HEIGHT = 16
const MAX_AGENTS = 50
```

---

## Function Signatures

### Prefer Explicit Parameter Names
```typescript
// Good: Descriptive parameter names
function createAgent(name: string, archetype: AgentArchetype): Agent {
  // ...
}

// Avoid: Single-letter parameters
function createAgent(n: string, a: AgentArchetype): Agent {
  // ...
}
```

### Return Type Annotations
```typescript
// Explicit return types for public APIs
export function calculateIsoPosition(
  gridX: number,
  gridY: number
): ScreenPosition {
  const screenX = (gridX - gridY) * (TILE_WIDTH / 2)
  const screenY = (gridX + gridY) * (TILE_HEIGHT / 2)
  return { x: screenX, y: screenY }
}
```

---

## Imports

### Named Imports
```typescript
// Preferred: Named imports
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Agent } from '@/convex/schema'

// Avoid: Default imports for libraries
import React from 'react' // Not needed with JSX transform
```

### Type-Only Imports
```typescript
// Import types separately when possible
import { Agent, World } from '@/convex/schema'
import type { Agent, World } from '@/convex/schema'
```

---

## Strict Mode

### Enable Strict Type Checking
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

---

## Type Inference

### Let TypeScript Infer When Obvious
```typescript
// Good: Infer from literal
const agentNames = ['Alice', 'Bob', 'Charlie'] // string[]

// Good: Infer from return type
const getInitialState = () => ({
  agents: [],
  tick: 0,
}) // { agents: Agent[]; tick: number }

// Explicit types when inference is wrong
const agentMap = new Map<string, Agent>() // Explicit: Map<string, Agent>
```

---

## Utility Types

### Use Built-in Utility Types
```typescript
// Partial for optional updates
type PartialAgent = Partial<Agent>

// Pick for subset of properties
type AgentSummary = Pick<Agent, '_id' | 'name' | 'archetype'>

// Omit for excluding properties
type AgentWithoutPosition = Omit<Agent, 'gridX' | 'gridY'>
```

---

## Async/Await

### Proper Typing
```typescript
// Good: Async functions return Promises
async function fetchAgent(id: AgentId): Promise<Agent | null> {
  const agent = await db.agents.get(id)
  return agent ?? null
}

// Good: Handle async results
async function handleAction() {
  try {
    const result = await fetchAgent(id)
    // result is Agent | null
  } catch (error) {
    // error is unknown, handle appropriately
    console.error(error)
  }
}
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `agentName`, `gridPosition` |
| Functions | camelCase | `calculateDistance`, `getAgentById` |
| Classes | PascalCase | `GameCanvas`, `AgentSprite` |
| Interfaces | PascalCase | `Agent`, `WorldState` |
| Types | PascalCase | `Coordinate`, `AgentAction` |
| Constants | UPPER_SNAKE_CASE | `GRID_SIZE`, `MAX_AGENTS` |
| Enums | PascalCase | `AgentStatus`, `WorldPhase` |