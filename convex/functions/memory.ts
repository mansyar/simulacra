import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const addEvent = mutation({
  args: {
    agentId: v.id("agents"),
    type: v.union(
      v.literal("movement"),
      v.literal("interaction"),
      v.literal("conversation"),
      v.literal("need_change"),
      v.literal("weather_change")
    ),
    description: v.string(),
    gridX: v.number(),
    gridY: v.number(),
    targetId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    // Add the new event
    await ctx.db.insert("events", {
      agentId: args.agentId,
      type: args.type,
      description: args.description,
      gridX: args.gridX,
      gridY: args.gridY,
      targetId: args.targetId,
    });

    // Get all events for this agent
    const events = await ctx.db
      .query("events")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    // Limit to 10 events (Sensory Buffer)
    if (events.length > 10) {
      // Sort by _creationTime ascending (oldest first)
      const sortedEvents = events.sort((a, b) => a._creationTime - b._creationTime);
      const toDelete = sortedEvents.slice(0, sortedEvents.length - 10);
      for (const event of toDelete) {
        await ctx.db.delete(event._id);
      }
    }
  },
});

export const getEvents = query({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});
