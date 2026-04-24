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
      });
    }
    return { success: true };
  },
});

/**
 * Action: Process a world tick
 */
export const tick = action({
  args: {},
  handler: async (ctx) => {
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
        .filter(a => a._id !== agent._id)
        .filter(a => {
          const dx = a.gridX - agent.gridX;
          const dy = a.gridY - agent.gridY;
          return Math.sqrt(dx*dx + dy*dy) < 5; // Interaction radius
        })
        .map(a => a.name);

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
        },
        nearbyAgents,
        archetype: aiArchetype,
      });

      // Update action
      await ctx.runMutation(internal.functions.agents.updateAction, {
        agentId: agent._id,
        action: decision.action,
        targetX: decision.targetX, // If decision returns coords
        targetY: decision.targetY,
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

    return { success: true };
  },
});
