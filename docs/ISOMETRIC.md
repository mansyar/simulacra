# ISOMETRIC.md - Rendering Engine (PixiJS v8)

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

We use a standard 2:1 isometric ratio (32x16 pixels).

```typescript
// Tile dimensions
export const TILE_WIDTH = 32
export const TILE_HEIGHT = 16

/**
 * Grid to Screen (Cartesian → Isometric)
 * @param gridX - Grid x coordinate
 * @param gridY - Grid y coordinate
 * @returns { x, y } in screen space
 */
export const gridToScreen = (gridX: number, gridY: number) => {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2)
  }
}

/**
 * Screen to Grid (Isometric → Cartesian)
 * @param screenX - Screen x coordinate
 * @param screenY - Screen y coordinate
 * @returns { x, y } in grid space
 */
export const screenToGrid = (screenX: number, screenY: number) => {
  const gridX = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2
  const gridY = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2
  return { x: Math.round(gridX), y: Math.round(gridY) }
}
```

---

## 2. PixiJS Rendering Architecture

### 2.1 Stage Structure

The PixiJS stage is organized into layers (Containers) with specific z-indexes for proper depth sorting.

```
Stage
├── gridContainer (Z: 1)       ← IsometricGrid (Static Graphics)
├── poiContainer (Z: 10)       ← POISprite (Labels & Indicators)
└── agentContainer (Z: 11)     ← AgentSprite (Animated Objects)
```

### 2.2 Depth Sorting (Painter's Algorithm)

Depth sorting is handled by PixiJS `sortableChildren` and `zIndex`. For agents, depth is determined by their Y position on the grid.

---

## 3. Grid Rendering & Culling

### 3.1 IsometricGrid Component

The `IsometricGrid` uses PixiJS `Graphics` to draw a 64x64 grid. To maintain performance, we implement **Viewport Culling**.

```typescript
/**
 * Viewport Culling logic
 * Only draws tiles/lines within the current camera view.
 */
cull(viewport: { left: number, top: number, right: number, bottom: number }) {
  // 1. Calculate bounding box of grid coordinates currently visible
  // 2. Clear and Redraw only those lines
}
```

---

## 4. Agent Sprite System

### 4.1 AgentSprite Component

Each agent is a PixiJS `Container` containing multiple children:
- **Shadow**: Subtle ellipse at base.
- **Body**: Colored Graphics primitive (Circle/Star based on archetype).
- **Label**: PixiJS `Text` for name.
- **Emoji**: PixiJS `Text` for current action.
- **Speech Bubble**: `Container` with `Graphics` background and `Text`.

### 4.2 Interpolation (Lerp)

Smooth movement is achieved by interpolating between the current sprite position and the target grid coordinates during the `ticker` loop.

```typescript
tick(delta: number) {
  // Smoothly move towards target screen position
  this.position.x += (targetScreenX - this.position.x) * 0.1 * delta;
  this.position.y += (targetScreenY - this.position.y) * 0.1 * delta;
}
```

---

## 5. Camera & Control System

### 5.1 CameraController

The camera manages the `stage` transform directly (position and scale).

```typescript
// Zoom handling
handleZoom(deltaY: number, mouseX: number, mouseY: number) {
  const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
  // Scale stage around mouse position
}

// Pan handling
handlePan(newX: number, newY: number) {
  this.stage.position.set(newX, newY);
}
```

---

## 6. Visual Style Guide

### 6.1 Archetype Color Mapping

| Archetype | Color | Hex |
|-----------|-------|-----|
| Builder | Saddle Brown | #8B4513 |
| Socialite | Hot Pink | #FF69B4 |
| Philosopher | Medium Purple | #9370DB |
| Explorer | Forest Green | #228B22 |
| Nurturer | Light Salmon | #FFA07A |

### 6.2 Rendering Constants

- **Grid Size**: 64x64 tiles
- **Tile Ratio**: 2:1 (Width:Height)
- **Base Tile Offset**: Centered at `(64 * 32) / 2`
- **Target FPS**: 60
