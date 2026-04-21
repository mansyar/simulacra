# ISOMETRIC.md - Rendering Engine

## 1. Isometric Projection Fundamentals

### 1.1 Coordinate Systems

```
CARTESIAN (Grid)              ISOMETRIC (Screen)
                                   
   y                           
   ↑                          
  63 ┌──┬──┬──┬──┐           Top cornermost tiles
   │  │  │  │  │              (63,0) (63,1)
   ├──┼──┼──┼──┤                  ▲  ▲
   │  │  │  │  │                 ╱  ╲
   ├──┼──┼──┼──┤                ╱    ╲
   │  │  │  │  │               ╱      ╲
   ├──┼──┼──┼──┤              ▼        ▼
   │  │  │  │  │          Left       Right
   └──┴──┴──┴──┘► x         edge      edge
   0                 63

   (0,0) = Bottom corner of grid
```

### 1.2 Conversion Formulas

```typescript
// Tile dimensions
const TILE_WIDTH = 32    // pixels
const TILE_HEIGHT = 16  // pixels (half of width for 2:1 ratio)

// Grid to Screen (Cartesian → Isometric)
const gridToScreen = (gridX: number, gridY: number): { x: number, y: number } => {
  const screenX = (gridX - gridY) * (TILE_WIDTH / 2)
  const screenY = (gridX + gridY) * (TILE_HEIGHT / 2)
  return { x: screenX, y: screenY }
}

// Screen to Grid (Isometric → Cartesian)
const screenToGrid = (screenX: number, screenY: number): { x: number, y: number } => {
  const gridX = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2
  const gridY = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2
  return { x: Math.round(gridX), y: Math.round(gridY) }
}
```

### 1.3 Center Offset

```typescript
// The grid needs to be centered on the canvas
const GRID_CENTER_OFFSET = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 4  // Start higher to show more of the grid
}

const worldToScreen = (gridX: number, gridY: number): { x: number, y: number } => {
  const iso = gridToScreen(gridX, gridY)
  return {
    x: iso.x + GRID_CENTER_OFFSET.x,
    y: iso.y + GRID_CENTER_OFFSET.y
  }
}
```

---

## 2. Tile Rendering

### 2.1 Tile Structure

```typescript
interface Tile {
  gridX: number
  gridY: number
  type: TileType
  variant: number
  hasAgent: boolean
}

type TileType = 
  | "grass"
  | "path"
  | "water"
  | "flower"
  | "tree"
  | "rock"
  | "building"
```

### 2.2 Rendering Order (Painter's Algorithm)

```typescript
// Tiles must be rendered back-to-front for correct overlap
const renderOrder = (gridX: number, gridY: number): number => {
  return gridX + gridY  // Sum determines draw order
}

// Sort tiles before rendering
const sortedTiles = tiles.sort((a, b) => 
  renderOrder(a.gridX, a.gridY) - renderOrder(b.gridX, b.gridY)
)
```

### 2.3 Tile Drawing Function

```typescript
const drawTile = (ctx: CanvasRenderingContext2D, x: number, y: number, type: TileType) => {
  const tileColors: Record<TileType, string> = {
    grass: "#4a7c59",
    path: "#c9b896",
    water: "#5b8fa8",
    flower: "#d4a5a5",
    tree: "#2d5a3d",
    rock: "#808080",
    building: "#8b7355"
  }

  ctx.fillStyle = tileColors[type]
  
  // Draw isometric diamond
  ctx.beginPath()
  ctx.moveTo(x, y)                      // Top
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2)  // Right
  ctx.lineTo(x, y + TILE_HEIGHT)        // Bottom
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2) // Left
  ctx.closePath()
  ctx.fill()

  // Draw edge highlights for depth
  ctx.strokeStyle = "rgba(0,0,0,0.1)"
  ctx.stroke()
}
```

---

## 3. Agent Rendering

### 3.1 Agent Sprite Specifications

```typescript
interface AgentSprite {
  baseSize: number       // 16 pixels
  scale: number          // 2x for visibility = 32px
  idleFrames: number     // 4 frames
  frameDuration: number  // 500ms per frame
}

const AGENT_SPRITE = {
  baseSize: 16,
  scale: 2,
  idleFrames: 4,
  frameDuration: 500,
  colorVariants: [
    "#e74c3c", // Red
    "#3498db", // Blue  
    "#2ecc71", // Green
    "#f39c12"  // Orange
  ]
}
```

### 3.2 Agent Position on Tile

```typescript
const getAgentScreenPosition = (
  gridX: number, 
  gridY: number, 
  animOffset: number = 0
): { x: number, y: number } => {
  const tileCenter = worldToScreen(gridX, gridY)
  
  return {
    x: tileCenter.x,
    y: tileCenter.y - TILE_HEIGHT - 8 + animOffset // Stand on top of tile, minus bounce
  }
}
```

### 3.3 Idle Animation

```typescript
const animateAgent = (
  ctx: CanvasRenderingContext2D,
  agent: Agent,
  time: number
) => {
  // Bounce animation
  const frame = Math.floor(time / AGENT_SPRITE.frameDuration) % AGENT_SPRITE.idleFrames
  const bounceOffset = Math.sin(frame * Math.PI / 2) * 3

  const pos = getAgentScreenPosition(agent.gridX, agent.gridY, bounceOffset)

  // Draw agent sprite
  ctx.fillStyle = AGENT_SPRITE.colorVariants[agent.spriteVariant]
  
  // Simple pixel agent (square with rounded top)
  const size = AGENT_SPRITE.baseSize * AGENT_SPRITE.scale
  ctx.fillRect(pos.x - size / 2, pos.y - size, size, size)

  // Draw name tag
  drawNameTag(ctx, agent.name, pos.x, pos.y - size - 12)
}

const drawNameTag = (ctx: CanvasRenderingContext2D, name: string, x: number, y: number) => {
  ctx.fillStyle = "#ffffff"
  ctx.font = "10px VT323, monospace"
  ctx.textAlign = "center"
  ctx.fillText(name, x, y)
}
```

---

## 4. Camera System

### 4.1 Camera State

```typescript
interface Camera {
  zoom: number           // 0.5 to 3.0
  panX: number           // offset from center
  panY: number
  focusAgentId?: string
}

const DEFAULT_CAMERA: Camera = {
  zoom: 1,
  panX: 0,
  panY: 0
}
```

### 4.2 Camera Controls

```typescript
const applyCamera = (
  ctx: CanvasRenderingContext2D,
  camera: Camera
) => {
  ctx.save()
  ctx.translate(
    CANVAS_WIDTH / 2 + camera.panX,
    CANVAS_HEIGHT / 2 + camera.panY
  )
  ctx.scale(camera.zoom, camera.zoom)
}

const handleZoom = (delta: number, camera: Camera): Camera => {
  const newZoom = Math.max(0.5, Math.min(3.0, camera.zoom + delta * 0.1))
  return { ...camera, zoom: newZoom }
}

const handlePan = (dx: number, dy: number, camera: Camera): Camera => {
  return {
    ...camera,
    panX: camera.panX + dx,
    panY: camera.panY + dy
  }
}
```

### 4.3 Focus on Agent

```typescript
const focusOnAgent = (agent: Agent, camera: Camera): Camera => {
  const screenPos = worldToScreen(agent.gridX, agent.gridY)
  
  return {
    ...camera,
    panX: -screenPos.x,
    panY: -screenPos.y,
    focusAgentId: agent._id
  }
}
```

---

## 5. Grid Generation

### 5.1 Generate World Grid

```typescript
const generateWorldGrid = (size: number = 64): Tile[][] => {
  const grid: Tile[][] = []

  for (let y = 0; y < size; y++) {
    const row: Tile[] = []
    for (let x = 0; x < size; x++) {
      row.push({
        gridX: x,
        gridY: y,
        type: determineTileType(x, y),
        variant: Math.floor(Math.random() * 4),
        hasAgent: false
      })
    }
    grid.push(row)
  }

  return grid
}

const determineTileType = (x: number, y: number): TileType => {
  // Simple procedural generation
  const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1)
  
  if (noise > 0.5) return "tree"
  if (noise > 0.3) return "grass"
  if (noise > 0.1) return "path"
  if (noise < -0.3) return "water"
  return "grass"
}
```

---

## 6. Excalibur.js Integration

### 6.1 Engine Setup

```typescript
import { Engine, Scene, Vector } from "excalibur"

const createGameEngine = (canvas: HTMLCanvasElement) => {
  const engine = new Engine({
    canvas,
    width: canvas.width,
    height: canvas.height,
    pixelArt: true,  // Important for pixel art rendering
    antialias: false
  })

  return engine
}
```

### 6.2 Custom Isometric Scene

```typescript
import { Actor, Scene, Color } from "excalibur"

class IsometricScene extends Scene {
  private tiles: Tile[][] = []
  private agents: AgentActor[] = []

  onInitialize(engine: Engine) {
    this.tiles = generateWorldGrid()
    this.generateTileActors()
  }

  private generateTileActors() {
    for (let y = 0; y < this.tiles.length; y++) {
      for (let x = 0; x < this.tiles[y].length; x++) {
        const tile = this.tiles[y][x]
        const screenPos = worldToScreen(x, y)

        const tileActor = new Actor({
          x: screenPos.x,
          y: screenPos.y,
          width: TILE_WIDTH,
          height: TILE_HEIGHT
        })

        this.add(tileActor)
      }
    }
  }

  update(engine: Engine, delta: number) {
    super.update(engine, delta)
    this.updateAgents(delta)
  }

  private updateAgents(delta: number) {
    for (const agentActor of this.agents) {
      agentActor.updatePosition(delta)
    }
  }
}
```

### 6.3 AgentActor Class

```typescript
import { Actor, Vector } from "excalibur"

class AgentActor extends Actor {
  private lastKnownPosition: Vector
  private targetPosition: Vector
  private lerpSpeed: number = 5

  constructor(
    private agentData: Agent,
    private onPositionUpdate: (x: number, y: number) => void
  ) {
    const screenPos = worldToScreen(agentData.gridX, agentData.gridY)
    super({
      x: screenPos.x,
      y: screenPos.y,
      width: AGENT_SPRITE.baseSize * AGENT_SPRITE.scale,
      height: AGENT_SPRITE.baseSize * AGENT_SPRITE.scale
    })

    this.lastKnownPosition = new Vector(screenPos.x, screenPos.y)
    this.targetPosition = this.lastKnownPosition.clone()
  }

  setTarget(gridX: number, gridY: number) {
    const screenPos = worldToScreen(gridX, gridY)
    this.targetPosition = new Vector(screenPos.x, screenPos.y)
  }

  updatePosition(delta: number) {
    if (this.pos.equals(this.targetPosition)) return

    // Lerp towards target
    const direction = this.targetPosition.sub(this.pos)
    const distance = direction.magnitude()

    if (distance < 1) {
      this.pos = this.targetPosition.clone()
      this.onPositionUpdate(
        Math.round(this.targetPosition.x),
        Math.round(this.targetPosition.y)
      )
      return
    }

    const moveAmount = this.lerpSpeed * (delta / 1000)
    const normalized = direction.normalize()
    this.pos = this.pos.add(normalized.scale(moveAmount))
  }

  draw(ctx: CanvasRenderingContext2D, delta: number) {
    // Custom draw for pixel art agent
    const color = AGENT_SPRITE.colorVariants[this.agentData.spriteVariant]
    ctx.fillStyle = color
    
    const size = AGENT_SPRITE.baseSize * AGENT_SPRITE.scale
    ctx.fillRect(
      this.pos.x - size / 2,
      this.pos.y - size,
      size,
      size
    )

    // Name tag
    ctx.fillStyle = "#fff"
    ctx.font = "10px monospace"
    ctx.textAlign = "center"
    ctx.fillText(this.agentData.name, this.pos.x, this.pos.y - size - 4)
  }
}
```

---

## 7. Interpolation System

### 7.1 Smooth Movement

```typescript
interface InterpolatedAgent {
  _id: string
  currentX: number
  currentY: number
  targetX: number
  targetY: number
  lastUpdate: number
}

const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor
}

const updateInterpolation = (
  agents: InterpolatedAgent[],
  delta: number
): InterpolatedAgent[] => {
  return agents.map(agent => {
    if (agent.currentX === agent.targetX && agent.currentY === agent.targetY) {
      return agent
    }

    const timeSinceUpdate = Date.now() - agent.lastUpdate
    const expectedDuration = 1000 // 1 second for full movement
    const progress = Math.min(1, timeSinceUpdate / expectedDuration)

    return {
      ...agent,
      currentX: lerp(agent.currentX, agent.targetX, progress),
      currentY: lerp(agent.currentY, agent.targetY, progress)
    }
  })
}
```

---

## 8. Click Detection

### 8.1 Click to Agent

```typescript
const handleCanvasClick = (
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  camera: Camera,
  agents: Agent[]
): Agent | null => {
  const rect = canvas.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  // Reverse camera transform
  const worldX = (clickX - CANVAS_WIDTH / 2 - camera.panX) / camera.zoom
  const worldY = (clickY - CANVAS_HEIGHT / 2 - camera.panY) / camera.zoom

  // Convert to grid coordinates
  const gridPos = screenToGrid(worldX, worldY)

  // Find agent at this position
  return agents.find(agent => 
    agent.gridX === gridPos.x && agent.gridY === gridPos.y
  ) || null
}
```

---

## 9. Performance Optimization

### 9.1 Viewport Culling

```typescript
const isTileVisible = (
  gridX: number,
  gridY: number,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number
): boolean => {
  const screenPos = worldToScreen(gridX, gridY)
  
  // Apply camera transform
  const transformedX = screenPos.x * camera.zoom + CANVAS_WIDTH / 2 + camera.panX
  const transformedY = screenPos.y * camera.zoom + CANVAS_HEIGHT / 2 + camera.panY

  return (
    transformedX > -TILE_WIDTH &&
    transformedX < viewportWidth + TILE_WIDTH &&
    transformedY > -TILE_HEIGHT &&
    transformedY < viewportHeight + TILE_HEIGHT
  )
}

const renderVisibleTiles = (tiles: Tile[][], camera: Camera) => {
  const visibleTiles: Tile[] = []

  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (isTileVisible(x, y, camera, CANVAS_WIDTH, CANVAS_HEIGHT)) {
        visibleTiles.push(tiles[y][x])
      }
    }
  }

  return visibleTiles
}
```

---

## 10. Visual Style Guide

### 10.1 Color Palette

```typescript
const WORLD_PALETTE = {
  // Tiles
  grass: "#4a7c59",
  grassLight: "#5d9c6e",
  grassDark: "#3a5c45",
  
  path: "#c9b896",
  pathLight: "#dcc9a8",
  pathDark: "#b8a57a",
  
  water: "#5b8fa8",
  waterLight: "#7ab0c8",
  waterDark: "#3d6e87",
  
  // Environment
  sky: "#87ceeb",
  skyNight: "#1a1a2e",
  
  // UI
  uiBackground: "rgba(0, 0, 0, 0.7)",
  uiText: "#ffffff",
  uiAccent: "#f4d03f"
}
```

### 10.2 Agent Color Variants

```typescript
const AGENT_COLORS = {
  variants: [
    { name: "Coral", primary: "#e74c3c", accent: "#c0392b" },
    { name: "Ocean", primary: "#3498db", accent: "#2980b9" },
    { name: "Forest", primary: "#2ecc71", accent: "#27ae60" },
    { name: "Sunset", primary: "#f39c12", accent: "#d68910" }
  ]
}
```