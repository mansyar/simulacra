# Product Guidelines: Simulacra

## 1. Design Principles

### 1.1 Visual Aesthetic
- **Style**: 16-bit isometric pixel art (Stardew Valley-inspired)
- **Palette**: Earthy tones - forest green, warm brown, sky blue
- **Font**: Pixel-style (VT323 or similar)
- **Animations**: Subtle bounce on agent idle, smooth pan/zoom

### 1.2 Color System
| Role | Color | Hex |
|------|-------|-----|
| Primary Background | Forest Green | #228B22 |
| Secondary Background | Warm Brown | #8B4513 |
| Accent | Sky Blue | #87CEEB |
| Text Primary | Dark Charcoal | #1a1a1a |
| Text Secondary | Warm Gray | #6b6b6b |

### 1.3 Agent Color Coding
Based on archetype from AI-PROMPTING.md:
- **Builder**: #8B4513 (Saddle Brown)
- **Socialite**: #FF69B4 (Hot Pink)
- **Philosopher**: #9370DB (Medium Purple)
- **Explorer**: #228B22 (Forest Green)
- **Nurturer**: #FFA07A (Light Salmon)

---

## 2. User Experience Guidelines

### 2.1 Layout Principles
- **Header** (48px): Weather icon + Master panel toggle
- **Main Viewport**: Full remaining height for game canvas
- **Footer** (200px): Collapsible thought stream sidebar

### 2.2 Interaction Patterns
- **Click agent**: Opens agent detail overlay (side panel)
- **URL sync**: Camera state synced via query params (`?zoom=1.5&focus=agent_123`)
- **Pan/Zoom**: Mouse drag to pan, scroll to zoom (0.5x - 3x)

### 2.3 Animations
- Smooth interpolation for agent movement (lerp)
- Subtle bounce on agent idle (4-frame animation)
- Smooth pan/zoom transitions

---

## 3. AI/Agent System Guidelines

### 3.1 Agent Archetypes
Follow the five archetypes defined in AI-PROMPTING.md:
1. **Builder** - Organized, productive, detail-oriented
2. **Socialite** - Friendly, curious, love talking
3. **Philosopher** - Thoughtful, introspective, wise
4. **Explorer** - Adventurous, restless, curious
5. **Nurturer** - Caring, protective, generous

### 3.2 LLM Response Schema
All LLM responses must follow this JSON structure:
```json
{
  "thought": "Internal monologue describing reasoning",
  "action": "idle | walk_to | talk_to | work | explore | eat | sleep",
  "target": "Target agent ID or location",
  "speech": "What the agent says (if talking)",
  "confidence": 0.0 - 1.0
}
```

### 3.3 Memory System
- **Tier 1 (Sensory Buffer)**: Last 10 events - Convex table
- **Tier 2 (Semantic Memory)**: Long-term facts - Convex Vector Index (768 dimensions)
- **Tier 3 (Reflection)**: Daily summary → Core Traits

### 3.4 Decision Logic
- **Deterministic**: Hunger → Food, Sleep → Bed (code-based)
- **Generative**: Social interactions (LLM-based)

---

## 4. Technical Conventions

### 4.1 Coordinate System
- **Grid**: 64×64 isometric tile map (4,096 tiles)
- **Tile Size**: 32×16 pixels (isometric diamond)
- **Conversion**: Iso coordinates (x, y) ↔ Screen coordinates

### 4.2 Performance Targets
- 60 FPS rendering target
- < 100ms latency for state updates
- Max 50 agents without spatial partitioning

### 4.3 Cost Optimization
- **Lazy LLM**: Only call when agents within interaction radius
- **Context pruning**: Vector search retrieves only relevant memories
- **Sleep mode**: Pause crons after 30 minutes of inactivity (30-second grace period for real-time presence)

---

## 5. Security Guidelines

### 5.1 Authentication
- Master password hashed (bcrypt)
- No sensitive data in client-side code
- Convex auth configured for production

### 5.2 Data Protection
- Agent memories persist across sessions
- World state persists indefinitely
- Master key required for world restart

---

## 6. Content Guidelines

### 6.1 Prose Style
- **Tone**: Warm, cozy, inviting
- **Documentation**: Clear, technical but accessible
- **Code Comments**: Explain "why", not "what"

### 6.2 Naming Conventions
- **Files**: kebab-case (e.g., `agent-actor.ts`)
- **Components**: PascalCase (e.g., `GameCanvas.tsx`)
- **Functions**: camelCase (e.g., `calculateDistance`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `TILE_SIZE`)

### 6.3 Error Handling
- Graceful degradation for network issues
- User-friendly error messages
- Logging for debugging

---

## 7. Out of Scope (v1.0)
- Multi-player simultaneous control
- Complex item crafting
- Agent reproduction/birth
- Map editing tools
- Mobile responsive (desktop-first)
- Audio/sound effects