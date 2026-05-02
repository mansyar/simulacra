import { mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * Action: Manually trigger a world tick
 */
export const manualTick = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; skipped?: boolean; agentCount?: number; tickDurationMs?: number; reason?: string }> => {
    return await ctx.runAction(api.functions.world.tick, { skipSleep: true });
  },
});

/**
 * Action: Manually trigger reflection for a specific agent
 */
export const manualReflect = action({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
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

    // 3. Reset identity to defaults
    await ctx.db.patch(args.agentId, {
      bio: "",
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

/**
 * Mutation: Reset the entire world for testing
 */
export const resetWorld = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Clear all agents
    const agents = await ctx.db.query("agents").collect();
    for (const agent of agents) {
      await ctx.db.delete(agent._id);
    }

    // 2. Clear all memories
    const memories = await ctx.db.query("memories").collect();
    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }

    // 3. Clear all events
    const events = await ctx.db.query("events").collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    // 4. Clear all relationships
    const relationships = await ctx.db.query("relationships").collect();
    for (const relationship of relationships) {
      await ctx.db.delete(relationship._id);
    }

    // 5. Re-seed the world using the seed function
    await ctx.runMutation(api.functions.seed.agents, { clearExisting: false });
    await ctx.runMutation(api.functions.seed.config, { clearExisting: false });

    return { success: true, message: "World reset and re-seeded successfully." };
  },
});
