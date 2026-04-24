# Product Definition: Simulacra

## Initial Concept

**Simulacra** is an autonomous AI "Ant Farm" - a persistent virtual world where AI agents live, work, and socialize. Users observe through a "Cozy Observer" isometric pixel-art interface.

---

## Project Overview

### Core Vision
- Real-time state synchronization across all connected clients
- Autonomous AI agents with memory, goals, and social relationships
- 16-bit isometric aesthetic (Stardew Valley-inspired)
- Master key for critical interventions, observer mode for casual users

### Target Users
- **Observers**: Casual users who want to watch AI agents live their virtual lives
- **Masters**: Power users who want to intervene in the world (weather control, spawn items, force events)

---

## Functional Requirements

### 1. The World Engine
- **Grid**: 64×64 isometric tile map (4,096 tiles)
- **Tile Size**: 32×16 pixels (isometric diamond)
- **Coordinate System**: Iso coordinates (x, y) ↔ Screen coordinates conversion
- **Camera**: Centered on world, zoomable (0.5x - 3x), pan via drag
- **Background**: Procedural sky gradient (day/night cycle optional)

### 2. The Agent System
- **Count**: 25-50 agents (MVP target)
- **Visuals**: Sprite-based, 16×16 base size, 4-frame idle animation
- **Name Tags**: Floating above agent, pixel font
- **Movement**: Smooth interpolation between state updates (lerp)

### 3. The AI Architecture
- **Heartbeat**: Convex Cron every 60-120 seconds (configurable)
- **Memory Tiers**:
  1. Sensory Buffer: Last 10 events (Convex table)
  2. Semantic Memory: Long-term facts (Convex Vector Index)
  3. Reflection: Daily summary → Core Traits
- **Decision Logic**:
  - Deterministic: Hunger → Food, Sleep → Bed (code-based)
  - Generative: Social interactions (LLM-based)

### 4. User Roles
| Role | Permissions |
|------|-------------|
| **Observer** | Watch world, click agents to view details |
| **Master** | Weather control, spawn items, force events, world restart |

### 5. Persistence
- World state persists indefinitely
- Master key required for world restart (password-protected)
- All agent memories persist across sessions

---

## UI/UX Specification

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Weather Icon]              [Master Panel Toggle]   │  ← Header (48px)
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   GAME CANVAS                           │  ← Main Viewport
│                 (Full remaining height)                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Thought Stream - Collapsible Sidebar]              │  ← Footer (200px)
└─────────────────────────────────────────────────────────┘
```

### Routes
| Path | Description |
|------|-------------|
| `/` | Full world view |
| `/agent/:id` | Agent detail overlay (side panel) |
| `?zoom=1.5&focus=agent_123` | URL-synced camera state |

### Visual Design
- **Palette**: Earthy tones (forest green, warm brown, sky blue)
- **Font**: Pixel-style (VT323 or similar)
- **Animations**: Subtle bounce on agent idle, smooth pan/zoom

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | TanStack Start (Beta/RC) |
| Backend/Database | Convex (Real-time + Vector Search) |
| Game Engine | Excalibur.js (Custom isometric renderer) |
| AI Integration | OpenAI GPT-4o-mini or Claude 3.5 Haiku |
| Styling | Tailwind CSS + Framer Motion |
| Vector Search | Convex Vector Index (768 dimensions) |

---

## Phases

### Phase 1 - The Body
- TanStack Start project initializes and runs
- Excalibur canvas renders 64×64 isometric grid
- Camera can pan and zoom
- Placeholder agents render on grid
- Agents move smoothly (interpolated)

### Phase 2 - The Heart [COMPLETE]
- Convex schema deployed with `agents` and `world_state` tables
- Real-time sync functional via `useQuery`
- Agent positions and needs persist to database
- World state management (Weather, Time, Day count) implemented
- Integrated WorldHUD for real-time state display

### Phase 3 - The Brain
- LLM integration via Convex Actions
- Vector index configured for memory storage
- Agents make decisions based on memory
- Sensory buffer stores recent events

### Phase 4 - The Social
- Proximity detection (Euclidean distance)
- Chat interactions trigger when agents are near
- Relationship tracking (likes/dislikes)
- Thought stream displays agent thoughts

### Phase 5 - The Polish
- Master panel with password protection
- Weather control functional
- Item spawning works
- World restart with confirmation
- Deploy to Vercel/Netlify

---

## Non-Functional Requirements

### Performance
- 60 FPS rendering target for game canvas
- < 100ms latency for state updates (Convex handles this)
- Max 50 agents without spatial partitioning

### Security
- Master password hashed (bcrypt)
- No sensitive data in client-side code
- Convex auth configured for production

### Cost Optimization
- Lazy LLM: Only call when agents are within interaction radius
- Context pruning: Vector search retrieves only relevant memories
- Sleep mode: Pause crons after 30 min of no active users

---

## Out of Scope (v1.0)
- Multi-player simultaneous control
- Complex item crafting
- Agent reproduction/birth
- Map editing tools
- Mobile responsive (desktop-first)
- Audio/sound effects