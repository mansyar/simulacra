import { query, internalQuery, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Mapping from config field names to env var names
const ENV_VAR_MAP: Record<string, string> = {
  maxTraits: "MAX_TRAITS",
  reflectionIntervalTicks: "REFLECTION_INTERVAL_TICKS",
  maxConversationTurns: "MAX_CONVERSATION_TURNS",
  safetyMultiplier: "SAFETY_MULTIPLIER",
  agentSpeed: "AGENT_SPEED",
};

// Hardcoded defaults for each config field
const DEFAULTS: Record<string, number> = {
  maxTraits: 10,
  reflectionIntervalTicks: 480,
  maxConversationTurns: 5,
  safetyMultiplier: 2,
  agentSpeed: 6,
};

// env var name for the world tick interval
const TICK_INTERVAL_ENV = "WORLD_TICK_INTERVAL";
const TICK_INTERVAL_DEFAULT = 180;

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("config").first();
  },
});

export const getInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("config").first();
  },
});

/**
 * Query: Get the effective world tick interval in seconds.
 * Priority: WORLD_TICK_INTERVAL env var > world_state.tickIntervalSeconds > 180
 */
export const getTickInterval = query({
  args: {},
  handler: async (ctx) => {
    // 1. Check env var
    if (process.env[TICK_INTERVAL_ENV] !== undefined) {
      const parsed = parseInt(process.env[TICK_INTERVAL_ENV]!, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    // 2. Check world_state
    const state = await ctx.db.query("world_state").first();
    if (state?.tickIntervalSeconds != null && state.tickIntervalSeconds > 0) {
      return state.tickIntervalSeconds;
    }
    // 3. Fallback
    return TICK_INTERVAL_DEFAULT;
  },
});

/**
 * Query: Get a single runtime config value with env var fallback.
 *
 * Priority: process.env.<FIELD> ?? config.<field> ?? defaultValue
 *
 * Supported fields: maxTraits, reflectionIntervalTicks, maxConversationTurns,
 * safetyMultiplier, agentSpeed
 */
export const getConfigValue = query({
  args: {
    field: v.string(),
    defaultValue: v.optional(v.float64()),
  },
  handler: async (ctx, { field, defaultValue }) => {
    const config = await ctx.db.query("config").first();
    const envVar = ENV_VAR_MAP[field];
    const defaultVal = defaultValue ?? DEFAULTS[field] ?? 0;

    // 1. Check env var
    if (envVar && process.env[envVar] !== undefined) {
      const parsed = parseInt(process.env[envVar]!, 10);
      if (!isNaN(parsed)) return parsed;
    }

    // 2. Check config table
    const configValue = (config as Record<string, unknown>)?.[field];
    if (typeof configValue === "number") return configValue;

    // 3. Fallback to default
    return defaultVal;
  },
});

/**
 * Mutation: Set a runtime config value in the config table.
 * Used for test setup and admin control.
 */
export const setConfigValue = mutation({
  args: {
    field: v.string(),
    value: v.float64(),
  },
  handler: async (ctx, { field, value }) => {
    const config = await ctx.db.query("config").first();
    if (config) {
      await ctx.db.patch(config._id, { [field]: value });
    }
    return { success: true };
  },
});

/**
 * Internal mutation: Set a config value using the internal API.
 */
export const setConfigValueInternal = internalMutation({
  args: {
    field: v.string(),
    value: v.float64(),
  },
  handler: async (ctx, { field, value }) => {
    const config = await ctx.db.query("config").first();
    if (config) {
      await ctx.db.patch(config._id, { [field]: value });
    }
    return { success: true };
  },
});
