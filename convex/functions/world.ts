import { query, mutation, action, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

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
 * Query: Get sleep mode configuration
 */
export const getSleepConfig = query({
  args: {},
  handler: async () => {
    return {
      roomId: process.env.PRESENCE_ROOM_ID || "main-app",
      enableSleepMode: process.env.ENABLE_SLEEP_MODE === "true",
      gracePeriod: parseInt(process.env.SLEEP_MODE_GRACE_PERIOD || "30000"),
    };
  },
});

/**
 * Query: Get all points of interest
 */
export const getPois = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pois").collect();
  },
});

/**
 * Query: Get relationship between two agents
 */
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
    return action as any;
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

    // 1. Advance Time (Assume 1 tick = 30 simulated minutes, 30 mins * 48 ticks = 1440 mins (24 hours))
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
// Internal function to handle conversation state updates
async function handleConversationState(ctx: any, agent: any, normalizedAction: string, targetAgentId: string | undefined, speech: string | undefined): Promise<void> {
  const wasInConversation = agent.conversationState !== undefined;
  const isTalking = normalizedAction === "talking";
  
  if (isTalking && targetAgentId) {
    const partner = await ctx.runQuery(api.functions.agents.getById, { agentId: targetAgentId });
    if (partner) {
      const newTurnCount = wasInConversation ? (agent.conversationState?.turnCount || 0) + 1 : 1;
      await ctx.runMutation(internal.functions.agents.setConversationState, {
        agentId: agent._id, partnerId: targetAgentId,
        role: wasInConversation ? agent.conversationState!.role : "initiator",
        turnCount: newTurnCount, lastPartnerSpeech: speech,
      });
    }
  } else if (wasInConversation) {
    await ctx.runMutation(internal.functions.agents.clearConversationState, { agentId: agent._id });
  }
}

// Helper function to process a single agent
async function processAgent(ctx: any, agent: any, agents: any[], worldState: any, interactionRadius: number, speedMultiplier: number): Promise<void> {
  // Safety Layer: Check for critical needs
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
  if (agent.currentAction === "listening") return;

  await ctx.runMutation(internal.functions.agents.updateNeeds, { agentId: agent._id });

  // Reflection Logic
  const currentTicks = worldState?.totalTicks || 0;
  const lastReflected = agent.lastReflectedTick || 0;
  const jitter = Math.floor(Math.random() * 40) - 20;
  if (currentTicks - lastReflected > (480 + jitter)) {
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

  const nearbyAgents = agents.filter((a: any) => a._id !== agent._id && Math.sqrt((a.gridX - agent.gridX)**2 + (a.gridY - agent.gridY)**2) < interactionRadius).map((a: any) => a.name);
  const validArchetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"];
  const aiArchetype = validArchetypes.includes(agent.archetype) ? agent.archetype : "builder";

  // Conversation context
  let conversationContext = "";
  if (agent.conversationState) {
    const convState = agent.conversationState;
    const partner = agents.find((a: any) => a._id === convState.partnerId);
    const partnerName = partner?.name || "Unknown";
    conversationContext = `\n\nACTIVE CONVERSATION:\nYou are in a conversation with ${partnerName}.\nYour role: ${convState.role}\nTurn count: ${convState.turnCount}/5\n`;
    if (convState.lastPartnerSpeech) conversationContext += `What ${partnerName} just said: "${convState.lastPartnerSpeech}"\n`;
    conversationContext += `If you want to continue the conversation, respond to what ${partnerName} said. To end it, change your action to something other than 'talking'.\n`;
  }

  const nearbyAgentNames = nearbyAgents.length > 0 ? nearbyAgents.join(", ") : "no one";
  const fullContext = await ctx.runAction(api.functions.ai.buildFullContext, {
    agentId: agent._id, query: `What should I do next given my goal ${agent.currentGoal}, current state, and interactions with ${nearbyAgentNames}?`,
  });

  const decision = await ctx.runAction(api.functions.ai.decision, {
    agentState: { name: agent.name, hunger: agent.hunger, energy: agent.energy, social: agent.social, model: agent.model },
    nearbyAgents, archetype: aiArchetype, contextOverride: fullContext + conversationContext,
  });

  const normalizedAction = normalizeAction(decision.action);
  let targetAgentId: Id<"agents"> | undefined;
  if (normalizedAction === "talking") {
    const targetAgent = agents.find((a: any) => a.name === decision.target);
    if (targetAgent && targetAgent._id !== agent._id) {
      targetAgentId = targetAgent._id;
      await ctx.runMutation(internal.functions.agents.updateAction, { agentId: targetAgentId, action: "listening", interactionPartnerId: agent._id });
      await ctx.runMutation(internal.functions.agents.updateRelationship, { agentAId: agent._id, agentBId: targetAgentId, delta: 2 });
    }
  }

  let targetX: number | undefined, targetY: number | undefined;
  if (decision.target && decision.target !== "none" && normalizedAction !== "talking") {
    const coords = decision.target.split(",");
    if (coords.length === 2) {
      const x = parseFloat(coords[0]), y = parseFloat(coords[1]);
      if (!isNaN(x) && !isNaN(y)) { targetX = x; targetY = y; }
    }
    if (targetX === undefined) {
      const targetAgent = agents.find((a: any) => a.name === decision.target);
      if (targetAgent) { targetX = targetAgent.gridX; targetY = targetAgent.gridY; }
    }
  }

  await handleConversationState(ctx, agent, normalizedAction, targetAgentId, decision.speech);
  await ctx.runMutation(internal.functions.agents.updateAction, {
    agentId: agent._id, action: normalizedAction, targetX, targetY, interactionPartnerId: targetAgentId,
    lastThought: decision.thought, speech: decision.speech, lastSpeechAt: decision.speech ? Date.now() : undefined,
  });

  if (normalizedAction === "exploring" && targetX === undefined) {
    const randomX = Math.floor(Math.random() * 64), randomY = Math.floor(Math.random() * 64);
    await ctx.runMutation(internal.functions.agents.updateAction, { agentId: agent._id, action: "exploring", targetX: randomX, targetY: randomY });
  }

  let description = `Thought: ${decision.thought} | Action: ${normalizedAction}`;
  if (decision.speech) description += ` | Said: "${decision.speech}"`;
  await ctx.runMutation(api.functions.memory.addEvent, { agentId: agent._id, type: decision.speech ? "conversation" : "movement", description, gridX: agent.gridX, gridY: agent.gridY });
}

// Action: Process a world tick
export const tick = action({
  args: { skipSleep: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<{ success: boolean; skipped?: boolean; reason?: string; agentCount?: number }> => {
    console.log("[WORLD] Starting tick processing...");
    const enableSleepMode = process.env.ENABLE_SLEEP_MODE === "true";
    const skipSleep = args.skipSleep ?? false;
    
    if (enableSleepMode && !skipSleep) {
      const sleepStatus = await ctx.runAction(api.functions.world.checkSleepMode);
      if (sleepStatus.sleeping) {
        console.log(`[WORLD] Skipping tick - sleep mode active: ${sleepStatus.reason}`);
        return { success: true, skipped: true, reason: sleepStatus.reason };
      }
    }

    const agents = await ctx.runQuery(api.functions.agents.getAll);
    console.log(`[WORLD] Processing ${agents.length} active agents`);
    const worldState = await ctx.runQuery(api.functions.world.getState);
    const config = await ctx.runQuery(api.functions.config.get);
    const interactionRadius = config?.interactionRadius ?? 5;
    const weather = worldState?.weather || "sunny";
    const weatherMultipliers: Record<string, number> = { sunny: 1.0, cloudy: 1.0, rainy: 0.8, stormy: 0.5 };
    const speedMultiplier = weatherMultipliers[weather] || 1.0;
    const BATCH_SIZE = 3, BATCH_DELAY_MS = 1000;

    for (let i = 0; i < agents.length; i += BATCH_SIZE) {
      const batch = agents.slice(i, i + BATCH_SIZE);
      console.log(`[WORLD] Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(agents.length / BATCH_SIZE)}`);
      await Promise.all(batch.map(async (agent: any) => processAgent(ctx, agent, agents, worldState, interactionRadius, speedMultiplier)));
      if (i + BATCH_SIZE < agents.length) await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }

    console.log("[WORLD] Advancing world state...");
    await ctx.runMutation(internal.functions.world.advanceWorldState);
    console.log("[WORLD] Tick processing complete.");
    return { success: true, skipped: false, agentCount: agents.length };
  },
});
