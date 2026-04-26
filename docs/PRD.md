# PRODUCT REQUIREMENTS DOCUMENT: SIMULACRA (2026)

## 1. PROJECT OVERVIEW
**Simulacra** is an autonomous AI "Ant Farm" designed to demonstrate high-performance real-time state synchronization and agentic AI architecture. It features a persistent world where AI agents live, work, and socialize, visualized through a "Cozy Observer" isometric pixel-art lens.

---

## 2. CORE TECH STACK
- **Frontend Framework:** TanStack Start (Beta/RC)
- **Backend/Database:** Convex (Real-time, Vector-enabled)
- **Game Engine:** PixiJS v8 (GPU-accelerated 2D)
- **AI Integration:** Groq API (`llama-3.1-8b-instant`) via OpenAI-compatible endpoint
- **Styling:** Tailwind CSS + Framer Motion (for UI overlays)

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 The World Engine (PixiJS v8)
- **Isometric Projection:** Render a 64x64 tilemap using isometric coordinates.
- **Rendering Layers:** 
    - `IsometricGrid`: Viewport-culled grid lines drawn with Graphics.
    - `AgentSprite`: PixiJS Container managing body, shadow, labels, and speech bubbles.
- **Interpolation Logic:** The engine smoothly interpolates sprite positions between Convex database updates using the PixiJS ticker delta.

### 3.2 The AI Architecture (Convex Brain)
- **The Heartbeat (Cron):** A Convex Cron job triggers every 180 seconds to process a global world "tick."
- **Tiered Memory System:**
    1. **Sensory Buffer:** Recent logs (last 10 events) stored in a standard Convex table.
    2. **Semantic Memory:** Long-term facts stored in a Convex Vector Index.
    3. **Reflection Layer:** Simulated reflection updates agent core traits based on recent history.
- **Deterministic vs. Generative:** Survival needs (hunger, sleep) are prioritized via deterministic logic; social interactions are handled by LLM generation.

### 3.3 The User Interface (TanStack Start)
- **Nested Routing:** - `/` : Global world view.
    - `/agent/$id` : Side-panel overlay showing agent thoughts, inventory, and memory graph.
- **Search Params:** Use `?zoom=1.5&focus=agent_123` to sync the camera state with the URL.
- **Server Functions:** Use `createServerFn` to handle memory editing and world "God Mode" triggers.

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 Data Flow Model
1. **Mutation:** A Cron or User Action updates the `agents` table in Convex.
2. **Reactivity:** TanStack Start's `useQuery` hook receives the updated agent array instantly.
3. **Synchronization:** The `GameCanvas` component detects the data change and updates the corresponding PixiJS `Sprite` target coordinates.
4. **Distance Logic:** The system uses the Euclidean distance formula to trigger social proximity events:
   $$d = \sqrt{(x_B - x_A)^2 + (y_B - y_A)^2}$$

### 4.2 AI Agent Prompting Strategy
- **Roleplay Context:** "You are [Agent Name], an AI in a simulation. Your current goal is [Goal]. Memories: [Retrieved Vectors]."
- **Structured Output:** All LLM responses must be returned as JSON:
  {
    "thought": "I'm feeling lonely, I'll go talk to Bob.",
    "action": "walk_to",
    "target": "agent_bob",
    "speech": "Hey Bob, how's the weather?"
  }

---

## 5. UI/UX DESIGN SPECIFICATIONS
- **Visual Style:** 16-bit Isometric Pixel Art (e.g., *Stardew Valley* aesthetic).
- **Layout:**
    - **Main Viewport:** Full-screen canvas for the game world.
    - **Thought Stream:** A scrolling sidebar of real-time AI logs.
    - **Architect Panel:** Collapsible "God-Mode" tools (change weather, spawn items).
- **Interactivity:** Clicking an agent in the canvas triggers a TanStack transition to `/agent/$id`.

---

## 6. COST OPTIMIZATION (TOKEN MANAGEMENT)
- **Lazy Interaction:** Only call the LLM when agents are within the "Interaction Radius" or when a Hunger/Sleep threshold is met.
- **Context Pruning:** Use Convex Vector Search to only send the *relevant* memories to the LLM, rather than the entire history.
- **Sleep Mode:** Pause Crons immediately after the 30-second grace period with no active users.

---

## 7. MILESTONES
1. **Phase 1 (The Body):** Setup TanStack Start project with a canvas-based isometric grid.
2. **Phase 2 (The Heart):** Implement Convex schema and basic real-time movement syncing.
3. **Phase 3 (The Brain):** Integrate Convex Actions for LLM decision-making and Vector Search memory.
4. **Phase 4 (The Eyes):** Migrate rendering from Excalibur.js to PixiJS v8 for performance.
5. **Phase 5 (The Social):** Implement proximity-based chatting and persistent relationship tracking.
6. **Phase 6 (The Polish):** Add "God-Mode" UI and deploy via Vercel/Netlify.