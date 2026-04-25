import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const agents = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, { clearExisting }) => {
    if (clearExisting) {
      const existingAgents = await ctx.db.query("agents").collect();
      if (existingAgents.length > 0) {
        // Clear existing agents for a fresh seed
        for (const agent of existingAgents) {
          await ctx.db.delete(agent._id);
        }
      }
    }

    // OPTIMIZED: Reduced to 10 agents for token limits
    const archetypes = [
      { type: "builder", traits: ["diligent", "practical"], names: ["Bob", "Wendy"] },
      { type: "socialite", traits: ["outgoing", "charming"], names: ["Paris", "Kim"] },
      { type: "philosopher", traits: ["thoughtful", "analytical"], names: ["Socrates", "Plato"] },
      { type: "explorer", traits: ["adventurous", "curious"], names: ["Indiana", "Lara"] },
      { type: "nurturer", traits: ["caring", "protective"], names: ["Florence", "Clara"] },
    ] as const;

    let count = 0;
    for (const arch of archetypes) {
      for (const name of arch.names) {
        await ctx.db.insert("agents", {
          name,
          archetype: arch.type,
          gridX: Math.floor(Math.random() * 64),
          gridY: Math.floor(Math.random() * 64),
          coreTraits: arch.traits as unknown as string[],
          isActive: true,
          hunger: 50,
          energy: 50,
          social: 50,
          currentAction: "idle",
          spriteVariant: Math.floor(Math.random() * 4),
          lastActiveAt: Date.now(),
          bio: "",
          inventory: [],
          currentGoal: "Wandering around",
          lastReflectedTick: 0,
          actionStartedAt: Date.now(),
        });
        count++;
      }
    }

    // Also seed world state if missing
    const existingState = await ctx.db.query("world_state").first();
    if (!existingState) {
      await ctx.db.insert("world_state", {
        weather: "sunny",
        timeOfDay: 10,
        dayCount: 1,
        tickIntervalSeconds: 180,  // Increased to 3 minutes
        totalTicks: 0,
        lastTickAt: Date.now(),
      });
    }

    return { message: `Seeded ${count} agents and world state` };
  },
});
