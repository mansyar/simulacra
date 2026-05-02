import { query, internalMutation } from "../_generated/server";
import { v } from "convex/values";

/** Query: Get agent relationships with names resolved */
export const getRelationships = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    // Query relationships where agentId is either agentA or agentB
    const relsA = await ctx.db
      .query("relationships")
      .withIndex("by_agents", (q) => q.eq("agentAId", agentId))
      .collect();
    const relsB = await ctx.db
      .query("relationships")
      .withIndex("by_agentB", (q) => q.eq("agentBId", agentId))
      .collect();
    const allRels = [...relsA, ...relsB];
    const results = await Promise.all(allRels.map(async (rel) => {
      const otherId = rel.agentAId === agentId ? rel.agentBId : rel.agentAId;
      const otherAgent = await ctx.db.get(otherId);
      return {
        ...rel,
        otherAgentName: otherAgent?.name ?? "Unknown Agent",
      };
    }));

    // Sort by affinity descending
    return results.sort((a, b) => b.affinity - a.affinity);
  },
});

/** Internal Mutation: Update relationship affinity */
export const updateRelationship = internalMutation({
  args: {
    agentAId: v.id("agents"),
    agentBId: v.id("agents"),
    delta: v.number(),
  },
  handler: async (ctx, args) => {
    // Ensure consistent ordering to avoid duplicate pairs
    const [id1, id2] = args.agentAId < args.agentBId 
      ? [args.agentAId, args.agentBId] 
      : [args.agentBId, args.agentAId];

    const relationship = await ctx.db
      .query("relationships")
      .withIndex("by_agents", (q) => q.eq("agentAId", id1).eq("agentBId", id2))
      .first();

    const type = (args.delta > 0 ? "positive" : (args.delta < 0 ? "negative" : "neutral")) as "positive" | "negative" | "neutral";

    if (relationship) {
      const valenceConfig = await ctx.db.query("config").first();
      const maxValence = valenceConfig?.maxConversationTurns ?? 5;
      const history = [type, ...(relationship.valenceHistory || [])].slice(0, maxValence) as ("positive" | "negative" | "neutral")[];
      await ctx.db.patch(relationship._id, {
        affinity: Math.max(-100, Math.min(100, relationship.affinity + args.delta)),
        interactionsCount: relationship.interactionsCount + 1,
        lastInteractionAt: Date.now(),
        lastInteractionType: type,
        valenceHistory: history,
      });
    } else {
      await ctx.db.insert("relationships", {
        agentAId: id1,
        agentBId: id2,
        affinity: args.delta,
        interactionsCount: 1,
        lastInteractionAt: Date.now(),
        lastInteractionType: type,
        valenceHistory: [type],
      });
    }
  },
});
