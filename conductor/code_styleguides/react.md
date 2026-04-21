# React Style Guide

## Overview

This guide establishes coding conventions for React components in the Simulacra project.

---

## Component Structure

### Functional Components
```tsx
// Preferred: Functional components with hooks
export function AgentDetail({ agentId }: AgentDetailProps) {
  const agent = useQuery(api.agents.get, { agentId })
  const mutation = useMutation(api.agents.update)

  // Early return for loading states
  if (!agent) {
    return <Skeleton />
  }

  return (
    <div className="agent-detail">
      <AgentSprite agent={agent} />
      <ThoughtStream agentId={agentId} />
    </div>
  )
}
```

### Component Organization
1. Imports (external, then internal)
2. Type definitions
3. Component function
4. Export

---

## Hooks Usage

### useQuery (TanStack Start)
```tsx
// Prefer destructured query results
const agents = useQuery(api.agents.list)
const agent = useQuery(api.agents.get, { agentId: id })

// Handle loading states
if (agents === undefined) {
  return <LoadingSpinner />
}
```

### useMutation
```tsx
const updateAgent = useMutation(api.agents.update)

// Optimistic updates when possible
const handleMove = (targetX: number, targetY: number) => {
  updateAgent({ agentId, targetX, targetY })
}
```

---

## State Management

### Local State
```tsx
// Use useState for simple local state
const [isExpanded, setIsExpanded] = useState(false)
const [zoom, setZoom] = useState(1)
```

### Server State
```tsx
// Use TanStack queries for server state
// Prefer useQuery/useMutation over useState for API data
```

---

## Rendering Patterns

### Conditional Rendering
```tsx
// Prefer early returns over ternary operators for complex conditions
if (isLoading) {
  return <LoadingSpinner />
}

if (error) {
  return <ErrorMessage error={error} />
}

return <AgentList agents={agents} />
```

### Lists
```tsx
// Always provide keys, prefer stable IDs
{agents.map((agent) => (
  <AgentCard key={agent._id} agent={agent} />
))}
```

---

## Event Handlers

### Naming
```tsx
// Preferred: handle* prefix for event handlers
const handleClick = () => { ... }
const handleAgentSelect = (agentId: string) => { ... }
```

### Async Handlers
```tsx
const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    await submitForm(data)
  } catch (error) {
    handleError(error)
  }
}
```

---

## Props Interface

### Define Explicitly
```tsx
interface AgentCardProps {
  agent: Agent
  onSelect?: (agentId: string) => void
  isSelected?: boolean
}

export function AgentCard({ agent, onSelect, isSelected }: AgentCardProps) {
  // ...
}
```

---

## File Naming

- **Components**: PascalCase (`AgentCard.tsx`, `ThoughtStream.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAgentData.ts`)
- **Utilities**: camelCase (`formatCoordinate.ts`)
- **Types**: PascalCase (`AgentTypes.ts`)

---

## Imports

### Order
```tsx
// 1. React/Next imports
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'

// 2. External libraries
import { motion } from 'framer-motion'

// 3. Internal imports (relative)
import { AgentSprite } from '@/components/game/AgentSprite'
import { useAgentStore } from '@/stores/agent'

// 4. Type imports
import type { Agent } from '@/convex/schema'
```

---

## Performance

### Memoization
```tsx
// Memoize expensive computations
const expensiveValue = useMemo(
  () => computeExpensiveValue(a, b),
  [a, b]
)

// Memoize callbacks passed to children
const handleClick = useCallback(
  (id: string) => setSelected(id),
  [setSelected]
)
```

### Component Splitting
```tsx
// Split large components into smaller, focused pieces
// Each component should have a single responsibility
export function GameCanvas() {
  return (
    <div>
      <IsometricGrid />
      <AgentLayer />
      <CameraController />
    </div>
  )
}
```