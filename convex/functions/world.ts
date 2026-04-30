import { query, mutation, action, internalMutation, type ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { analyzeSentiment } from "./sentiment";

// Query: Get the current world state
export const getState = query({ args: {}, handler: async (ctx) => await ctx.db.query("world_state").first() });
// Query: Get sleep mode configuration
export const getSleepConfig = query({
  args: {},
  handler: async () => ({
    roomId: process.env.PRESENCE_ROOM_ID || "main-app",
    enableSleepMode: process.env.ENABLE_SLEEP_MODE === "true",
    gracePeriod: parseInt(process.env.SLEEP_MODE_GRACE_PERIOD || "30000"),
  }),
});
// Query: Get all points of interest
export const getPois = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("pois").collect(),
});
// Query: Get relationship between two agents
export const getRelationship = query({
  args: {
    agentAId: v.id("agents"),
    agentBId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const [id1, id2] = args.agentAId < args.agentBId 
      ? [args.agentAId, args.agentBId] 
      : [args.agentBId, args.agentAId];

    return await ctx.db
      .query("relationships")
      .withIndex("by_agents", (q) => q.eq("agentAId", id1).eq("agentBId", id2))
      .first();
  },
});
// Mutation: Update the world state
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
    lastUserActivityAt: v.optional(v.number()),
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
        lastUserActivityAt: args.lastUserActivityAt ?? Date.now(),
      });
    }
    return { success: true };
  },
});

/**
 * Action: Check and update sleep mode status
 */
export const checkSleepMode = action({
  args: {},
  handler: async (ctx): Promise<{ sleeping: boolean; reason: string; timeSinceLastTick?: number }> => {
    const enableSleepMode = process.env.ENABLE_SLEEP_MODE === "true";
    if (!enableSleepMode) {
      return { sleeping: false, reason: "Sleep mode disabled" };
    }

    const state = await ctx.runQuery(api.functions.world.getState);
    if (!state) {
      return { sleeping: false, reason: "No world state" };
    }

    const now = Date.now();
    const roomId = process.env.PRESENCE_ROOM_ID || "main-app";
    // Check real-time presence
    const activeUsers = await ctx.runQuery(api.presence.list, { roomToken: roomId });
    const userCount = activeUsers.length;

    console.log(`[SLEEP] Checking presence in room "${roomId}". Found ${userCount} users.`);

    if (userCount > 0) {
      // Users are present, update activity timestamp
      await ctx.runMutation(api.functions.world.updateState, { lastUserActivityAt: now });
      return { sleeping: false, reason: `${userCount} active users present` };
    }

    // No users present, check grace period
    const lastActivity = state.lastUserActivityAt || state.lastTickAt || 0;
    const timeSinceLastActivity = now - lastActivity;
    const gracePeriod = parseInt(process.env.SLEEP_MODE_GRACE_PERIOD || "30000");
    if (timeSinceLastActivity < gracePeriod) {
      return { sleeping: false, reason: `No users, but within grace period (${Math.round((gracePeriod - timeSinceLastActivity) / 1000)}s left)` };
    }
    // Beyond grace period, stop immediately
    return { sleeping: true, reason: `Inactive for ${Math.round(timeSinceLastActivity / 1000)}s (grace period: ${gracePeriod/1000}s)`, timeSinceLastTick: now - (state.lastTickAt || now) };
  },
});

// Normalizes an action string from the AI to a valid AgentAction
function normalizeAction(action: string): "idle" | "walking" | "eating" | "sleeping" | "talking" | "working" | "exploring" {
  const validActions = ["idle", "walking", "eating", "sleeping", "talking", "working", "exploring"];
  if (validActions.includes(action)) {
    return action as "idle" | "walking" | "eating" | "sleeping" | "talking" | "working" | "exploring";
  }

  // Map common hallucinations
  if (action.includes("food") || action.includes("eat")) return "eating";
  if (action.includes("sleep") || action.includes("rest") || action.includes("bed")) return "sleeping";
  if (action.includes("walk") || action.includes("move") || action.includes("go")) return "walking";
  if (action.includes("talk") || action.includes("chat") || action.includes("greet")) return "talking";
  if (action.includes("work") || action.includes("build")) return "working";
  if (action.includes("explore") || action.includes("look")) return "exploring";

  return "idle";
}

// Internal Mutation: Advance simulated time and update weather
export const advanceWorldState = internalMutation({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db.query("world_state").first();
    if (!state) return;

    // 1. Advance Time (1 tick = 30 min, 48 ticks = 24h)
    let newTime = (state.timeOfDay || 0) + 30;
    let newDayCount = state.dayCount || 1;
    if (newTime >= 1440) {
      newTime = newTime % 1440;
      newDayCount += 1;
    }

    // 2. Stochastic Weather (80% chance to stay same)
    const weatherOptions = ["sunny", "cloudy", "rainy", "stormy"] as const;
    let newWeather = state.weather;
    
    if (Math.random() > 0.8) {
      const otherOptions = weatherOptions.filter(w => w !== state.weather);
      newWeather = otherOptions[Math.floor(Math.random() * otherOptions.length)];
      
      // Log weather change event
      await ctx.db.insert("events", {
        type: "weather_change",
        description: `The weather has changed from ${state.weather} to ${newWeather}.`,
        gridX: 0,
        gridY: 0,
      });
    }

    await ctx.db.patch(state._id, {
      timeOfDay: newTime,
      dayCount: newDayCount,
      weather: newWeather,
      totalTicks: (state.totalTicks || 0) + 1,
      lastTickAt: Date.now(),
    });
  },
});
/** Handle conversation state updates */
async function handleConversationState(ctx: ActionCtx, agent: Doc<"agents">, normalizedAction: string, targetAgentId: Id<"agents"> | undefined, speech: string | undefined): Promise<void> {
  const wasInConversation = agent.conversationState !== undefined;
  const isTalking = normalizedAction === "talking";
  
  if (isTalking && targetAgentId) {
    const newTurnCount = wasInConversation ? (agent.conversationState?.turnCount || 0) + 1 : 1;
    await ctx.runMutation(internal.functions.agents.setConversationState, {
      agentId: agent._id, partnerId: targetAgentId,
      role: wasInConversation ? agent.conversationState!.role : "initiator",
      turnCount: newTurnCount, myLastSpeech: speech,
    });
    // Partner reads myLastSpeech from in-memory agents array (FR4.2)
  } else if (wasInConversation) {
    await ctx.runMutation(internal.functions.agents.clearConversationState, { agentId: agent._id });
    // Clear partner's state via dedicated mutation
    const partnerId = agent.conversationState?.partnerId;
    if (partnerId) {
      await ctx.runMutation(internal.functions.agents.resetConversationEnd, { agentId: partnerId as Id<"agents"> });
    }
  }
}

// Helper: resolve target coordinates with POI name lookup and action overrides (FR2 + FR3)
async function resolveAgentTarget(
  ctx: ActionCtx,
  agent: Doc<"agents">,
  agents: Doc<"agents">[],
  decision: { target?: string },
  normalizedAction: string,
  targetAgentId: Id<"agents"> | undefined,
): Promise<{ targetX: number | undefined; targetY: number | undefined; overriddenAction: string | undefined }> {
  const pois = await ctx.runQuery(api.functions.world.getPois);
  let targetX: number | undefined, targetY: number | undefined;
  let overriddenAction: string | undefined;

  // 1. Try coordinate format
  if (decision.target && decision.target !== "none" && normalizedAction !== "talking") {
    const coords = decision.target.split(",");
    if (coords.length === 2) {
      const x = parseFloat(coords[0]), y = parseFloat(coords[1]);
      if (!isNaN(x) && !isNaN(y)) { targetX = x; targetY = y; }
    }
  }
  // 2. Try agent name lookup
  if (targetX === undefined && decision.target && decision.target !== "none") {
    const targetAgent = agents.find((a: Doc<"agents">) => a.name === decision.target);
    if (targetAgent) { targetX = targetAgent.gridX; targetY = targetAgent.gridY; }
  }
  // 3. Try POI name lookup (FR2) - case-insensitive includes() matching, closest by distance
  if (targetX === undefined && decision.target && decision.target !== "none" && pois?.length) {
    const dt = decision.target.toLowerCase();
    const matches = pois.filter((p) => p.name.toLowerCase().includes(dt) || dt.includes(p.name.toLowerCase()));
    if (matches.length > 0) {
      const closest = matches.sort((a, b) => {
        const da = Math.sqrt((a.gridX - agent.gridX) ** 2 + (a.gridY - agent.gridY) ** 2);
        const db = Math.sqrt((b.gridX - agent.gridX) ** 2 + (b.gridY - agent.gridY) ** 2);
        return da - db;
      })[0];
      targetX = closest.gridX;
      targetY = closest.gridY;
      // FR3: Override activity actions to walking (unless within 1 tile)
      const dist = Math.sqrt((closest.gridX - agent.gridX) ** 2 + (closest.gridY - agent.gridY) ** 2);
      if (dist > 1) {
        if (["eating", "sleeping", "working", "exploring"].includes(normalizedAction)) overriddenAction = "walking";
        if (normalizedAction === "talking" && !targetAgentId) overriddenAction = "walking";
      }
    }
  }
  // 4. Fallback: hallucinated → random within 5 tiles, clamped [0, 63]
  if (targetX === undefined && decision.target && decision.target !== "none" && normalizedAction !== "talking") {
    targetX = Math.max(0, Math.min(63, agent.gridX + Math.floor(Math.random() * 11) - 5));
    targetY = Math.max(0, Math.min(63, agent.gridY + Math.floor(Math.random() * 11) - 5));
  }
  return { targetX, targetY, overriddenAction };
}

// Helper function to process a single agent
async function processAgent(
  ctx: ActionCtx,
  agent: Doc<"agents">,
  agents: Doc<"agents">[],
  worldState: Doc<"world_state"> | null,
  interactionRadius: number,
  speedMultiplier: number,
  reflectionIntervalTicks: number,
  maxConversationTurns: number,
): Promise<void> {
  // Critical needs override
  if (agent.hunger > 90 || agent.energy < 10) {
    const survivalAction = agent.hunger > 90 ? "eating" : "sleeping";
    await ctx.runMutation(internal.functions.agents.updateAction, { agentId: agent._id, action: survivalAction });
    await ctx.runMutation(api.functions.memory.addEvent, {
      agentId: agent._id,
      type: survivalAction === "eating" ? "interaction" : "movement",
      description: `My ${survivalAction === "eating" ? "hunger" : "exhaustion"} is critical. I must stop to ${survivalAction}.`,
      gridX: agent.gridX, gridY: agent.gridY,
    });
    return;
  }
  await ctx.runMutation(internal.functions.agents.updateNeeds, { agentId: agent._id });

  // Reflection Logic
  const currentTicks = worldState?.totalTicks || 0;
  const lastReflected = agent.lastReflectedTick || 0;
  const jitter = Math.floor(Math.random() * 40) - 20;
  if (currentTicks - lastReflected > (reflectionIntervalTicks + jitter)) {
    void ctx.runAction(api.functions.ai.reflect, { agentId: agent._id });
    await ctx.runMutation(internal.functions.agents.updateIdentity, { agentId: agent._id, newTraits: [], lastReflectedTick: currentTicks });
  }

  // Movement Resolution
  if (agent.targetX !== undefined && agent.targetY !== undefined) {
    const result = await ctx.runMutation(internal.functions.agents.resolveMovement, { agentId: agent._id, speedMultiplier });
    if (result?.arrived) {
      await ctx.runMutation(api.functions.memory.addEvent, {
        agentId: agent._id, type: "movement",
        description: `Arrived at destination (${Math.round(result.newX)}, ${Math.round(result.newY)})`,
        gridX: result.newX, gridY: result.newY,
      });
    }
  }
  await ctx.runMutation(internal.functions.agents.recordPassivePerception, { agentId: agent._id });
  const nearbyDocs = await ctx.runQuery(internal.functions.agents.getNearbyAgents, {
    agentId: agent._id, gridX: agent.gridX, gridY: agent.gridY, radius: interactionRadius,
  });
  const nearbyAgents = nearbyDocs.map((a: Doc<"agents">) => a.name);
  const validArchetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"];
  const aiArchetype = validArchetypes.includes(agent.archetype) ? agent.archetype : "builder";

  let conversationContext = "";
  if (agent.conversationState) {
    const convState = agent.conversationState;
    const partner = agents.find((a: Doc<"agents">) => a._id === convState.partnerId);
    const partnerName = partner?.name || "Unknown";
    const myLastSpeech = agent.conversationState?.myLastSpeech;
    const partnerLastSpeech = partner?.conversationState?.myLastSpeech;
    conversationContext = `\n\nACTIVE CONVERSATION:\nYou are in a conversation with ${partnerName}.\nYour role: ${convState.role}\nTurn count: ${convState.turnCount}/${maxConversationTurns}\n`;
    if (myLastSpeech) conversationContext += `What you last said: "${myLastSpeech}"\n`;
    if (partnerLastSpeech) conversationContext += `What ${partnerName} last said: "${partnerLastSpeech}"\n`;
    else conversationContext += `You just initiated the conversation. ${partnerName} hasn't responded yet.\n`;
    conversationContext += `If you want to continue the conversation, respond to what ${partnerName} said. To end it, change your action to something other than 'talking'.\n`;
  }

  const nearbyAgentNames = nearbyAgents.length > 0 ? nearbyAgents.join(", ") : "no one";
  const context = await ctx.runAction(api.functions.ai.buildFullContext, {
    agentId: agent._id, query: `What should I do next given my goal ${agent.currentGoal}, current state, and interactions with ${nearbyAgentNames}?`,
  });

  const decision = await ctx.runAction(api.functions.ai.decision, {
    agentState: { name: agent.name, hunger: agent.hunger, energy: agent.energy, social: agent.social, model: agent.model },
    nearbyAgents, archetype: aiArchetype,
    agentContext: context.agentContext,
    relationshipContext: context.relationshipContext,
    events: context.events,
    memories: context.memories,
    conversationContext: conversationContext || undefined,
    poiContext: context.poiContext || undefined,
  });

  const normalizedAction = normalizeAction(decision.action);
  let finalAction = normalizedAction;
  let targetAgentId: Id<"agents"> | undefined;

  // Agent name resolution for talking
  if (normalizedAction === "talking") {
    const targetAgent = agents.find((a: Doc<"agents">) => a.name === decision.target);
    if (targetAgent && targetAgent._id !== agent._id) {
      targetAgentId = targetAgent._id;
      if (decision.speech) {
        const { delta } = analyzeSentiment(decision.speech);
        await ctx.runMutation(internal.functions.agents.updateRelationship, {
          agentAId: agent._id, agentBId: targetAgentId, delta,
        });
      }
    }
  }

  // Resolve target coordinates and handle POI-aware action overrides (FR2 + FR3)
  const resolveResult = await resolveAgentTarget(ctx, agent, agents, decision, normalizedAction, targetAgentId);
  const targetX = resolveResult.targetX;
  const targetY = resolveResult.targetY;
  if (resolveResult.overriddenAction) finalAction = resolveResult.overriddenAction as typeof finalAction;

  await handleConversationState(ctx, agent, finalAction, targetAgentId, decision.speech);
  await ctx.runMutation(internal.functions.agents.updateAction, {
    agentId: agent._id, action: finalAction, targetX, targetY, interactionPartnerId: targetAgentId,
    lastThought: decision.thought, speech: decision.speech, lastSpeechAt: decision.speech ? Date.now() : undefined,
  });

  if (finalAction === "exploring" && targetX === undefined) {
    const randomX = Math.floor(Math.random() * 64), randomY = Math.floor(Math.random() * 64);
    await ctx.runMutation(internal.functions.agents.updateAction, { agentId: agent._id, action: "exploring", targetX: randomX, targetY: randomY });
  }

  let description = `Thought: ${decision.thought} | Action: ${finalAction}`;
  if (decision.speech) description += ` | Said: "${decision.speech}"`;
  await ctx.runMutation(api.functions.memory.addEvent, { agentId: agent._id, type: decision.speech ? "conversation" : "movement", description, gridX: agent.gridX, gridY: agent.gridY });
}

/** Clean stale conversations exceeding TTL (DB + in-memory, partner dedup). */
async function cleanStaleConversations(ctx: ActionCtx, agents: Doc<"agents">[], config: Doc<"config"> | null): Promise<number> {
  const envTurns = parseInt(process.env.MAX_CONVERSATION_TURNS ?? "", 10);
  const envMultiplier = parseInt(process.env.SAFETY_MULTIPLIER ?? "", 10);
  const maxTurns = !isNaN(envTurns) ? envTurns : (config?.maxConversationTurns ?? 5);
  const safetyMultiplier = !isNaN(envMultiplier) ? envMultiplier : (config?.safetyMultiplier ?? 2);
  let ttlMs: number;

  if (config?.conversationMaxTtlMs != null) {
    ttlMs = config.conversationMaxTtlMs;
  } else {
    const envOverride = parseInt(process.env.CONVERSATION_MAX_TTL_MS ?? "", 10);
    ttlMs = isNaN(envOverride)
      ? maxTurns * (config?.defaultTickInterval ?? 180) * safetyMultiplier * 1000
      : envOverride;
  }

  const now = Date.now();
  const processed = new Set<string>();
  let cleanedCount = 0;

  for (const agent of agents) {
    const convState = agent.conversationState;
    if (!convState || processed.has(agent._id)) continue;
    if (now - convState.startedAt <= ttlMs) continue;

    const partner = agents.find((a: Doc<"agents">) => a._id === convState.partnerId);
    const partnerName = partner?.name ?? "Unknown";
    const staleMinutes = Math.round((now - convState.startedAt) / 60000);

    try {
      await ctx.runMutation(api.functions.memory.addEvent, {
        agentId: agent._id, type: "interaction",
        description: `Conversation with ${partnerName} ended (stale after ${staleMinutes} min).`,
        gridX: agent.gridX, gridY: agent.gridY,
      });
    } catch { /* isolated error */ }
    try { await ctx.runMutation(internal.functions.agents.resetConversationEnd, { agentId: agent._id }); }
    catch { /* isolated error */ }
    agent.conversationState = undefined;
    agent.currentAction = "idle";
    agent.interactionPartnerId = undefined;
    processed.add(agent._id);
    if (partner) {
      try {
        await ctx.runMutation(api.functions.memory.addEvent, {
          agentId: partner._id, type: "interaction",
          description: `Conversation with ${agent.name} ended (stale after ${staleMinutes} min).`,
          gridX: partner.gridX, gridY: partner.gridY,
        });
      } catch { /* isolated error */ }
      try { await ctx.runMutation(internal.functions.agents.resetConversationEnd, { agentId: partner._id }); } catch { /* isolated error */ }
      partner.conversationState = undefined;
      partner.currentAction = "idle";
      partner.interactionPartnerId = undefined;
      processed.add(partner._id);
    }
    cleanedCount++;
  }
  return cleanedCount;
}

// Action: Process a world tick
export const tick = action({
  args: { skipSleep: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<{ success: boolean; skipped?: boolean; reason?: string; agentCount?: number; tickDurationMs?: number }> => {
    const tickStart = Date.now();
    console.log("[WORLD] Starting tick processing...");
    const enableSleepMode = process.env.ENABLE_SLEEP_MODE === "true";
    const skipSleep = args.skipSleep ?? false;
    
    if (enableSleepMode && !skipSleep) {
      const sleepStatus = await ctx.runAction(api.functions.world.checkSleepMode);
      if (sleepStatus.sleeping) {
        const tickDuration = Date.now() - tickStart;
        console.log(`[WORLD] Skipping tick in ${tickDuration}ms - sleep mode active: ${sleepStatus.reason}`);
        return { success: true, skipped: true, reason: sleepStatus.reason, tickDurationMs: tickDuration };
      }
    }

    const agents = await ctx.runQuery(api.functions.agents.getAll);
    console.log(`[WORLD] Processing ${agents.length} active agents`);
    const worldState = await ctx.runQuery(api.functions.world.getState);
    const config = await ctx.runQuery(api.functions.config.get);
    const interactionRadius = config?.interactionRadius ?? 5;
    const envR = parseInt(process.env.REFLECTION_INTERVAL_TICKS ?? "", 10);
    const reflectionIntervalTicks = !isNaN(envR) ? envR : (config?.reflectionIntervalTicks ?? 480);
    const envT = parseInt(process.env.MAX_CONVERSATION_TURNS ?? "", 10);
    const maxConversationTurns = !isNaN(envT) ? envT : (config?.maxConversationTurns ?? 5);
    const weather = worldState?.weather || "sunny";
    const weatherMultipliers: Record<string, number> = { sunny: 1.0, cloudy: 1.0, rainy: 0.8, stormy: 0.5 };
    const speedMultiplier = weatherMultipliers[weather] || 1.0;
    const cleanedConvs = await cleanStaleConversations(ctx, agents, config);
    if (cleanedConvs > 0) console.log(`[WORLD] Cleaned ${cleanedConvs} stale conversations`);
    console.log(`[WORLD] Processing all ${agents.length} agents in parallel`);
    await Promise.all(agents.map(async (agent: Doc<"agents">) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await processAgent(ctx, agent, agents, worldState, interactionRadius, speedMultiplier, reflectionIntervalTicks, maxConversationTurns);
          break; // Success, exit retry loop
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[WORLD] Agent ${agent.name} failed (attempt ${attempt + 1}/2):`, errorMsg);

          if (attempt === 0) {
            try { await ctx.runMutation(api.functions.memory.addEvent, { agentId: agent._id, type: "movement", description: "Error during processing, retrying...", gridX: agent.gridX, gridY: agent.gridY }); }
            catch (innerErr) { console.warn(`[WORLD] Failed to log retry event for agent ${agent.name}:`, innerErr) }
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            try { await ctx.runMutation(api.functions.memory.addEvent, { agentId: agent._id, type: "movement", description: "Error: Skipped this tick after 2 failed attempts", gridX: agent.gridX, gridY: agent.gridY }); }
            catch (innerErr) { console.warn(`[WORLD] Failed to log skip event for agent ${agent.name}:`, innerErr) }
            console.error(`[WORLD] Agent ${agent.name} — skipped after 2 failed attempts`);
          }
        }
      }
    }));

    await ctx.runMutation(internal.functions.world.advanceWorldState);
    const tickDuration = Date.now() - tickStart;
    console.log(`[WORLD] Tick processing complete in ${tickDuration}ms (${agents.length} agents, ${(tickDuration / agents.length).toFixed(1)}ms/agent avg)`);
    return { success: true, skipped: false, agentCount: agents.length, tickDurationMs: tickDuration };
  },
});
