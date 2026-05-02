import { internalQuery, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/** Internal Query: Get nearby agents via by_position index (O(k) vs O(n)) */
export const getNearbyAgents = internalQuery({
  args: {
    agentId: v.id("agents"),
    gridX: v.number(),
    gridY: v.number(),
    radius: v.number(),
  },
  handler: async (ctx, args) => {
    const { agentId, gridX, gridY, radius } = args;
    const candidates = await ctx.db
      .query("agents")
      .withIndex("by_position", (q) =>
        q.gte("gridX", gridX - radius).lte("gridX", gridX + radius)
      )
      .collect();
    return candidates.filter((a) => {
      if (a._id === agentId) return false;
      const dx = a.gridX - gridX;
      const dy = a.gridY - gridY;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });
  },
});

/** Internal Mutation: Record passive perception (sight nearby agents) */
export const recordPassivePerception = internalMutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return;

    const config = await ctx.db.query("config").first();
    const interactionRadius = config?.interactionRadius ?? 5;

    const nearbyAgents = await ctx.runQuery(internal.functions.perception.getNearbyAgents, {
      agentId: args.agentId,
      gridX: agent.gridX,
      gridY: agent.gridY,
      radius: interactionRadius,
    });

    for (const nearby of nearbyAgents) {
      // Use the proper addEvent logic via a internal call if possible, 
      // but since addEvent is a public mutation, we'll replicate the logic here 
      // or just call it if we were in an action. 
      // Since we are in a mutation, we'll just insert and then we should 
      // ideally have a shared internal helper for the cleanup logic.
      
      await ctx.db.insert("events", {
        agentId: agent._id,
        type: "movement",
        description: `I saw ${nearby.name} nearby.`,
        gridX: agent.gridX,
        gridY: agent.gridY,
      });

      // Cleanup oldest events for this agent to maintain sensory buffer
      const events = await ctx.db
        .query("events")
        .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
        .collect();

      if (events.length > 10) {
        const sortedEvents = events.sort((a, b) => a._creationTime - b._creationTime);
        const toDelete = sortedEvents.slice(0, sortedEvents.length - 10);
        for (const event of toDelete) {
          await ctx.db.delete(event._id);
        }
      }
    }
  },
});
