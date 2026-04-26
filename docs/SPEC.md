# SPEC.md - Simulacra Technical Specification

## 1. Project Overview

**Simulacra** is an autonomous AI "Ant Farm" - a persistent virtual world where AI agents live, work, and socialize. Users observe through a "Cozy Observer" isometric pixel-art interface.

### 1.1 Core Vision
- Real-time state synchronization across all connected clients
- Autonomous AI agents with memory, goals, and social relationships
- 16-bit isometric aesthetic (Stardew Valley-inspired)
- Master key for critical interventions, observer mode for casual users

### 1.2 Tech Stack Confirmed
| Layer | Technology |
|-------|------------|
| Frontend | TanStack Start (Beta/RC) |
| Backend/Database | Convex (Real-time + Vector Search) |
| Game Engine | PixiJS v8 (GPU-accelerated 2D) |
| AI Integration | Groq API (`llama-3.1-8b-instant`) |
| Styling | Tailwind CSS + Framer Motion |
| Vector Search | Convex Vector Index (768 dimensions) |

---

## 2. Feature Specification

### 2.1 World Engine
- **Grid:** 64×64 isometric tile map (4,096 tiles)
- **Tile Size:** 32×16 pixels (isometric diamond)
- **Coordinate System:** Iso coordinates (x, y) ↔ Screen coordinates conversion
- **Camera:** Centered on world, zoomable (0.5x - 3x), pan via drag
- **Viewport Culling:** Only render visible grid lines for performance
- **Background:** Procedural sky gradient (day/night cycle optional)

### 2.2 Agent System
- **Count:** 25-50 agents (MVP target)
- **Visuals:** Sprite-based, 16×16 base size, 4-frame idle animation
- **Name Tags:** Floating above agent, pixel font
- **Movement:** Smooth interpolation between state updates (lerp)

### 2.3 AI Architecture
- **Heartbeat:** Convex Cron every 60-120 seconds (configurable)
- **Memory Tiers:**
  1. Sensory Buffer: Last 10 events (Convex table)
  2. Semantic Memory: Long-term facts (Convex Vector Index)
  3. Reflection: Daily summary → Core Traits
- **Decision Logic:**
  - Deterministic: Hunger → Food, Sleep → Bed (code-based)
  - Generative: Social interactions (LLM-based)

### 2.4 User Roles
| Role | Permissions |
|------|-------------|
| **Observer** | Watch world, click agents to view details |
| **Master** | Weather control, spawn items, force events, world restart |

### 2.5 Persistence
- World state persists indefinitely
- Master key required for world restart (password-protected)
- All agent memories persist across sessions

---

## 3. UI/UX Specification

### 3.1 Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Weather Icon]              [Master Panel Toggle]   │  ← Header (48px)
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│                   GAME CANVAS                           │  ← Main Viewport
│                 (Full remaining height)                 │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Thought Stream - Collapsible Sidebar]              │  ← Footer (200px)
└─────────────────────────────────────────────────────────┘
```

### 3.2 Routes
| Path | Description |
|------|-------------|
| `/` | Full world view |
| `/agent/:id` | Agent detail overlay (side panel) |
| `?zoom=1.5&focus=agent_123` | URL-synced camera state |

### 3.3 Visual Design
- **Palette:** Earthy tones (forest green, warm brown, sky blue)
- **Font:** Pixel-style (VT323 or similar)
- **Animations:** Subtle bounce on agent idle, smooth pan/zoom

### 3.4 Master Panel
- Password-protected modal
- Controls: Weather, Spawn Item, Force Tick, Restart World

---

## 4. Acceptance Criteria

### 4.1 Phase 1 - The Body
- [ ] TanStack Start project initializes and runs
- [ ] Excalibur canvas renders 64×64 isometric grid
- [ ] Camera can pan and zoom
- [ ] Placeholder agents render on grid
- [ ] Agents move smoothly (interpolated)

### 4.2 Phase 2 - The Heart
- [ ] Convex schema deployed with agents table
- [ ] Real-time sync works (open two tabs, see updates)
- [ ] Agent positions persist to database
- [ ] Basic CRUD operations functional

### 4.3 Phase 3 - The Brain
- [ ] LLM integration via Convex Actions
- [ ] Vector index configured for memory storage
- [ ] Agents make decisions based on memory
- [ ] Sensory buffer stores recent events

### 4.4 Phase 4 - The Eyes (Rendering Migration)
- [x] Remove Excalibur.js dependency
- [x] Implement PixiJS v8 Application
- [x] Rewrite IsometricGrid with viewport culling
- [x] Migrate Agent and POI sprites to PixiJS Containers
- [x] Implement smooth interpolation in PixiJS ticker
- [x] Fix Thought Stream logging for survival states

### 4.5 Phase 5 - The Polish
- [ ] Master panel with password protection
- [ ] Weather control functional
- [ ] Item spawning works
- [ ] World restart with confirmation
- [ ] Deploy to Vercel/Netlify

---

## 5. Non-Functional Requirements

### 5.1 Performance
- 60 FPS rendering target for game canvas
- < 100ms latency for state updates (Convex handles this)
- Max 50 agents without spatial partitioning

### 5.2 Security
- Master password hashed (bcrypt)
- No sensitive data in client-side code
- Convex auth configured for production

### 5.3 Cost Optimization
- Lazy LLM: Only call when agents are within interaction radius
- Context pruning: Vector search retrieves only relevant memories
- Sleep mode: Pause crons immediately after the 30s grace period with no active users

---

## 6. Out of Scope (v1.0)

- Multi-player simultaneous control
- Complex item crafting
- Agent reproduction/birth
- Map editing tools
- Mobile responsive (desktop-first)
- Audio/sound effects