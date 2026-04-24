# Rate Limit Handling for AI Providers

This guide helps you handle rate limits from free AI providers like Z.AI (OpenRouter).

## Understanding Rate Limits

Free AI providers typically have:
- **Requests per minute**: 3-10 requests
- **Requests per day**: 100-1000 requests
- **Concurrent requests**: 1-2 simultaneous calls

## Current Implementation

The AI functions now include:
1. **Exponential backoff retry logic** (up to 3 retries)
2. **Graceful fallback to mock responses** when rate limited
3. **Error logging** for debugging

## Configuration Options

### 1. Reduce World Tick Frequency

The world tick runs every 60 seconds by default. For free providers, increase this:

**In Convex Dashboard** (Settings → Environment):
```bash
# Set a longer tick interval
WORLD_TICK_INTERVAL=120  # 2 minutes
```

Or update the config table:
```typescript
await ctx.db.insert("config", {
  defaultTickInterval: 120,  // seconds
  // ... other config
});
```

### 2. Enable Sleep Mode

Sleep mode pauses the world tick when no users are active:

**In Convex Dashboard** (Settings → Environment):
```bash
ENABLE_SLEEP_MODE=true
```

### 3. Reduce Agent Count

Fewer agents = fewer API calls per tick:

**In Convex Dashboard** (Functions → agents → seed):
```typescript
// Reduce from 25 to 10 agents
const AGENT_COUNT = 10;
```

### 4. Lazy LLM Execution

Only call AI when necessary:

**Current behavior:**
- AI called for every agent every tick
- Even idle agents make API calls

**Optimized behavior (in world.ts):**
```typescript
// Skip AI call if agent doesn't need it
if (agent.hunger < 30 && agent.energy > 50 && nearbyAgents.length === 0) {
  // Agent is fine, use mock decision
  continue;
}
```

## Provider-Specific Strategies

### Z.AI / OpenRouter Free Tier

**Rate limits:**
- ~5 requests/minute
- ~100 requests/day

**Solutions:**
1. **Use a different model** with higher limits:
   ```env
   OPENAI_MODEL=openai/gpt-3.5-turbo  # Higher limits
   ```

2. **Add your own API key** to OpenRouter:
   - Go to https://openrouter.ai/settings/integrations
   - Add your own API key
   - This gives you higher rate limits

3. **Use multiple providers** (fallback):
   ```typescript
   // Try provider 1, fallback to provider 2
   const providers = [
     { url: "https://openrouter.ai/v1", key: process.env.OPENROUTER_KEY },
     { url: "https://api.together.xyz/v1", key: process.env.TOGETHER_KEY },
   ];
   ```

### Alternative Free Providers

| Provider | Base URL | Rate Limit | Notes |
|----------|----------|------------|-------|
| **OpenRouter** | `https://openrouter.ai/v1` | ~5/min | Multiple models available |
| **Together AI** | `https://api.together.xyz/v1` | ~10/min | Good free tier |
| **Groq** | `https://api.groq.com/openai/v1` | ~30/min | Very fast, generous limits |
| **Mistral AI** | `https://api.mistral.ai/v1` | ~10/min | Good quality |

## Monitoring Rate Limits

### Check Convex Logs

```bash
npx convex logs --watch
```

Look for:
```
[INFO] Rate limited, retrying in 1000ms (attempt 1/4)
[INFO] AI API call to https://openrouter.ai/v1/chat/completions
[INFO] AI response received in 245ms
```

### Track API Usage

Add a counter to track calls:

```typescript
// In ai.ts, add to your config table
interface AiConfig {
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
  callCount?: number;  // Track calls
}
```

## Best Practices for Free Providers

### 1. **Use Mock Responses Strategically**

When rate limited, the system falls back to mock responses. This is fine for:
- Idle agents
- Agents with no nearby neighbors
- Testing/development

### 2. **Prioritize Important Calls**

Only call AI when it matters:
- ✅ Social interactions (agents near each other)
- ✅ Complex decisions (multiple options)
- ❌ Idle agents (use mock)
- ❌ Deterministic actions (eating when hungry)

### 3. **Batch Requests (Future Enhancement)**

Instead of calling AI for each agent individually:
```typescript
// Future: Batch multiple agents into one API call
const batchPrompt = `
Agent 1 (Alice): ...
Agent 2 (Bob): ...
Agent 3 (Charlie): ...
`;
```

### 4. **Use Caching**

Cache frequent decisions:
```typescript
// Cache decisions for similar agent states
const cacheKey = `${archetype}-${hunger}-${energy}`;
if (cache[cacheKey]) return cache[cacheKey];
```

## Quick Fixes for Your Current Setup

### Fix 1: Increase Tick Interval

```bash
# In Convex Dashboard → Environment
WORLD_TICK_INTERVAL=180  # 3 minutes
```

### Fix 2: Reduce Agent Count

Edit `convex/functions/seed.ts`:
```typescript
const AGENT_COUNT = 10;  // Reduced from 25
```

### Fix 3: Use a Better Provider

Switch to Groq (very generous free tier):

```bash
# In Convex Dashboard → Environment
OPENAI_API_KEY=gsk_xxx  # Your Groq API key
OPENAI_API_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.1-70b-versatile
```

### Fix 4: Enable Sleep Mode

```bash
# In Convex Dashboard → Environment
ENABLE_SLEEP_MODE=true
```

This pauses the world tick after 30 minutes of inactivity.

## Testing Rate Limit Handling

### Test 1: Simulate Rate Limit

Run the world tick multiple times quickly:

```javascript
// In browser console
for (let i = 0; i < 10; i++) {
  await fetch('/api/tick', { method: 'POST' });
  console.log(`Tick ${i + 1} complete`);
}
```

**Expected:** Some ticks will use mock responses due to rate limiting.

### Test 2: Check Fallback Behavior

```javascript
// Force a decision call
const response = await fetch('/api/decision', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentState: { name: "Test", hunger: 50, energy: 50, social: 50 },
    nearbyAgents: [],
    archetype: "friendly"
  })
});

const result = await response.json();
console.log(result);
```

**Expected:** If rate limited, you should see `[MOCK]` in the reasoning.

## Troubleshooting

### Problem: Still getting 429 errors

**Solutions:**
1. Increase tick interval to 180+ seconds
2. Reduce agent count to 10 or fewer
3. Switch to a provider with higher limits (Groq, Together AI)
4. Add your own API key to OpenRouter

### Problem: Agents always use mock responses

**Solutions:**
1. Check API key is set correctly
2. Verify API key has available credits
3. Check provider dashboard for usage limits
4. Test API key directly with curl

### Problem: Slow response times

**Solutions:**
1. Use faster models (GPT-4o-mini, Claude 3.5 Haiku)
2. Enable sleep mode when not active
3. Reduce agent count
4. Use embedding caching for memory searches

## Recommended Setup for Free Tier

For the best experience with free AI providers:

```env
# Convex Dashboard → Environment
OPENAI_API_KEY=your-key
OPENAI_API_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.1-70b-versatile
WORLD_TICK_INTERVAL=120
ENABLE_SLEEP_MODE=true
```

**Expected behavior:**
- ✅ 2-minute world ticks
- ✅ Sleep mode after 30 min inactivity
- ✅ ~30 requests/minute limit (Groq)
- ✅ Fast response times (< 1 second)
- ✅ Graceful fallback to mock when needed
