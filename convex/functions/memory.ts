import { mutation, query, action, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";

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
    console.log(`[MEMORY] Adding event for agent ${args.agentId}: ${args.type} - ${args.description}`);
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

/**
 * Query: Get the most recent global events for the world-wide sidebar
 */
export const getGlobalEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const events = await ctx.db
      .query("events")
      .order("desc")
      .take(limit);

    // Populate agent names for the UI
    const eventsWithAgents = await Promise.all(
      events.map(async (event) => {
        let agentName = "Unknown";
        if (event.agentId) {
          const agent = await ctx.db.get(event.agentId);
          if (agent) agentName = agent.name;
        }
        return {
          ...event,
          agentName,
        };
      })
    );

    return eventsWithAgents;
  },
});

export const addSemanticMemory = action({
  args: {
    agentId: v.id("agents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const embedding = await ctx.runAction(api.functions.ai_helpers.embed, { text: args.content });

    await ctx.runMutation(internal.functions.memory.insertMemory, {
      agentId: args.agentId,
      content: args.content,
      embedding,
      type: "semantic",
    });
  },
});

export const insertMemory = internalMutation({
  args: {
    agentId: v.id("agents"),
    content: v.string(),
    embedding: v.array(v.float64()),
    type: v.union(
      v.literal("sensory"),
      v.literal("semantic"),
      v.literal("reflection"),
      v.literal("interaction")
    ),
    importance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("memories", {
      agentId: args.agentId,
      content: args.content,
      embedding: args.embedding,
      type: args.type,
      timestamp: Date.now(),
      importance: args.importance ?? 5,
      tags: [],
    });
  },
});

export const searchSemanticMemory = action({
  args: {
    agentId: v.id("agents"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<"memories">[]> => {
    const embedding = await ctx.runAction(api.functions.ai_helpers.embed, { text: args.query });

    const results = await ctx.vectorSearch("memories", "by_embedding", {
      vector: embedding,
      filter: (q) => q.eq("agentId", args.agentId),
      limit: args.limit || 3,
    });

    // Fetch the actual memory documents and filter by type
    const memories: Doc<"memories">[] = [];
    for (const result of results) {
      const memory = await ctx.runQuery(internal.functions.memory.getMemoryById, { id: result._id });
      if (memory && memory.type === "semantic") {
        memories.push(memory);
      }
    }
    return memories;
  },
});

/**
 * Query: Retrieve relevant memories for an agent via vector search
 */
export const retrieveMemories = query({
  args: {
    agentId: v.id("agents"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    void ctx; void args; // stub — placeholder for future implementation
    return []; 
  },
});

export const retrieveMemoriesAction = action({
  args: {
    agentId: v.id("agents"),
    query: v.string(),
    limit: v.optional(v.number()),
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, args): Promise<Doc<"memories">[]> => {
    const limit = args.limit ?? 5;

    // 1. Generate embedding for the search query (or use pre-computed one)
    const embedding = args.embedding ?? await ctx.runAction(api.functions.ai_helpers.embed, {
      text: args.query,
    });

    // 2. Perform vector search
    let results;
    try {
      results = await ctx.vectorSearch("memories", "by_embedding", {
        vector: embedding,
        filter: (q) => q.eq("agentId", args.agentId),
        limit,
      });
    } catch (e) {
      // Fallback for testing environments that don't support vector search
      console.warn("Vector search failed, falling back to basic query:", e);
      const allMemories = await ctx.runQuery(internal.functions.memory.getMemoriesByAgent, {
        agentId: args.agentId,
      });
      return allMemories.slice(0, limit);
    }

    // 3. Fetch the full memory documents
    const memories = await Promise.all(
      results.map(async (res) => {
        const memory = await ctx.runQuery(internal.functions.memory.getMemoryById, {
          id: res._id as Id<"memories">,
        });
        return memory;
      })
    );

    return memories.filter((m: Doc<"memories"> | null): m is Doc<"memories"> => m !== null);
  },
});

export const getMemoryById = internalQuery({
  args: { id: v.id("memories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getMemoriesByAgent = internalQuery({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});
