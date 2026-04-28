import { query, mutation, internalQuery, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";

export type AgentDoc = Doc<"agents">;

/** Query: Get all active agents */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return agents;
  },
});

/** Query: Get a single agent by ID */
export const getById = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    const agent = await ctx.db.get(agentId);
    return agent;
  },
});

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

/** Mutation: Create a new agent */
export const create = mutation({
  args: {
    name: v.string(),
    archetype: v.union(
      v.literal("builder"),
      v.literal("socialite"),
      v.literal("philosopher"),
      v.literal("explorer"),
      v.literal("nurturer")
    ),
    gridX: v.number(),
    gridY: v.number(),
    spriteVariant: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const newAgent = {
      name: args.name,
      archetype: args.archetype,
      gridX: args.gridX,
      gridY: args.gridY,
      spriteVariant: args.spriteVariant ?? Math.floor(Math.random() * 4),
      currentAction: "idle" as const,
      targetX: undefined,
      targetY: undefined,
      hunger: 50,
      energy: 50,
      social: 50,
      coreTraits: [],
      isActive: true,
      lastActiveAt: Date.now(),
      bio: "",
      inventory: [],
      currentGoal: "Wandering around",
      lastReflectedTick: 0,
      actionStartedAt: Date.now(),
    };
    const agentId = await ctx.db.insert("agents", newAgent);
    return agentId;
  },
});

/** Internal Mutation: Resolve movement toward target */
export const resolveMovement = internalMutation({
  args: {
    agentId: v.id("agents"),
    speedMultiplier: v.number(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return;

    if (agent.targetX === undefined || agent.targetY === undefined) return;

    const AGENT_SPEED = 6; // grid units per tick
    const dx = agent.targetX - agent.gridX;
    const dy = agent.targetY - agent.gridY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.1) {
      const moveDistance = AGENT_SPEED * args.speedMultiplier;
      const ratio = Math.min(1, moveDistance / distance);
      
      const newX = agent.gridX + dx * ratio;
      const newY = agent.gridY + dy * ratio;

      await ctx.db.patch(args.agentId, {
        gridX: newX,
        gridY: newY,
        lastActiveAt: Date.now(),
      });

      return { arrived: ratio === 1, newX, newY };
    }
    return { arrived: true, newX: agent.gridX, newY: agent.gridY };
  },
});

/** Mutation: Update agent position */
export const updatePosition = mutation({
  args: {
    agentId: v.id("agents"),
    targetX: v.number(),
    targetY: v.number(),
  },
  handler: async (ctx, { agentId, targetX, targetY }) => {
    // Validate position bounds (0-63)
    const boundedX = Math.max(0, Math.min(63, targetX));
    const boundedY = Math.max(0, Math.min(63, targetY));

    await ctx.db.patch(agentId, {
      gridX: boundedX,
      gridY: boundedY,
      targetX: boundedX,
      targetY: boundedY,
      lastActiveAt: Date.now(),
    });
    return { success: true };
  },
});

/** Internal Mutation: Update agent needs based on current action */
export const updateNeeds = internalMutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return;

    const action = agent.currentAction;
    let hungerDelta = 0;
    let energyDelta = 0;
    let socialDelta = 0;

    switch (action) {
      case "idle":
        hungerDelta = 1;
        energyDelta = -1;
        socialDelta = -1;
        break;
      case "walking":
        hungerDelta = 2;
        energyDelta = -2;
        socialDelta = -1;
        break;
      case "eating":
        hungerDelta = -20;
        energyDelta = 5;
        socialDelta = 1;
        break;
      case "sleeping":
        hungerDelta = 1;
        energyDelta = 20;
        socialDelta = -2;
        break;
      case "talking":
        hungerDelta = 1;
        energyDelta = -1;
        socialDelta = 10;
        break;
      case "listening":
        hungerDelta = 1;
        energyDelta = -1;
        socialDelta = 5;
        break;
      case "working":
        hungerDelta = 5;
        energyDelta = -5;
        socialDelta = -2;
        break;
      case "exploring":
        hungerDelta = 3;
        energyDelta = -3;
        socialDelta = 2;
        break;
    }

    await ctx.db.patch(args.agentId, {
      hunger: Math.max(0, Math.min(100, agent.hunger + hungerDelta)),
      energy: Math.max(0, Math.min(100, agent.energy + energyDelta)),
      social: Math.max(0, Math.min(100, agent.social + socialDelta)),
      lastActiveAt: Date.now(),
    });
  },
});

/** Internal Mutation: Update agent action and target */
export const updateAction = internalMutation({
  args: {
    agentId: v.id("agents"),
    action: v.union(
      v.literal("idle"),
      v.literal("walking"),
      v.literal("eating"),
      v.literal("sleeping"),
      v.literal("talking"),
      v.literal("listening"),
      v.literal("working"),
      v.literal("exploring")
    ),
    targetX: v.optional(v.number()),
    targetY: v.optional(v.number()),
    interactionPartnerId: v.optional(v.id("agents")),
    lastThought: v.optional(v.string()),
    speech: v.optional(v.string()),
    lastSpeechAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { agentId, action, ...updates } = args;
    await ctx.db.patch(agentId, {
      currentAction: action,
      ...updates,
      lastActiveAt: Date.now(),
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

    const nearbyAgents = await ctx.runQuery(internal.functions.agents.getNearbyAgents, {
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
      const history = [type, ...(relationship.valenceHistory || [])].slice(0, 5) as ("positive" | "negative" | "neutral")[];
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

/** Internal Mutation: Update agent identity traits */
export const updateIdentity = internalMutation({
  args: {
    agentId: v.id("agents"),
    newTraits: v.array(v.string()),
    lastReflectedTick: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return;

    // Merge traits and keep unique ones, limited to 10
    const combinedTraits = Array.from(new Set([...agent.coreTraits, ...args.newTraits])).slice(0, 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: any = {
      coreTraits: combinedTraits,
    };
    if (args.lastReflectedTick !== undefined) {
      patch.lastReflectedTick = args.lastReflectedTick;
    }

    await ctx.db.patch(args.agentId, patch);
  },
});

/** Internal Mutation: Set conversation state */
export const setConversationState = internalMutation({
  args: {
    agentId: v.id("agents"),
    partnerId: v.id("agents"),
    role: v.union(v.literal("initiator"), v.literal("responder")),
    turnCount: v.number(),
    myLastSpeech: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get existing agent to preserve startedAt if re-entering conversation
    const agent = await ctx.db.get(args.agentId);
    const existingStartedAt = agent?.conversationState?.startedAt;

    await ctx.db.patch(args.agentId, {
      conversationState: {
        partnerId: args.partnerId,
        role: args.role,
        turnCount: args.turnCount,
        myLastSpeech: args.myLastSpeech,
        startedAt: existingStartedAt ?? Date.now(),
      },
    });
  },
});

/** Internal Mutation: Clear conversation state */
export const clearConversationState = internalMutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      conversationState: undefined,
    });
  },
});

/** Internal Mutation: Reset partner's state when conversation ends */
export const resetConversationEnd = internalMutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      currentAction: "idle",
      interactionPartnerId: undefined,
      conversationState: undefined,
      speech: undefined,
    });
  },
});

/**
 * Query: Get all agents with active conversation states
 */
export const getActiveConversations = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("agents")
      .filter((q) => q.neq(q.field("conversationState"), undefined))
      .collect();
    return agents;
  },
});

/**
 * Mutation: Migrate deprecated archetypes to supported ones
 */
export const migrateArchetypes = mutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const deprecatedMap: Record<string, "socialite" | "philosopher" | "explorer"> = {
      friendly: "socialite",
      grumpy: "philosopher",
      curious: "explorer",
    };

    let count = 0;
    for (const agent of agents) {
      const newArch = deprecatedMap[agent.archetype];
      if (newArch) {
        await ctx.db.patch(agent._id, {
          archetype: newArch,
        });
        count++;
      }
    }
    return { migratedCount: count };
  },
});

