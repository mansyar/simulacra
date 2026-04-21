# SCHEMA.md - Data Schema & TypeScript Interfaces

## 1. Convex Database Schema

### 1.1 Table Overview

```typescript
// convex/schema.ts

// Core tables
defineTable("agents")
defineTable("memories")
defineTable("relationships")
defineTable("world_state")
defineTable("events")

// Config tables
defineTable("config")
defineTable("archetypes")
```

---

## 2. Table Definitions

### 2.1 Agents Table

```typescript
// TypeScript interface for agents
interface Agent {
  _id: Id<"agents">
  _creationTime: number

  // Identity
  name: string
  archetype: AgentArchetype

  // Position (isometric grid coordinates)
  gridX: number
  gridY: number

  // Visual
  spriteVariant: number // 0-3 for color variants

  // State Machine
  currentAction: AgentAction
  targetX?: number
  targetY?: number

  // Needs (0-100)
  hunger: number
  energy: number
  social: number

  // Core Traits (from reflection)
  coreTraits: string[]

  // Status
  isActive: boolean
  lastActiveAt: number
}

type AgentArchetype = "builder" | "socialite" | "philosopher" | "explorer" | "nurturer"

type AgentAction =
  | "idle"
  | "walking"
  | "eating"
  | "sleeping"
  | "talking"
  | "working"
  | "exploring"
```

### 2.2 Memories Table

```typescript
interface Memory {
  _id: Id<"memories">
  _creationTime: number

  // Ownership
  agentId: Id<"agents">

  // Content
  type: MemoryType
  content: string
  timestamp: number

  // Vector embedding (stored by Convex)
  // embedding: Vector<768>

  // Metadata
  importance: number // 1-10
  tags: string[]
}

type MemoryType =
  | "sensory"     // Recent event (auto-expires)
  | "semantic"    // Long-term fact
  | "reflection"  // Daily summary
  | "interaction" // Conversation log
```

### 2.3 Relationships Table

```typescript
interface Relationship {
  _id: Id<"relationships">
  _creationTime: number

  // Connection
  agentAId: Id<"agents">
  agentBId: Id<"agents">

  // Metrics
  affinity: number // -100 to 100
  interactionsCount: number

  // Last interaction
  lastInteractionAt: number
  lastInteractionType: "positive" | "negative" | "neutral"
}
```

### 2.4 World State Table

```typescript
interface WorldState {
  _id: Id<"world_state">

  // Global state
  weather: Weather
  timeOfDay: number // 0-24 hours
  dayCount: number

  // Tick configuration
  tickIntervalSeconds: number // 60-120

  // Stats
  totalTicks: number
  lastTickAt: number
}

type Weather = "sunny" | "cloudy" | "rainy" | "stormy"
```

### 2.5 Events Table (Sensory Buffer)

```typescript
interface WorldEvent {
  _id: Id<"events">
  _creationTime: number

  // Event data
  type: EventType
  agentId?: Id<"agents">
  targetId?: Id<"agents">

  // Description
  description: string

  // Position (for spatial queries)
  gridX: number
  gridY: number
}

type EventType =
  | "movement"
  | "interaction"
  | "conversation"
  | "need_change"
  | "weather_change"
```

### 2.6 Config Table

```typescript
interface Config {
  _id: Id<"config">

  // Master password (hashed)
  masterPasswordHash: string

  // Tick settings
  defaultTickInterval: number
  enableSleepMode: boolean

  // LLM settings
  llmProvider: "openai" | "anthropic"
  llmModel: string
}
```

### 2.7 Archetypes Table

```typescript
interface Archetype {
  _id: Id<"archetypes">

  // Identity
  name: AgentArchetype

  // Prompt configuration
  basePrompt: string

  // Goal priorities (ordered)
  goalPriorities: string[]

  // Interaction preferences
  interactionStyle: string

  // Speech patterns
  speechPatterns: {
    greeting: string[]
    question: string[]
    statement: string[]
  }

  // Visual
  baseColor: string
}
```

---

## 3. Vector Index Configuration

### 3.1 Memory Index

```typescript
// convex/vector/memoryIndex.ts
import { defineVectorIndex } from "convex/server"

export default defineVectorIndex("memoryIndex", {
  vectorField: "embedding",
  dimensions: 768,
  filterFields: ["agentId", "type", "importance"],
  retry: true
})
```

### 3.2 Vector Search Usage

```typescript
// Searching memories for an agent
const relevantMemories = await ctx.vectorSearch("memoryIndex", {
  query: embedding,
  filter: (entry) => entry("agentId") === agentId,
  k: 3
})
```

---

## 4. TypeScript Utility Types

### 4.1 Agent State Types

```typescript
// Agent with computed fields
type AgentWithRelations = Agent & {
  relationships: Relationship[]
  recentMemories: Memory[]
  currentGoal?: string
}

// Agent decision response from LLM
type AgentDecision = {
  thought: string
  action: AgentAction
  target?: string
  speech?: string
  confidence: number
}

// Interpolated position for rendering
type InterpolatedPosition = {
  x: number
  y: number
  isMoving: boolean
}
```

### 4.2 World Types

```typescript
// Snapshot of world state for rendering
type WorldSnapshot = {
  agents: Agent[]
  weather: Weather
  timeOfDay: number
  dayCount: number
}

// Camera state (URL-synced)
type CameraState = {
  zoom: number
  focusAgentId?: string
  panX: number
  panY: number
}
```

---

## 5. Database Indexes

### 5.1 Required Indexes

```typescript
// Agents indexes
defineIndex("agents_by_archetype", ["archetype"])
defineIndex("agents_by_active", ["isActive"])
defineIndex("agents_by_position", ["gridX", "gridY"])

// Memories indexes
defineIndex("memories_by_agent", ["agentId"])
defineIndex("memories_by_type", ["agentId", "type"])
defineIndex("memories_by_timestamp", ["timestamp"])

// Relationships indexes
defineIndex("relationships_by_agents", ["agentAId", "agentBId"])
defineIndex("relationships_by_affinity", ["affinity"])

// Events indexes
defineIndex("events_by_agent", ["agentId"])
defineIndex("events_by_position", ["gridX", "gridY"])
defineIndex("events_by_time", ["_creationTime"])
```

---

## 6. Migration Strategy

### 6.1 Version 1.0 Schema

```typescript
// Initial schema - no migrations needed for fresh start
export const schema = v.schema({
  agents: v.defineTable(agentsSchema),
  memories: v.defineTable(memoriesSchema),
  relationships: v.defineTable(relationshipsSchema),
  world_state: v.defineTable(worldStateSchema),
  events: v.defineTable(eventsSchema),
  config: v.defineTable(configSchema),
  archetypes: v.defineTable(archetypesSchema),
})
```

### 6.2 Seeding Initial Data

```typescript
// Seed archetypes on first run
const seedArchetypes = async (ctx) => {
  const archetypes = [
    {
      name: "builder",
      basePrompt: "You are organized and detail-oriented...",
      goalPriorities: ["build", "organize", "improve"],
      // ...
    },
    // ... all 5 archetypes
  ]

  for (const archetype of archetypes) {
    await ctx.table("archetypes").insert(archetype)
  }
}
```

---

## 7. Client-Side Types

### 7.1 Query Return Types

```typescript
// What useQuery returns for agents
type AgentsQueryResult = Awaited<ReturnType<typeof agents.getAll>>

// What useQuery returns for single agent
type AgentQueryResult = Awaited<ReturnType<typeof agents.get>>
```

### 7.2 Action Argument Types

```typescript
// Agent mutation arguments
type UpdateAgentPositionArgs = {
  agentId: string
  gridX: number
  gridY: number
}

type CreateAgentArgs = {
  name: string
  archetype: AgentArchetype
  gridX: number
  gridY: number
}

// Master action arguments
type MasterActionArgs = {
  action: "weather" | "spawn" | "restart" | "tick"
  payload?: any
  password: string
}
```

---

## 8. Validation Schemas

### 8.1 Input Validation

```typescript
// Zod schemas for server-side validation
const agentSchema = z.object({
  name: z.string().min(2).max(20),
  archetype: z.enum(["builder", "socialite", "philosopher", "explorer", "nurturer"]),
  gridX: z.number().min(0).max(63),
  gridY: z.number().min(0).max(63),
})

const positionSchema = z.object({
  gridX: z.number().min(0).max(63),
  gridY: z.number().min(0).max(63),
})
```

---

## 9. Real-time Subscription Types

### 9.1 Subscription Return Values

```typescript
// useAction subscriptions return these
type AgentUpdateSubscription = {
  agents: Agent[]  // Array of changed agents
  changes: {
    inserted: Agent[]
    updated: Agent[]
    deleted: Id<"agents">[]
  }
}
```