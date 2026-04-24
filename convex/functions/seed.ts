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

    const archetypes = [
      { type: "builder", traits: ["diligent", "practical"], names: ["Bob", "Wendy", "Homer", "Marge", "Fixer"] },
      { type: "socialite", traits: ["outgoing", "charming"], names: ["Paris", "Kim", "Leo", "Gatsby", "Muse"] },
      { type: "philosopher", traits: ["thoughtful", "analytical"], names: ["Socrates", "Plato", "Kant", "Nietzsche", "Sage"] },
      { type: "explorer", traits: ["curious", "brave"], names: ["Indy", "Lara", "Marco", "Polo", "Scout"] },
      { type: "nurturer", traits: ["kind", "patient"], names: ["Florence", "Clara", "Mother", "Teresa", "Angel"] },
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
        tickIntervalSeconds: 60,
        totalTicks: 0,
        lastTickAt: Date.now(),
      });
    }

    return { message: `Seeded ${count} agents and world state` };
  },
});
