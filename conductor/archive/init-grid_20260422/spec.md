# Specification: Initialize Project and Render Isometric Game Grid

## Track ID
`init-grid_20260422`

## Description
Initialize the Simulacra project with TanStack Start and render a functional 64x64 isometric game grid using Excalibur.js.

---

## Goals

### Primary Goal
Set up the project foundation and render a working isometric grid that serves as the canvas for the AI agent simulation.

### Secondary Goals
- Initialize TanStack Start project with proper configuration
- Integrate Excalibur.js game engine
- Implement isometric coordinate system
- Add camera controls (pan and zoom)
- Render placeholder agents on the grid

---

## Technical Specification

### Project Setup

#### TanStack Start Configuration
- Initialize TanStack Start project with TypeScript
- Configure Vite for development
- Set up Tailwind CSS integration
- Configure Convex client

#### Dependencies
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

### Isometric Grid System

#### Grid Parameters
| Parameter | Value |
|-----------|-------|
| Grid Width | 64 tiles |
| Grid Height | 64 tiles |
| Total Tiles | 4,096 |
| Tile Width | 32 pixels |
| Tile Height | 16 pixels |

#### Coordinate System
- **Grid Coordinates**: (x, y) where x and y range from 0 to 63
- **Screen Coordinates**: Converted using isometric projection
  - `screenX = (gridX - gridY) * (TILE_WIDTH / 2)`
  - `screenY = (gridX + gridY) * (TILE_HEIGHT / 2)`

#### Tile Rendering
- Each tile rendered as an isometric diamond
- Tiles positioned based on grid coordinates
- Visual differentiation for walkable vs. blocked tiles

### Camera System

#### Pan Controls
- Mouse drag to pan the camera
- Camera stays within grid bounds
- Smooth panning with momentum

#### Zoom Controls
- Mouse wheel to zoom
- Zoom range: 0.5x to 3.0x
- Zoom centered on mouse position
- Smooth zoom transitions (200ms)

### Agent Rendering

#### Placeholder Agents
- Render 5 placeholder agents at random positions
- Each agent displayed as a colored circle (16x16 pixels)
- Name tag floating above each agent
- Smooth movement interpolation (lerp)

#### Agent Data Structure
```typescript
interface PlaceholderAgent {
  id: string
  name: string
  gridX: number
  gridY: number
  color: string
}
```

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
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Thought Stream - Collapsible Sidebar]              │  ← Footer (200px)
└─────────────────────────────────────────────────────────┘
```

### Visual Design
- **Background**: Dark slate (#0f172a)
- **Grid Lines**: Subtle slate-600 (#475569)
- **Tile Fill**: Slate-800 (#1e293b)
- **Agent Colors**: Based on archetype (see product-guidelines.md)

### Interactions
- **Click on tile**: Log tile coordinates (future: select tile)
- **Click on agent**: Open agent detail panel (future)
- **Drag**: Pan camera
- **Scroll**: Zoom in/out

---

## File Structure

```
src/
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx      # Main game canvas component
│   │   ├── IsometricGrid.ts   # Grid renderer
│   │   ├── AgentSprite.ts     # Agent visual component
│   │   └── Camera.ts          # Camera controller
│   ├── ui/
│   │   ├── Header.tsx         # Weather + Master toggle
│   │   └── ThoughtStream.tsx # AI thought sidebar
│   └── index.ts
├── lib/
│   ├── isometric.ts           # Coordinate conversion
│   └── constants.ts           # Grid, tile constants
├── routes/
│   ├── index.tsx              # Main world view (/)
│   └── agent.$id.tsx          # Agent detail (/agent/:id)
├── app.tsx
└── entry-client.tsx
```

---

## Acceptance Criteria

### Project Initialization
- [ ] TanStack Start project runs without errors
- [ ] Development server starts on port 3000
- [ ] Tailwind CSS is properly configured
- [ ] TypeScript compiles without errors

### Isometric Grid
- [ ] 64x64 grid renders correctly
- [ ] Tiles positioned using isometric projection
- [ ] Grid is centered in the viewport
- [ ] Grid lines are visible but subtle

### Camera Controls
- [ ] Camera can pan by dragging
- [ ] Camera stays within grid bounds
- [ ] Zoom works with mouse wheel
- [ ] Zoom range is 0.5x to 3.0x

### Agent Rendering
- [ ] 5 placeholder agents render on grid
- [ ] Agents positioned at grid coordinates
- [ ] Name tags visible above agents
- [ ] Agents move smoothly (lerp)

### Visual Checkpoints
- [ ] Dark theme applied correctly
- [ ] No visual glitches or overlapping
- [ ] Responsive to window resize
- [ ] 60 FPS rendering performance

---

## Dependencies

### Runtime
- react: ^18.2.0
- react-dom: ^18.2.0
- @tanstack/start: ^1.0.0
- convex: ^1.0.0
- excalibur: ^0.30.0
- framer-motion: ^11.0.0
- tailwindcss: ^3.4.0

### Development
- typescript: ^5.3.0
- vite: ^5.0.0
- @types/react: ^18.2.0

---

## Notes

- This track focuses on Phase 1 (The Body) from the SPEC.md
- Placeholder agents will be replaced with full AI agents in later tracks
- Convex integration will be added in Phase 2
- LLM integration will be added in Phase 3