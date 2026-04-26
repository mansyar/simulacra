# Design 6: Isometric Cozy Observatory

## Overview

A hybrid design combining **isometric 3D perspective** with a **cozy, warm aesthetic**, featuring a traditional 3-panel layout with collapsible bottom controls.

**Inspiration:** Stardew Valley + Isometric UI + Warm color palette

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header (warm gradient)                                 │
├─────────────────────┬───────────────┬───────────────────┤
│                     │               │                   │
│  Left Panel         │  Game Canvas  │  Right Panel      │
│  (Agent Status)     │  (Isometric)  │  (Thought Stream) │
│  220px fixed        │  Flexible     │  240px fixed      │
│                     │               │                   │
├─────────────────────┴───────────────┴───────────────────┤
│  Bottom Control Panel (collapsible, icons only)         │
└─────────────────────────────────────────────────────────┘
```

---

## Features

### ✅ 3-Panel Layout
- **Left:** Agent status with inline expandable details
- **Center:** Isometric game canvas with pan/zoom
- **Right:** Thought stream with event feed

### ✅ Isometric 3D Perspective
- Subtle 2-3° angle on panels for depth
- Depth-based shadows
- Hover lift effects

### ✅ Warm Color Palette
- Primary: Warm cream (#E8D5B7)
- Secondary: Chocolate (#D2691E)
- Cool accents for needs (blue/green)

### ✅ Collapsible Bottom Panel
- Always visible control bar
- Collapse to icons only (Option B)
- Hover to show labels temporarily (Option A)

### ✅ Agent Details
- Click agent name to expand inline
- Multiple agents can be expanded simultaneously
- Color-coded needs bars

### ✅ Pan & Zoom
- Drag to pan camera
- Scroll to zoom (0.5x - 3x)
- Zoom level indicator

---

## Interactions

### Agent Status (Left Panel)
- **Click name:** Expand/collapse needs details
- **Hover:** Highlight row
- **Needs bars:** Color-coded (orange=hunger, blue=energy, green=social)

### Game Canvas (Center)
- **Drag:** Pan camera
- **Scroll:** Zoom in/out
- **Click agent:** Focus on agent

### Thought Stream (Right Panel)
- **Scroll:** Navigate events
- **Click event:** Highlight and focus

### Bottom Controls
- **Click ▼/▲:** Collapse/expand panel
- **Hover when collapsed:** Show labels temporarily
- **Buttons:** Manual Tick, Reset World, Config

---

## Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Primary | Warm Cream | #E8D5B7 |
| Secondary | Chocolate | #D2691E |
| Accent 1 | Goldenrod | #B8860B |
| Accent 2 | Sky Blue | #87CEEB |
| Accent 3 | Soft Green | #90EE90 |
| Background | Light Cream | #FDF6E3 |
| Text Dark | Dark Brown | #5D4037 |
| Text Light | Warm Gray | #8B7355 |

---

## Technical Details

### 3D Isometric Transforms
```css
/* Left Panel */
transform: perspective(1000px) rotateY(2deg);

/* Right Panel */
transform: perspective(1000px) rotateY(-2deg);

/* Game Canvas */
transform: perspective(1000px) rotateX(3deg);
```

### JavaScript Functions
- `toggleAgent()` - Expand/collapse agent details
- `toggleBottomPanel()` - Collapse/expand control panel
- `manualTick()` - Advance simulation
- `resetWorld()` - Reset world state
- `openConfig()` - Open settings

### Pan & Zoom Implementation
- Mouse wheel for zoom (0.5x - 3x range)
- Click and drag for panning
- Transform applied to SVG grid

---

## Files

- `index.html` - Complete single-file implementation
- `README.md` - This documentation

---

## Usage

```bash
# Open directly
start design-6-isometric-cozy\index.html

# Or via local server
python -m http.server 8000
# Navigate to: http://localhost:8000/ui-design/design-6-isometric-cozy/
```

---

## Specifications Met

- ✅ 3-panel layout with isometric 3D perspective
- ✅ Warm color palette with cool accents
- ✅ Agent status panel with inline expand/collapse
- ✅ Thought stream on right side
- ✅ Collapsible bottom control panel (icons only when collapsed)
- ✅ Hover shows labels temporarily when collapsed
- ✅ Multiple agents can be expanded simultaneously
- ✅ Pan and zoom on game canvas
- ✅ All UI components present and functional
- ✅ Subtle animations and transitions
- ✅ Cozy, warm aesthetic throughout

---

**Design by:** Simulacra UI Team  
**Date:** April 27, 2026  
**Status:** ✅ Complete
