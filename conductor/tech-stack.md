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

### Game Engine
| Technology | Version | Purpose |
|------------|---------|---------|
| Excalibur.js | Latest | TypeScript-first 2D game engine |

### AI Integration
| Technology | Version | Purpose |
|------------|---------|---------|
| OpenAI-compatible API | - | LLM for agent decision-making |
| Available Models | - | GLM 5.1, Kimi K2.6, qwen-9b, kimi k2.5 lightning, etc. |

### Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | Latest | Utility-first CSS framework |
| Framer Motion | Latest | Animations for UI overlays |

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
│  │  GameCanvas  │  │ ThoughtStream│  │    Master Panel       │  │
│  │ (Excalibur)  │  │   (Sidebar)  │  │  (Weather/Spawn)     │  │
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
│  │         (GLM 5.1, Kimi K2.6, qwen-9b, etc.)              │   │
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
│   │   │   ├── GameCanvas.tsx      # Excalibur game canvas
│   │   │   ├── IsometricGrid.ts   # 64x64 grid renderer
│   │   │   ├── AgentSprite.ts     # Agent visual component
│   │   │   └── Camera.ts          # Pan/zoom controller
│   │   ├── ui/
│   │   │   ├── Header.tsx          # Weather + Master toggle
│   │   │   ├── ThoughtStream.tsx  # AI thought sidebar
│   │   │   ├── MasterPanel.tsx    # God-mode controls
│   │   │   └── AgentDetail.tsx    # Agent overlay
│   │   └── index.ts
│   ├── convex/
│   │   ├── schema.ts               # Convex table definitions
│   │   ├── agents.ts              # Agent CRUD operations
│   │   ├── world.ts               # World tick logic
│   │   ├── ai.ts                  # LLM integration
│   │   └── memories.ts            # Memory system
│   ├── lib/
│   │   ├── isometric.ts           # Iso coords conversion
│   │   ├── ai-client.ts           # OpenAI-compatible API client
│   │   └── constants.ts           # Grid, tile, camera constants
│   ├── routes/
│   │   ├── index.tsx              # Main world view (/)
│   │   └── agent.$id.tsx          # Agent detail (/agent/:id)
│   ├── app.tsx                    # Root app component
│   └── entry-client.tsx           # Client entry point
├── convex/
│   └── convex.json                 # Convex configuration
├── public/
│   └── sprites/                    # Agent sprite assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## Dependencies

### Production Dependencies
```json
{
  "@tanstack/start": "^1.0.0",
  "convex": "^1.0.0",
  "excalibur": "^0.30.0",
  "framer-motion": "^11.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "tailwindcss": "^3.4.0"
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
AI_API_BASE_URL=https://your-api-endpoint.com/v1
AI_API_KEY=your-api-key
AI_DEFAULT_MODEL=kimi-k2.6
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

### OpenAI-Compatible Client

The AI integration uses an OpenAI-compatible API endpoint. The client supports multiple models:

- **GLM 5.1** - General purpose
- **Kimi K2.6** - High performance
- **qwen-9b** - Efficient
- **Kimi K2.5 Lightning** - Fast responses

```typescript
// lib/ai-client.ts
import OpenAI from 'openai'

const aiClient = new OpenAI({
  baseURL: process.env.AI_API_BASE_URL,
  apiKey: process.env.AI_API_KEY,
  defaultQuery: {
    model: process.env.AI_DEFAULT_MODEL || 'kimi-k2.6'
  }
})

export async function generateAgentDecision(prompt: string) {
  const response = await aiClient.chat.completions.create({
    model: process.env.AI_DEFAULT_MODEL || 'kimi-k2.6',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  })

  return JSON.parse(response.choices[0].message.content)
}
```

---

## Performance Considerations

### Rendering
- 60 FPS target for game canvas
- Use Excalibur's built-in sprite batching
- Implement viewport culling for off-screen tiles

### Database
- Convex handles real-time sync automatically
- Vector search with 768-dimensional embeddings
- Lazy LLM calls to reduce API costs

### Cost Optimization
- Only call LLM when agents within interaction radius
- Context pruning via vector similarity search
- Sleep mode: pause crons after 30 min inactive