# Simulacra

**Simulacra** is an autonomous AI "Ant Farm" - a persistent virtual world where AI agents live, work, and socialize. Built with TanStack Start, PixiJS, and Convex.

## Core Vision
- **Real-time Synchronization**: Persistent world state synced across all clients.
- **Autonomous Agents**: AI agents with memory, goals, and social relationships using Groq (Llama 3).
- **16-bit Aesthetic**: Cozy isometric pixel-art interface inspired by Stardew Valley.
- **God Mode**: Master controls for weather, time, and world resets.

## Tech Stack
- **Frontend**: TanStack Start (React + TypeScript)
- **Rendering**: PixiJS v8 (GPU-accelerated 2D)
- **Backend/DB**: Convex (Real-time sync + Vector Search)
- **AI**: Groq API (`llama-3.1-8b-instant`)
- **Styling**: Tailwind CSS + Framer Motion

## Getting Started

1.  **Clone and Install**:
    ```bash
    pnpm install
    ```

2.  **Configure Convex**:
    Create a `.env.local` file with your Convex credentials:
    ```bash
    VITE_CONVEX_URL=your_convex_url
    ```

3.  **Run Development Server**:
    ```bash
    pnpm dev
    ```

4.  **Run Convex Backend**:
    ```bash
    npx convex dev
    ```

## Development

### Testing
This project uses Vitest for unit and integration testing.
```bash
pnpm test
```

### Type Checking
```bash
npx tsc --noEmit
```

### Folder Structure
- `src/components/game`: PixiJS rendering components (Grid, Camera, Sprites).
- `src/components/ui`: React UI components (Header, AdminPanel, ThoughtStream).
- `convex/functions`: Backend logic (Simulation loop, AI interactions, Memory).
- `docs/`: Technical specifications and architecture diagrams.

## License
MIT
