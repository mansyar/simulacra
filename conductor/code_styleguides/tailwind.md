# Tailwind CSS Style Guide

## Overview

This guide establishes Tailwind CSS conventions for the Simulacra project.

---

## Configuration

### Theme Extension
```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Custom colors for Simulacra
      colors: {
        'simulacra': {
          'forest': '#228B22',
          'brown': '#8B4513',
          'sky': '#87CEEB',
          'sand': '#F4A460',
        },
        // Agent archetype colors
        'agent': {
          'builder': '#8B4513',
          'socialite': '#FF69B4',
          'philosopher': '#9370DB',
          'explorer': '#228B22',
          'nurturer': '#FFA07A',
        }
      },
      // Custom fonts
      fontFamily: {
        'pixel': ['VT323', 'monospace'],
      },
      // Custom spacing
      spacing: {
        'grid': '32px',
        'tile-w': '32px',
        'tile-h': '16px',
      },
    },
  },
  plugins: [],
}
```

---

## Class Organization

### Order Classes Logically
```tsx
// Recommended order:
// 1. Layout (position, display, flex, grid)
// 2. Sizing (width, height, min/max)
// 3. Spacing (margin, padding)
// 4. Visual (colors, borders, shadows)
// 5. Typography (font, text)
// 6. States (hover, focus, active)
// 7. Animation/Transition

<div className="
  relative flex flex-col
  w-64 h-96
  p-4 gap-2
  bg-slate-800 border-2 border-slate-600 rounded-lg
  text-white font-pixel
  hover:bg-slate-700
  transition-colors duration-200
">
```

---

## Responsive Design

### Mobile-First Approach
```tsx
// Mobile base, tablet/mdesktop overrides
<div className="
  w-full md:w-64        // Full width mobile, fixed desktop
  p-2 md:p-4            // Smaller padding mobile
  text-sm md:text-base  // Smaller text mobile
">
```

### Breakpoints
```typescript
// Default Tailwind breakpoints
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

---

## Component Patterns

### Buttons
```tsx
// Primary button
<button className="
  px-4 py-2
  bg-simulacra-forest hover:bg-simulacra-forest/80
  text-white font-pixel text-lg
  rounded
  transition-colors duration-200
">
  Start World
</button>

// Secondary button
<button className="
  px-4 py-2
  bg-transparent border-2 border-simulacra-brown
  text-simulacra-brown hover:bg-simulacra-brown/10
  font-pixel text-lg
  rounded
  transition-colors duration-200
">
  Cancel
</button>
```

### Cards
```tsx
<div className="
  bg-slate-800
  border-2 border-slate-600
  rounded-lg
  p-4
  hover:border-slate-500
  transition-colors duration-200
">
  {/* Card content */}
</div>
```

### Agent Sprite Container
```tsx
<div className="
  relative
  w-8 h-8
  flex items-center justify-center
">
  <div className="
    absolute
    -top-6
    text-xs font-pixel
    text-white
    bg-black/50 px-1 rounded
  ">
    {agentName}
  </div>
  {/* Sprite */}
</div>
```

---

## Isometric Grid

### Tile Classes
```tsx
// Isometric tile
<div className="
  w-tile-w h-tile-h
  bg-simulacra-sand
  border border-slate-600/30
  hover:bg-simulacra-forest/20
  cursor-pointer
  transition-colors duration-150
">
```

### Grid Container
```tsx
<div className="
  grid
  grid-cols-[repeat(64,32px)]
  grid-rows-[repeat(64,16px)]
  -translate-y-8
">
  {/* Tiles */}
</div>
```

---

## Animations

### Using Framer Motion with Tailwind
```tsx
<motion.div
  className="..."
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
/>
```

### Tailwind Transitions
```tsx
// Simple transitions
<div className="
  transition-all duration-300
  hover:scale-105 hover:shadow-lg
">
```

---

## State Variants

### Hover States
```tsx
<button className="
  bg-simulacra-forest
  hover:bg-simulacra-forest/80
  active:bg-simulacra-forest/60
">
```

### Focus States
```tsx
<input className="
  bg-slate-800
  focus:outline-none focus:ring-2 focus:ring-simulacra-sky
" />
```

---

## Typography

### Pixel Font
```tsx
<span className="font-pixel text-lg text-white">
  Agent Name
</span>
```

### Responsive Text
```tsx
<p className="text-sm md:text-base lg:text-lg">
  Description text
</p>
```

---

## Layout Patterns

### Full Screen Layout
```tsx
<div className="
  h-screen w-screen
  flex flex-col
  bg-slate-900
">
  <Header className="h-12 flex-shrink-0" />
  <main className="flex-1 overflow-hidden">
    <GameCanvas />
  </main>
  <Footer className="h-[200px] flex-shrink-0" />
</div>
```

### Sidebar Layout
```tsx
<div className="
  flex
  h-full
">
  <div className="flex-1">
    <GameCanvas />
  </div>
  <aside className="
    w-64
    bg-slate-800
    border-l border-slate-600
    overflow-y-auto
  ">
    <ThoughtStream />
  </aside>
</div>
```

---

## Best Practices

### Avoid Arbitrary Values
```tsx
// Avoid
<div className="w-[123px]">

// Prefer
<div className="w-32">  // or add to config
```

### Use Semantic Colors
```tsx
// Good
<div className="bg-agent-builder">

// Avoid
<div className="bg-[#8B4513]">
```

### Composable Utility Classes
```tsx
// Create reusable components instead of repeating classes
function AgentCard({ agent }) {
  return (
    <div className="agent-card">  // Use CSS module or component
      {/* ... */}
    </div>
  )
}

// Or use @apply in custom CSS for complex patterns
@layer components {
  .agent-card {
    @apply bg-slate-800 border-2 border-slate-600 rounded-lg p-4;
  }
}
```

---

## Accessibility

### Focus Management
```tsx
<button className="
  focus:outline-none focus:ring-2 focus:ring-simulacra-sky focus:ring-offset-2 focus:ring-offset-slate-900
">
```

### Color Contrast
```tsx
// Ensure text is readable
<p className="text-slate-200 bg-slate-800">
  {/* Good contrast */}
</p>
```