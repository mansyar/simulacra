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
- **Environmental Effects**: Stochastic weather transitions (Sunny, Cloudy, Rainy, Stormy) affecting agent movement speed.

### 2. The Agent System
- **Count**: 10 agents (optimized for free tier AI limits)
- **Visuals**: Sprite-based, 16×16 base size, 4-frame idle animation
- **Name Tags**: Floating above agent, pixel font
- **Movement**: Smooth interpolation between state updates (lerp)
- **Archetypes**: Builder, Socialite, Philosopher, Explorer, Nurturer (10 agents total). Each has unique base prompts and speech patterns.

### 3. The AI Architecture
- **Heartbeat**: Convex Cron every 180 seconds (3 minutes, configurable via `WORLD_TICK_INTERVAL`)
- **Sleep Mode**: Pauses world tick immediately after the 30-second grace period with no active users (enabled via `ENABLE_SLEEP_MODE=true`)
- **Memory Tiers**:
  1. Sensory Buffer: Last 10 events (Convex table)
  2. Semantic Memory: Long-term facts (Convex Vector Index)
  3. Reflection: Daily summary → Core Traits
- **Decision Logic**:
  - Deterministic: Hunger → Food, Sleep → Bed (Safety Layer overrides)
  - Generative: Social interactions (LLM-based)
- **Decision Schema**:
  - `thought`: Internal reasoning
  - `action`: Current intent
  - `target`: Interaction target or location
  - `speech`: Spoken dialogue
  - `confidence`: Decision certainty
- **Rate Limit Handling**: Exponential backoff retry (up to 3 attempts) with graceful fallback to mock responses

### 4. User Roles
| Role | Permissions |
|------|-------------|
| **Observer** | Watch world, click agents to view details |
| **Master** | Manual ticks, Manual reflection, Agent brain resets, Weather control |

### 5. Persistence
- World state persists indefinitely
- Master key required for world restart (password-protected)
- All agent memories and relationships persist across sessions

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
- **Feedback**: Speech bubbles with backgrounds and action emojis.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | TanStack Start (Beta/RC) |
| Backend/Database | Convex (Real-time + Vector Search) |
| Game Engine | Excalibur.js (Custom isometric renderer) |
| AI Integration | Groq API (`llama-3.1-8b-instant`) via OpenAI-compatible endpoint |
| Styling | Tailwind CSS + Framer Motion |
| Vector Search | Convex Vector Index (768 dimensions) |

### AI Configuration
- **Provider**: Groq (free tier)
- **Model**: `llama-3.1-8b-instant`
- **Rate Limits**: 30 req/min, 14.4K req/day, 500K tokens/day
- **Optimization**: 6 agents, 180s tick interval, sleep mode enabled

---

## Phases

### Phase 1 - The Body
- TanStack Start project initializes and runs
- Excalibur canvas renders 64×64 isometric grid
- Camera can pan and zoom
- Placeholder agents render on grid
- Agents move smoothly (interpolated)

### Phase 2 - The Heart [COMPLETE: 2026-04-25]
- Convex schema deployed with `agents` and `world_state` tables
- Real-time sync functional via `useQuery`
- Agent positions and needs persist to database
- World state management (Weather, Time, Day count) implemented
- Integrated WorldHUD for real-time state display

### Phase 3 - The Brain [COMPLETE: 2026-04-25]
- Provider-agnostic LLM integration via Convex Actions (Configurable via database)
- Vector index configured for memory storage
- Agents make decisions based on memory
- Sensory buffer stores recent events

### Phase 4 - The Social [COMPLETE: 2026-04-25]
- Proximity detection (Euclidean distance)
- Chat interactions trigger when agents are near
- Relationship tracking (likes/dislikes)
- Thought stream displays agent thoughts
- Cognitive Loop: Reflection and Memory RAG context.

### Phase 5 - The Polish
- [x] **Track A: Quick Fixes** [COMPLETE: 2026-04-27]
  - Configurable interaction radius (database-driven)
  - Relationship valence history (last 5 interactions)
  - Polished World Intro Overlay with cozy animations
  - Cleaned up home route boilerplate
- Master panel with password protection (Upcoming)
- Weather control functional
- Item spawning works
- World restart with confirmation
- Deploy to Vercel/Netlify

### Phase 6 - Fluid Movement [COMPLETE: 2026-04-27]
- Integrated Simplex Noise for organic idle behaviors.
- Implemented time-synced predictive pathing for continuous movement.
- Smooth 500ms course correction for backend state synchronization.

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
- **Token Usage**: 432K tokens/day (86% of 500K daily limit)
- **Request Usage**: 2,880 requests/day (20% of 14.4K daily limit)
- Lazy LLM: Only call when agents are within interaction radius
- Context pruning: Vector search retrieves only relevant memories
- Sleep mode: Pause crons when no active observers are present (immediately after 30s grace period)
- Rate limit handling: Exponential backoff retry with graceful fallback to mock responses

---

## Out of Scope (v1.0)
- Multi-player simultaneous control
- Complex item crafting
- Agent reproduction/birth
- Map editing tools
- Mobile responsive (desktop-first)
- Audio/sound effects
- Production deployment (sticking to development tier for now)