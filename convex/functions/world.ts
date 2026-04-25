import { query, mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * Query: Get the current world state
 */
export const getState = query({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db.query("world_state").first();
    return state;
  },
});

/**
 * Query: Get all points of interest
 */
export const getPois = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pois").collect();
  },
});

/**
 * Mutation: Update the world state
 */
export const updateState = mutation({
  args: {
    weather: v.optional(v.union(
      v.literal("sunny"),
      v.literal("cloudy"),
      v.literal("rainy"),
      v.literal("stormy")
    )),
    timeOfDay: v.optional(v.number()),
    dayCount: v.optional(v.number()),
    tickIntervalSeconds: v.optional(v.number()),
    totalTicks: v.optional(v.number()),
    lastTickAt: v.optional(v.number()),
    lastUserActivityAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingState = await ctx.db.query("world_state").first();
    if (existingState) {
      await ctx.db.patch(existingState._id, args);
    } else {
      // Create default state if it doesn't exist
      await ctx.db.insert("world_state", {
        weather: args.weather ?? "sunny",
        timeOfDay: args.timeOfDay ?? 12,
        dayCount: args.dayCount ?? 1,
        tickIntervalSeconds: args.tickIntervalSeconds ?? 60,
        totalTicks: args.totalTicks ?? 0,
        lastTickAt: args.lastTickAt ?? Date.now(),
        lastUserActivityAt: args.lastUserActivityAt ?? Date.now(),
      });
    }
    return { success: true };
  },
});

/**
 * Action: Check and update sleep mode status
 */
export const checkSleepMode = action({
  args: {},
  handler: async (ctx): Promise<{ sleeping: boolean; reason: string; timeSinceLastTick?: number }> => {
    const enableSleepMode = process.env.ENABLE_SLEEP_MODE === "true";
    
    if (!enableSleepMode) {
      return { sleeping: false, reason: "Sleep mode disabled" };
    }

    const state = await ctx.runQuery(api.functions.world.getState);
    if (!state) {
      return { sleeping: false, reason: "No world state" };
    }

    const now = Date.now();
    const roomId = process.env.PRESENCE_ROOM_ID || "main-app";
    
    // Check real-time presence
    const activeUsers = await ctx.runQuery(api.presence.list, { roomToken: roomId });
    const userCount = activeUsers.length;

    if (userCount > 0) {
      // Users are present, update activity timestamp
      await ctx.runMutation(api.functions.world.updateState, {
        lastUserActivityAt: now,
      });
      return { 
        sleeping: false, 
        reason: `${userCount} active users present` 
      };
    }

    // No users present, check grace period
    const lastActivity = state.lastUserActivityAt || state.lastTickAt || 0;
    const timeSinceLastActivity = now - lastActivity;
    const gracePeriod = parseInt(process.env.SLEEP_MODE_GRACE_PERIOD || "30000");

    if (timeSinceLastActivity < gracePeriod) {
      return { 
        sleeping: false, 
        reason: `No users, but within grace period (${Math.round((gracePeriod - timeSinceLastActivity) / 1000)}s left)` 
      };
    }

    // Beyond grace period, check legacy inactivity timeout as well
    const lastTick = state.lastTickAt || now;
    const timeSinceLastTick = now - lastTick;
    const sleepTimeout = 30 * 60 * 1000; // 30 minutes

    return { 
      sleeping: timeSinceLastTick > sleepTimeout, 
      reason: `Inactive for ${Math.round(timeSinceLastActivity / 1000)}s (grace period: ${gracePeriod/1000}s)`,
      timeSinceLastTick 
    };
  },
});

/**
 * Normalizes an action string from the AI to a valid AgentAction
 */
function normalizeAction(action: string): "idle" | "walking" | "eating" | "sleeping" | "talking" | "working" | "exploring" {
  const validActions = ["idle", "walking", "eating", "sleeping", "talking", "working", "exploring"];
  if (validActions.includes(action)) {
    return action as any;
  }

  // Map common hallucinations
  if (action.includes("food") || action.includes("eat")) return "eating";
  if (action.includes("sleep") || action.includes("rest") || action.includes("bed")) return "sleeping";
  if (action.includes("walk") || action.includes("move") || action.includes("go")) return "walking";
  if (action.includes("talk") || action.includes("chat") || action.includes("greet")) return "talking";
  if (action.includes("work") || action.includes("build")) return "working";
  if (action.includes("explore") || action.includes("look")) return "exploring";

  return "idle";
}

/**
 * Action: Process a world tick
 */
export const tick = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; skipped?: boolean; reason?: string; agentCount?: number }> => {
    // Check sleep mode
    const enableSleepMode = process.env.ENABLE_SLEEP_MODE === "true";
    
    if (enableSleepMode) {
      const sleepStatus = await ctx.runAction(api.functions.world.checkSleepMode);
      
      if (sleepStatus.sleeping) {
        console.log(`[WORLD] Skipping tick - sleep mode active: ${sleepStatus.reason}`);
        return { 
          success: true, 
          skipped: true, 
          reason: sleepStatus.reason 
        };
      }
    }

    // 1. Get all active agents
    const agents = await ctx.runQuery(api.functions.agents.getAll);
    
    // 2. Process each agent
    const worldState = await ctx.runQuery(api.functions.world.getState);
    const weather = worldState?.weather || "sunny";
    const weatherMultipliers: Record<string, number> = {
      sunny: 1.0,
      cloudy: 1.0,
      rainy: 0.8,
      stormy: 0.5,
    };
    const speedMultiplier = weatherMultipliers[weather] || 1.0;

    const BATCH_SIZE = 3;
    const BATCH_DELAY_MS = 1000;

    for (let i = 0; i < agents.length; i += BATCH_SIZE) {
      const batch = agents.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (agent: any) => {
        // 2.1 Safety Layer: Check for critical needs (Survival overrides)
        if (agent.hunger > 90 || agent.energy < 10) {
          const survivalAction = agent.hunger > 90 ? "eating" : "sleeping";
          await ctx.runMutation(internal.functions.agents.updateAction, {
            agentId: agent._id,
            action: survivalAction,
          });
          return;
        }

        // 2.2 Social Handshaking: Skip if listening (someone is talking to us)
        if (agent.currentAction === "listening") {
          return;
        }

        // 2.3 Update needs based on current action
        await ctx.runMutation(internal.functions.agents.updateNeeds, {
          agentId: agent._id,
        });

        // 2.4 Reflection Logic (every ~24 simulated hours / 480 ticks)
        const currentTicks = worldState?.totalTicks || 0;
        const lastReflected = agent.lastReflectedTick || 0;
        // Add random jitter between -20 and +20 ticks to avoid batch processing spikes
        const jitter = Math.floor(Math.random() * 40) - 20;
        
        if (currentTicks - lastReflected > (480 + jitter)) {
          // Trigger async reflection (non-blocking)
          await ctx.runAction(api.functions.ai.reflect, {
            agentId: agent._id,
          });
          
          // Update last reflected tick immediately to avoid duplicate triggers
          await ctx.runMutation(internal.functions.agents.updateIdentity, {
            agentId: agent._id,
            newTraits: [], 
            lastReflectedTick: currentTicks,
          });
        }

        // 2.5 Movement Resolution
        if (agent.targetX !== undefined && agent.targetY !== undefined) {
          const result = await ctx.runMutation(internal.functions.agents.resolveMovement, {
            agentId: agent._id,
            speedMultiplier,
          });

          if (result?.arrived) {
            await ctx.runMutation(api.functions.memory.addEvent, {
              agentId: agent._id,
              type: "movement",
              description: `Arrived at destination (${Math.round(result.newX)}, ${Math.round(result.newY)})`,
              gridX: result.newX,
              gridY: result.newY,
            });
          }
        }

        // 2.5 Passive Perception: Record nearby sightings
        await ctx.runMutation(internal.functions.agents.recordPassivePerception, {
          agentId: agent._id,
        });

        // 2.6 Get nearby agents for decision making
        const nearbyAgents = agents
          .filter((a: any) => a._id !== agent._id)
          .filter((a: any) => {
            const dx = a.gridX - agent.gridX;
            const dy = a.gridY - agent.gridY;
            return Math.sqrt(dx*dx + dy*dy) < 5; // Interaction radius
          })
          .map((a: any) => a.name);

        // Archetype mapping
        let aiArchetype: "builder" | "socialite" | "philosopher" | "explorer" | "nurturer" = "builder";
        const validArchetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"];
        if (validArchetypes.includes(agent.archetype)) {
          aiArchetype = agent.archetype as any;
        }

        // Call AI for decision
        // FETCH FULL CONTEXT (Identity + RAG Memories)
        const fullContext = await ctx.runAction(api.functions.ai.buildFullContext, {
          agentId: agent._id,
          query: `What should I do next given my goal ${agent.currentGoal} and current state?`,
        });

        const decision = await ctx.runAction(api.functions.ai.decision, {
          agentState: {
            name: agent.name,
            hunger: agent.hunger, 
            energy: agent.energy,
            social: agent.social,
            model: agent.model,
          },
          nearbyAgents,
          archetype: aiArchetype,
          contextOverride: fullContext, // New field to support RAG
        });

        // Normalize action to ensure it matches schema literals
        const normalizedAction = normalizeAction(decision.action);

        // 2.7 Social Handshaking: Handle Talking/Listening states
        let targetAgentId: Id<"agents"> | undefined;
        if (normalizedAction === "talking") {
          const targetAgent = agents.find((a: any) => a.name === decision.target);
          if (targetAgent && targetAgent._id !== agent._id) {
            targetAgentId = targetAgent._id;
            
            // Set partner to listening
            await ctx.runMutation(internal.functions.agents.updateAction, {
              agentId: targetAgentId,
              action: "listening",
              interactionPartnerId: agent._id,
            });
          }
        }

        // Update action
        let targetX: number | undefined;
        let targetY: number | undefined;
        if (decision.target && decision.target !== "none" && normalizedAction !== "talking") {
          const coords = decision.target.split(",");
          if (coords.length === 2) {
            const x = parseFloat(coords[0]);
            const y = parseFloat(coords[1]);
            if (!isNaN(x) && !isNaN(y)) {
              targetX = x;
              targetY = y;
            }
          }
          if (targetX === undefined) {
            const targetAgent = agents.find((a: any) => a.name === decision.target);
            if (targetAgent) {
              targetX = targetAgent.gridX;
              targetY = targetAgent.gridY;
            }
          }
        }

        await ctx.runMutation(internal.functions.agents.updateAction, {
          agentId: agent._id,
          action: normalizedAction,
          targetX,
          targetY,
          interactionPartnerId: targetAgentId,
          lastThought: decision.thought,
          speech: decision.speech,
          lastSpeechAt: decision.speech ? Date.now() : undefined,
        });

        // Add event to sensory buffer with thought and speech
        let description = `Thought: ${decision.thought} | Action: ${normalizedAction}`;
        if (decision.speech) {
          description += ` | Said: "${decision.speech}"`;
        }
        
        await ctx.runMutation(api.functions.memory.addEvent, {
          agentId: agent._id,
          type: decision.speech ? "conversation" : "movement",
          description,
          gridX: agent.gridX,
          gridY: agent.gridY,
        });
      }));

      // Delay between batches to respect RPM
      if (i + BATCH_SIZE < agents.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }


    // 3. Update world state (total ticks, etc.)
    const state = await ctx.runQuery(api.functions.world.getState);
    if (state) {
      await ctx.runMutation(api.functions.world.updateState, {
        totalTicks: (state.totalTicks || 0) + 1,
        lastTickAt: Date.now(),
      });
    }

    return { success: true, skipped: false, agentCount: agents.length };
  },
});
