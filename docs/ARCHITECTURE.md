# ARCHITECTURE.md - System Architecture

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SIMULACRA ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐         ┌─────────────────────────────────┐    │
│   │              │         │                                 │    │
│   │   CLIENT     │◄───────►│           CONVEX                │    │
│   │  (TanStack   │  Real-  │    ┌─────────┐  ┌───────────┐   │    │
│   │   Start +    │  time   │    │ Database │  │  Vector   │   │    │
│   │  Excalibur) │  sync   │    │ (Tables) │  │   Index   │   │    │
│   │              │         │    └─────────┘  └───────────┘   │    │
│   └──────────────┘         └─────────────────────────────────┘    │
│          │                          │                               │
│          │                          │ Actions                       │
│          ▼                          ▼                               │
│   ┌──────────────┐         ┌─────────────────────────────────┐    │
│   │  Excalibur   │         │        LLM PROVIDER             │    │
│   │    Canvas    │         │  (OpenAI / Anthropic Claude)    │    │
│   └──────────────┘         └─────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow Model

### 2.1 The Four-Step Flow

```
Step 1: MUTATION          Step 2: REACTIVITY          Step 3: SYNCHRONIZATION      Step 4: INTERPOLATION
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Cron Job or    │       │  TanStack       │       │  GameWorld      │       │  Excalibur      │
│  User Action    │──────►│  useQuery       │──────►│  detects       │──────►│  Actor          │
│  updates agents │       │  receives       │       │  data change   │       │  lerps to       │
│  table in       │       │  updated agent  │       │  and updates   │       │  target coords  │
│  Convex         │       │  array          │       │  Actor target  │       │  smoothly       │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

### 2.2 Detailed Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           WORLD TICK SEQUENCE                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CONVEX CRON TRIGGERS (every 60-120s)                                   │
│     │                                                                        │
│     ▼                                                                        │
│  2. FETCH ALL AGENTS                                                        │
│     ├── For each agent:                                                     │
│     │   ├── Check deterministic needs (hunger, sleep)                       │
│     │   └── If social window open:                                          │
│     │       ├── Calculate distances to nearby agents                        │
│     │       ├── If within radius: call LLM for decision                     │
│     │       └── Update agent state                                          │
│     │                                                                        │
│     ▼                                                                        │
│  3. VECTOR SEARCH (for LLM agents)                                         │
│     ├── Embed current context query                                         │
│     ├── Search semantic memory index                                       │
│     └── Return top-K relevant memories                                      │
│                                                                             │
│     ▼                                                                        │
│  4. LLM DECISION                                                            │
│     ├── Build prompt with:                                                  │
│     │   ├── Agent personality                                              │
│     │   ├── Current goal                                                   │
│     │   └── Retrieved memories                                             │
│     ├── Call LLM API                                                        │
│     └── Parse JSON response                                                 │
│                                                                             │
│     ▼                                                                        │
│  5. MUTATE CONVEX TABLE                                                     │
│     ├── Update agent position (if walking)                                 │
│     │   Update current_action                                               │
│     │   Store event in sensory buffer                                      │
│     │   If significant: store in vector index                             │
│     │   Update relationships                                               │
│     │                                                                        │
│     ▼                                                                        │
│  6. REALTIME PUSH TO CLIENTS                                               │
│     └── All connected clients receive update via Convex subscription       │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### 3.1 Client Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      TANSTACK START APP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  routes/                                                         │
│  ├── _index.tsx          ← Global world view (main canvas)      │
│  ├── agent.$id.tsx      ← Agent detail overlay                  │
│  └── layout.tsx         ← Root layout with header/footer        │
│                                                                  │
│  components/                                                     │
│  ├── GameWorld/                                                 │
│  │   ├── GameCanvas.tsx       ← Excalibur integration          │
│  │   ├── IsometricRenderer.ts ← Custom iso grid                 │
│  │   ├── AgentSprite.tsx      ← Individual agent rendering     │
│  │   └── CameraController.ts  ← Pan/zoom management            │
│  │                                                              │
│  ├── UI/                                                        │
│  │   ├── Header.tsx            ← Weather, Master toggle         │
│  │   ├── MasterPanel.tsx      ← Password-protected controls    │
│  │   ├── ThoughtStream.tsx    ← Real-time AI log sidebar       │
│  │   └── AgentDetail.tsx       ← Side panel for /agent/:id      │
│  │                                                              │
│  └── hooks/                                                     │
│      ├── useGameState.ts        ← Convex query hooks            │
│      ├── useAgentInterpolation.ts ← Smooth movement             │
│      └── useCamera.ts           ← Zoom/pan state                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Backend (Convex) Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         CONVEX BACKEND                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  convex/                                                        │
│  ├── schema.ts                 ← Table definitions             │
│  │   ├── agents                                                 │
│  │   ├── memories                                              │
│  │   ├── relationships                                         │
│  │   └── world_state                                           │
│  │                                                              │
│  ├── functions/                                                 │
│  │   ├── agents.ts            ← CRUD for agents                 │
│  │   ├── memory.ts           ← Vector search & storage          │
│  │   ├── world.ts            ← World state management          │
│  │   ├── ai.ts               ← LLM integration                 │
│  │   └── master.ts           ← Admin actions                   │
│  │                                                              │
│  ├── crons/                                                     │
│  │   └── worldTick.ts         ← Heartbeat job                  │
│  │                                                              │
│  └── vector/                                                    │
│      └── memoryIndex.ts       ← Vector index config             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. External Integrations

### 4.1 LLM Provider Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                     LLM INTEGRATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Convex Action (ai.ts)                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Validate agent exists                                 │  │
│  │  2. Retrieve personality config                          │  │
│  │  3. Vector search for relevant memories                  │  │
│  │  4. Build prompt from template                           │  │
│  │  5. Call OpenAI/Anthropic API                            │  │
│  │  6. Parse JSON response                                  │  │
│  │  7. Update agent state                                   │  │
│  │  8. Log to sensory buffer                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  Cost Optimization:                                             │
│  - Skip if agent is idle/ sleeping                              │
│  - Only call when within interaction radius                    │
│  - Limit context to top-3 relevant memories                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 API Configuration

| Service | Config Location | Environment Variables |
|---------|-----------------|----------------------|
| Convex | `convex.json` | `CONVEX_DEPLOY_KEY` |
| OpenAI | Convex secrets | `OPENAI_API_KEY` |
| Anthropic | Convex secrets | `ANTHROPIC_API_KEY` |

---

## 5. State Management

### 5.1 Server State (Convex)

- **Source of Truth:** Convex database tables
- **Real-time Sync:** TanStack Query subscribes to changes
- **Mutation:** Only through Convex functions (no direct DB access)

### 5.2 Client State

| State Type | Tool | Purpose |
|------------|------|---------|
| Game Data | TanStack Query | Agent positions, world state |
| UI State | React useState | Panel open/close, modals |
| Camera | React useState + URL | Zoom level, focused agent |

### 5.3 URL Synchronization

```
URL Search Params:
  ?zoom=1.5           → Camera zoom level
  ?focus=agent_123   → Center camera on agent
  ?panel=master      → Open master panel

Parsing in component:
  const searchParams = useSearchParams()
  const zoom = searchParams.get('zoom') || 1
  const focus = searchParams.get('focus')
```

---

## 6. Security Architecture

### 6.1 Authentication Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Observer Mode:                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Visit site  │───►│ Anonymous  │───►│ Full read   │         │
│  │ (no login)  │    │ (Convex)   │    │ access      │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
│  Master Mode:                                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Click       │───►│ Password   │───►│ Full read   │         │
│  │ "Master"   │    │ prompt     │    │ + write     │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
│  Password check happens client-side for UI unlock               │
│  All mutations validated server-side                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Master Actions (Server-Side Validation)

```typescript
// All master actions validate password hash
const masterActions = {
  changeWeather: internalMutation({
    args: { weather: string, passwordHash: string },
    handler: async (ctx, { weather, passwordHash }) => {
      const stored = await ctx.table('config').get('master')
      if (!bcrypt.compare(passwordHash, stored.passwordHash)) {
        throw new Error('Unauthorized')
      }
      await ctx.table('world_state').update('global', { weather })
    }
  }),

  restartWorld: internalMutation({
    args: { passwordHash: string },
    handler: async (ctx, { passwordHash }) => {
      const stored = await ctx.table('config').get('master')
      if (!bcrypt.compare(passwordHash, stored.passwordHash)) {
        throw new Error('Unauthorized')
      }
      // Reset all agent positions, clear temp memories
    }
  })
}
```

---

## 7. Performance Architecture

### 7.1 Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    RENDER OPTIMIZATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CANVAS LAYER                                                │
│     - Single Excalibur canvas (not DOM elements for tiles)     │
│     - Only re-render changed tiles                             │
│     - Use sprite batching for agents                           │
│                                                                  │
│  2. INTERPOLATION                                               │
│     - Store: lastKnownPosition, targetPosition                 │
│     - Lerp factor: (now - lastUpdate) / (targetUpdate - now)   │
│     - Smooth 60fps even with 1s server update interval          │
│                                                                  │
│  3. SPATIAL PARTITIONING (future)                               │
│     - Quadtree for agent lookup                                 │
│     - Only process nearby agents for proximity                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Cost Optimization Strategies

| Strategy | Implementation | Savings |
|----------|---------------|---------|
| Lazy LLM | Only call when proximity threshold met | ~70% fewer calls |
| Context Pruning | Vector search returns top-3, not all | ~50% token reduction |
| Sleep Mode | Cron checks active user count first | Night hours free |
| Caching | Cache LLM responses for repeated scenarios | Varies |

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Development:                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Local dev   │───►│ `npx convex  │───►│ localhost   │         │
│  │ (Vite)      │    │ dev`        │    │ (3000)      │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
│  Production:                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Git push    │───►│ Vercel      │───►│ Production  │         │
│  │ to main     │    │ deploy      │    │ URL         │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                │                                      │
│         ▼                ▼                                      │
│  ┌─────────────┐    ┌─────────────┐                              │
│  │ `npx convex │───►│ Convex      │                              │
│  │ deploy`     │    │ Cloud       │                              │
│  └─────────────┘    └─────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```