import { mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * Action: Manually trigger a world tick
 */
export const manualTick = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    return await ctx.runAction(api.functions.world.tick, {});
  },
});

/**
 * Action: Manually trigger reflection for a specific agent
 */
export const manualReflect = action({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runAction(api.functions.ai.reflect, {
      agentId: args.agentId,
    });
  },
});

/**
 * Mutation: Reset an agent's brain (memories and identity)
 */
export const resetAgentBrain = mutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");

    // 1. Clear memories
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();
    
    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }

    // 2. Clear events (sensory buffer)
    const events = await ctx.db
      .query("events")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    // 3. Reset identity to defaults (from seed logic essentially)
    await ctx.db.patch(args.agentId, {
      bio: "", // Could re-seed this if we had the initial seed data available
      coreTraits: [],
      inventory: [],
      currentGoal: "Starting over.",
      lastReflectedTick: 0,
      lastThought: undefined,
      speech: undefined,
      lastSpeechAt: undefined,
      hunger: 50,
      energy: 50,
      social: 50,
      currentAction: "idle",
    });

    return { success: true, message: `Reset brain for agent ${agent.name}` };
  },
});
