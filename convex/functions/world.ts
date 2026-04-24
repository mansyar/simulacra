import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

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
