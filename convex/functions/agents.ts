import { query, mutation, internalMutation } from "../_generated/server";
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
    const defaultTraits: Record<string, string[]> = {
      builder: ["organized", "focused"],
      socialite: ["friendly", "bubbly"],
      philosopher: ["introspective", "calm"],
      explorer: ["adventurous", "curious"],
      nurturer: ["caring", "protective"],
    };

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
      coreTraits: defaultTraits[args.archetype] ?? [],
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

    const dx = agent.targetX - agent.gridX;
    const dy = agent.targetY - agent.gridY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.1) {
      const agentSpeedConfig = await ctx.db.query("config").first();
      const AGENT_SPEED = agentSpeedConfig?.agentSpeed ?? 6; // grid units per tick
      const moveDistance = AGENT_SPEED * args.speedMultiplier;
      const ratio = Math.min(1, moveDistance / distance);
      const arrived = ratio === 1;
      
      const newX = arrived ? agent.targetX : agent.gridX + dx * ratio;
      const newY = arrived ? agent.targetY : agent.gridY + dy * ratio;

      await ctx.db.patch(args.agentId, {
        gridX: newX,
        gridY: newY,
        targetX: arrived ? undefined : agent.targetX,
        targetY: arrived ? undefined : agent.targetY,
        lastActiveAt: Date.now(),
      });

      return { arrived, newX, newY };
    }
    
    // Snapping for distance < 0.1
    await ctx.db.patch(args.agentId, {
      gridX: agent.targetX,
      gridY: agent.targetY,
      targetX: undefined,
      targetY: undefined,
      lastActiveAt: Date.now(),
    });
    return { arrived: true, newX: agent.targetX, newY: agent.targetY };
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
    // POI location-based need multipliers (FR5)
    const poiMap: Record<string, string> = { eating: "cafe", working: "library", talking: "plaza", exploring: "nature" };
    const poiType = poiMap[agent.currentAction];
    if (poiType) {
      const pois = await ctx.db.query("pois").collect();
      const hasPoi = pois.some((p) => p.type === poiType && Math.abs(p.gridX - agent.gridX) <= 1 && Math.abs(p.gridY - agent.gridY) <= 1);
      if (hasPoi) {
        if (hungerDelta < 0) hungerDelta = Math.round(hungerDelta * 2); else hungerDelta = Math.round(hungerDelta * 0.5);
        if (energyDelta > 0) energyDelta = Math.round(energyDelta * 2); else energyDelta = Math.round(energyDelta * 0.5);
        if (socialDelta > 0) socialDelta = Math.round(socialDelta * 2); else socialDelta = Math.round(socialDelta * 0.5);
      }
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

    // Merge traits and keep unique ones, limited by config maxTraits
    const traitsConfig = await ctx.db.query("config").first();
    const maxTraits = traitsConfig?.maxTraits ?? 10;
    const combinedTraits = Array.from(new Set([...agent.coreTraits, ...args.newTraits])).slice(0, maxTraits);

    const patch: Partial<Doc<"agents">> = {
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

/** Query: Get all agents with active conversation states */
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

