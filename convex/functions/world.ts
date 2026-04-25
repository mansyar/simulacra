import { query, mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

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
    const activeUsers = await ctx.runQuery(api.presence.list, { roomId });
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
    for (const agent of agents) {
      // Update needs
      await ctx.runMutation(internal.functions.agents.updateNeeds, {
        agentId: agent._id,
        hungerDelta: 5,
        energyDelta: -2,
        socialDelta: -1,
      });

      // Get nearby agents for decision making
      const nearbyAgents = agents
        .filter((a: any) => a._id !== agent._id)
        .filter((a: any) => {
          const dx = a.gridX - agent.gridX;
          const dy = a.gridY - agent.gridY;
          return Math.sqrt(dx*dx + dy*dy) < 5; // Interaction radius
        })
        .map((a: any) => a.name);

      // Archetype mapping if necessary (ensure it matches ai.ts literals)
      let aiArchetype: "friendly" | "grumpy" | "curious" = "friendly";
      if (["friendly", "grumpy", "curious"].includes(agent.archetype)) {
        aiArchetype = agent.archetype as "friendly" | "grumpy" | "curious";
      }

      // Call AI for decision
      const decision = await ctx.runAction(api.functions.ai.decision, {
        agentState: {
          name: agent.name,
          hunger: agent.hunger + 5,
          energy: agent.energy - 2,
          social: agent.social - 1,
          model: agent.model,
        },
        nearbyAgents,
        archetype: aiArchetype,
      });

      // Update action
      // decision.target is a string: "none", agent name, or coordinates "x,y"
      let targetX: number | undefined;
      let targetY: number | undefined;
      if (decision.target && decision.target !== "none") {
        // Try to parse as coordinates "x,y"
        const coords = decision.target.split(",");
        if (coords.length === 2) {
          const x = parseFloat(coords[0]);
          const y = parseFloat(coords[1]);
          if (!isNaN(x) && !isNaN(y)) {
            targetX = x;
            targetY = y;
          }
        }
        // If not coordinates, treat as agent name
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
        action: decision.action,
        targetX,
        targetY,
      });

      // Add event to sensory buffer
      await ctx.runMutation(api.functions.memory.addEvent, {
        agentId: agent._id,
        type: "movement", // Default for now
        description: `Decided to ${decision.action} because: ${decision.reasoning}`,
        gridX: agent.gridX,
        gridY: agent.gridY,
      });
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
