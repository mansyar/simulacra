import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Agent document type (from schema)
 */
export type AgentDoc = Doc<"agents">;

/**
 * Arguments for creating a new agent
 */
export interface CreateAgentArgs {
  name: string;
  archetype: "builder" | "socialite" | "philosopher" | "explorer" | "nurturer";
  gridX: number;
  gridY: number;
  spriteVariant?: number;
}

/**
 * Arguments for updating agent position
 */
export interface UpdatePositionArgs {
  agentId: Id<"agents">;
  targetX: number;
  targetY: number;
}

/**
 * Query: Get all active agents
 */
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

/**
 * Query: Get a single agent by ID
 */
export const getById = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    const agent = await ctx.db.get(agentId);
    return agent;
  },
});

/**
 * Mutation: Create a new agent
 */
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
    };
    const agentId = await ctx.db.insert("agents", newAgent);
    return agentId;
  },
});

/**
 * Mutation: Update agent position
 */
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
      targetX: boundedX,
      targetY: boundedY,
      lastActiveAt: Date.now(),
    });
    return { success: true };
  },
});