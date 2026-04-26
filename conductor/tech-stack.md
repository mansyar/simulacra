# Technology Stack: Simulacra

## Overview

This document defines the technology stack for the Simulacra project - an autonomous AI "Ant Farm" virtual world.

---

## Core Technologies

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack Start | Beta/RC | Full-stack React framework with nested routing |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |

### Backend & Database
| Technology | Version | Purpose |
|------------|---------|---------|
| Convex | Latest | Real-time database with vector search |
| Convex Actions | Latest | Server-side logic and AI integration |
| Convex Cron | Latest | Scheduled world ticks |
| Convex Config Table | - | Decoupled provider-agnostic AI configuration |

### Game Engine
| Technology | Version | Purpose |
|------------|---------|---------|
| PixiJS | 8.x | GPU-accelerated 2D rendering engine |

### AI Integration
| Technology | Version | Purpose |
|------------|---------|---------|
| OpenAI-compatible API | - | LLM for agent decision-making |
| Default Provider | Groq | llama-3.1-8b-instant (Free tier optimized) |

### Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | Latest | Utility-first CSS framework |
| Framer Motion | Latest | Animations for UI overlays |
| Lucide React | Latest | Icon library for UI elements |

### Vector Search
| Technology | Version | Purpose |
|------------|---------|---------|
| Convex Vector Index | Latest | 768-dimensional semantic memory storage |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| Husky | 9.x | Git hook management for pre-commit and pre-push |
| ESLint | 10.x | Code linting and static analysis |
| Vitest | 3.x | Unit testing framework with coverage |
| TypeScript | 5.x | Type checking (tsc --noEmit) |
| Custom Scripts | - | File line count validation (max 500 lines) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (TanStack Start)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  GameCanvas  │  │ ThoughtStream│  │    God Mode Panel     │  │
│  │   (PixiJS)   │  │   (Sidebar)  │  │  (Weather/Ticks)      │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ useQuery/useMutation
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONvex (Backend)                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Tables     │  │   Actions    │  │    Vector Index       │  │
│  │  - agents   │  │ - worldTick   │  │  - memoryIndex        │  │
│  │  - events   │  │ - aiDecision  │  │                       │  │
│  │  - memories │  │ - weather     │  │                       │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              OpenAI-Compatible API                         │   │
│  │         (Kimi K2.6, qwen-9b, GPT-4o-mini, etc.)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
simulacra/
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── GameCanvas.tsx      # PixiJS game canvas
│   │   │   ├── IsometricGrid.ts   # PixiJS Graphics grid
│   │   │   ├── AgentSprite.ts     # Agent visual component
│   │   │   ├── POISprite.ts       # Fixed location component
│   │   │   └── Camera.ts          # Pan/zoom controller
│   │   ├── ui/
│   │   │   ├── Header.tsx          # Weather + Master toggle
│   │   │   ├── GlobalThoughtStream.tsx # AI thought sidebar
│   │   │   ├── AdminPanel.tsx     # God-mode controls
│   │   │   └── WorldHUD.tsx       # Top-left status
│   │   └── index.ts
│   ├── convex/
│   │   ├── admin.ts               # God-mode triggers
│   │   ├── ai_helpers.ts          # Core LLM/Embedding logic
│   │   ├── schema.ts              # Convex table definitions
│   │   ├── agents.ts              # Agent CRUD operations
│   │   ├── world.ts               # World tick logic
│   │   ├── ai.ts                  # High-level agent brain logic
│   │   └── memory.ts              # Memory system
│   ├── lib/
│   │   ├── isometric.ts           # Iso coords conversion
│   │   └── server-functions.ts    # TanStack Start server fns
│   ├── routes/
│   │   ├── index.tsx              # Main world view (/)
│   │   ├── about.tsx              # Project info
│   │   └── __root.tsx             # Root layout
├── convex/
│   └── convex.json                 # Convex configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Dependencies

### Production Dependencies
```json
{
  "@tanstack/start": "^1.0.0",
  "convex": "^1.0.0",
  "pixi.js": "^8.0.0",
  "framer-motion": "^11.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "tailwindcss": "^3.4.0",
  "simplex-noise": "^4.0.0",
  "alea": "^1.0.0"
}
```

### Development Dependencies
```json
{
  "@types/react": "^18.2.0",
  "typescript": "^5.3.0",
  "vite": "^5.0.0"
}
```

---

## Configuration

### Environment Variables
```env
# Convex
CONVEX_DEPLOYMENT=
CONVEX_SECRET_KEY=

# AI API (OpenAI-compatible)
OPENAI_API_KEY=your-api-key
OPENAI_API_BASE_URL=https://your-api-endpoint.com/v1
OPENAI_MODEL=kimi-k2.6
```

### Convex Configuration (convex.json)
```json
{
  "node": "18",
  "generators": {
    "typescript": "1.0.0"
  }
}
```

---

## API Integration

### OpenAI-Compatible Implementation

The AI integration is implemented in `convex/functions/ai.ts` using `fetch` to remain provider-agnostic. Configuration is stored in the `config` table in Convex, allowing for dynamic provider and model switching. Each agent can also override the global model via its `model` field.

The implementation supports any OpenAI-compatible API endpoint. Models used include:

- **Kimi K2.6** - High performance
- **qwen-9b** - Efficient
- **GPT-4o-mini** - Balanced

---

## Performance Considerations

### Rendering
- 60 FPS target for game canvas
- Use PixiJS GPU-accelerated rendering
- Implement viewport culling for grid lines

### Database
- Convex handles real-time sync automatically
- Vector search with 768-dimensional embeddings
- Lazy LLM calls to reduce API costs

### Cost Optimization
- Only call LLM when agents within interaction radius
- Context pruning via vector similarity search
- Sleep mode: pause crons when no active users are present (with 30s grace period)
