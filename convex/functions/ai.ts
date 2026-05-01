import { action, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import { getAiConfig, chatCompletion, ARCHETYPE_PROMPTS } from "./ai_helpers";

export { analyzeSentiment } from "./sentiment";

const DECISION_SYSTEM_PROMPT = `
You MUST return your decision in the following JSON format:
{
  "thought": "Internal monologue describing your reasoning (1-2 sentences)",
  "action": "idle | walking | eating | sleeping | talking | working | exploring",
  "target": "target_name, coordinates 'x,y', or 'none'",
  "speech": "What you say aloud if you choose the 'talking' action (or empty string)",
  "confidence": 0.0 to 1.0 (how sure you are about this decision)
}
`;
const REFLECTION_SYSTEM_PROMPT = `
You are the subconscious of an AI agent. 
Review the agent's recent sensory events and identify significant patterns or important memories.

You MUST return your reflection in the following JSON format:
{
  "memories": [
    {
      "content": "A concise summary of an important event or insight",
      "importance": 1 to 10 (how significant this is for the agent's personality)
    }
  ],
  "evolutionTraits": ["new_trait1", "new_trait2"],
  "thought": "Your reasoning for these reflections"
}
`;
/** Build a structured user prompt from agent state and context data */
function buildContextPrompt(
  agentState: { name: string; hunger: number; energy: number; social: number; currentAction: string },
  context?: {
    agentContext?: string;
    relationshipContext?: string;
    events?: string;
    memories?: string;
    conversationContext?: string;
    poiContext?: string;
  },
): string {
  let prompt = "";
  prompt += `## Your Identity\n`;
  if (context?.agentContext) {
    prompt += context.agentContext;
  }
  if (!prompt.endsWith("\n")) prompt += "\n";
  prompt += "\n";
  prompt += `## Your State\n`;
  prompt += `Current Action: ${agentState.currentAction}\n`;
  prompt += `Hunger: ${agentState.hunger}\n`;
  prompt += `Energy: ${agentState.energy}\n`;
  prompt += `Social: ${agentState.social}\n`;
  prompt += "\n";
  if (context?.relationshipContext) {
    prompt += `## Your Relationships\n`;
    prompt += context.relationshipContext;
    prompt += "\n";
  }
  if (context?.events) {
    prompt += `## Recent Events\n`;
    prompt += context.events;
    prompt += "\n";
  }
  if (context?.memories) {
    prompt += `## Relevant Memories\n`;
    prompt += context.memories;
    prompt += "\n";
  }
  if (context?.poiContext) {
    prompt += `## Nearby Locations\n`;
    prompt += context.poiContext;
    prompt += "\n";
    prompt += `Activity suggestions:\n`;
    prompt += `- eating → Cozy Cafe\n`;
    prompt += `- working → The Great Library\n`;
    prompt += `- talking → Central Plaza\n`;
    prompt += `- exploring → Forest Grove\n`;
    prompt += `\nValid destinations: Cozy Cafe, The Great Library, Central Plaza, Forest Grove.\n`;
    prompt += `Do not invent locations.\n\n`;
  }
  if (context?.conversationContext) {
    prompt += context.conversationContext;
    prompt += "\n";
  }
  prompt += `Based on ALL of the above context, what is your next action? Consider your personality, relationships, recent experiences, and current state.`;
  return prompt;
}
export const decision = action({
  args: {
    agentState: v.object({
      name: v.string(),
      hunger: v.number(),
      energy: v.number(),
      social: v.number(),
      currentAction: v.string(),
      model: v.optional(v.string()),
    }),
    nearbyAgents: v.array(v.string()),
    archetype: v.union(v.literal("builder"), v.literal("socialite"), v.literal("philosopher"), v.literal("explorer"), v.literal("nurturer")),
    agentContext: v.optional(v.string()),
    relationshipContext: v.optional(v.string()),
    events: v.optional(v.string()),
    memories: v.optional(v.string()),
    conversationContext: v.optional(v.string()),
    poiContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { apiKey, baseUrl, model } = await getAiConfig(ctx, args.agentState.model);

    if (!apiKey) {
      // Mock decision logic
      let action = "idle";
      let speech = "";
      if (args.agentState.hunger > 70) action = "eating";
      else if (args.agentState.energy < 30) action = "sleeping";
      else if (args.nearbyAgents.length > 0 && args.archetype === "socialite") {
        action = "talking";
        speech = `Hello ${args.nearbyAgents[0]}! How are you today?`;
      }
      else if (args.archetype === "explorer") action = "exploring";

      return {
        thought: `[MOCK] Based on hunger ${args.agentState.hunger} and archetype ${args.archetype}`,
        action,
        target: args.nearbyAgents[0] || "none",
        speech,
        confidence: 0.9,
      };
    }

    const systemPrompt = `${DECISION_SYSTEM_PROMPT}\n${ARCHETYPE_PROMPTS[args.archetype]}`;

    const userPrompt = buildContextPrompt(args.agentState, {
      agentContext: args.agentContext,
      relationshipContext: args.relationshipContext,
      events: args.events,
      memories: args.memories,
      conversationContext: args.conversationContext,
      poiContext: args.poiContext,
    });

    try {
      const content = await chatCompletion(
        { apiKey, baseUrl, model },
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          responseFormat: {
            type: "json_schema",
            json_schema: {
              name: "agent-decision",
              schema: {
                type: "object",
                properties: {
                  thought: { type: "string" },
                  action: { type: "string", enum: ["idle", "walking", "eating", "sleeping", "talking", "working", "exploring"] },
                  target: { type: "string" },
                  speech: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["thought", "action", "target", "speech", "confidence"],
              },
            },
          },
        }
      );

      try {
        return typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        console.error("Failed to parse AI response:", content);
        return {
          thought: "I am having trouble thinking clearly.",
          action: "idle",
          target: "none",
          speech: "",
          confidence: 0,
        };
      }
    } catch (error) {
      console.error("[AI] Decision error:", error);
      let action = "idle";
      let speech = "";
      if (args.agentState.hunger > 70) action = "eating";
      else if (args.agentState.energy < 30) action = "sleeping";
      else if (args.nearbyAgents.length > 0 && args.archetype === "socialite") {
        action = "talking";
        speech = "I was feeling a bit tired, but it is nice to see you.";
      }
      else if (args.archetype === "explorer") action = "exploring";

      return {
        thought: `[MOCK] Rate limited - using mock decision (Model: ${model})`,
        action,
        target: args.nearbyAgents[0] || "none",
        speech,
        confidence: 0.5,
      };
    }
  },
});

/**
 * Action: Compute recency-weighted affinity
 */
export const computeRecencyWeightedAffinity = action({
  args: {
    lastInteractionAt: v.number(),
    currentTime: v.number(),
    affinity: v.number(),
  },
  handler: async (_ctx, args): Promise<number> => {
    // Calculate days since last interaction
    const daysSince = (args.currentTime - args.lastInteractionAt) / (1000 * 60 * 60 * 24);
    
    // Decay factor: weight = exp(-daysSince * 0.1)
    const weight = Math.exp(-daysSince * 0.1);
    
    // Weighted affinity
    const weightedAffinity = args.affinity * weight;
    
    return weightedAffinity;
  },
});

/**
 * Action: Build relationship context string for an agent
 */
export const buildRelationshipContext = action({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args): Promise<string> => {
    // Get all relationships for this agent
    const relationships = await ctx.runQuery(api.functions.agents.getRelationships, {
      agentId: args.agentId,
    });

    if (relationships.length === 0) {
      return "You have no established relationships with other agents.\n";
    }

    const currentTime = Date.now();
    let context = "Your Relationships:\n";

    for (const rel of relationships) {
      // Compute recency-weighted affinity
      const weightedAffinity = await ctx.runAction(api.functions.ai.computeRecencyWeightedAffinity, {
        lastInteractionAt: rel.lastInteractionAt,
        currentTime,
        affinity: rel.affinity,
      });

      const affinitySign = weightedAffinity > 0 ? "+" : "";
      const sentiment = weightedAffinity > 10 ? "like" : weightedAffinity > 0 ? "are friendly with" : weightedAffinity < -10 ? "dislike" : "are neutral toward";
      
      context += `- You ${sentiment} ${rel.otherAgentName} (affinity: ${affinitySign}${weightedAffinity.toFixed(1)})\n`;
    }

    return context;
  },
});

/**
 * Internal Query: Build prompt context for an agent
 */
export const buildAgentContext = internalQuery({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args): Promise<string> => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return "";

    const archetype = await ctx.db
      .query("archetypes")
      .withIndex("by_name", (q) => q.eq("name", agent.archetype))
      .first();

    const basePrompt = archetype?.basePrompt ?? "";
    const traits = agent.coreTraits.join(", ");
    const inventory = agent.inventory.length > 0 ? agent.inventory.join(", ") : "None";

    let context = `Name: ${agent.name}\n`;
    context += `Archetype: ${agent.archetype}\n`;
    context += `Biography: ${agent.bio}\n`;
    context += `Traits: ${traits}\n`;
    context += `Inventory: ${inventory}\n`;
    context += `Current Goal: ${agent.currentGoal}\n\n`;
    context += `Personality & Instructions: ${basePrompt}\n`;
    context += `Current Position: (${agent.gridX}, ${agent.gridY})\n`;
    if (agent.targetX !== undefined && agent.targetY !== undefined) {
      const dist = Math.round(Math.sqrt((agent.targetX - agent.gridX) ** 2 + (agent.targetY - agent.gridY) ** 2));
      context += `Destination: (${agent.targetX}, ${agent.targetY})\nDistance Remaining: ~${dist} tiles\n`;
    } else {
      context += `Destination: None\n`;
    }
    return context;
  },
});
/** Action: Build full context with identity, relationships, and memories */
export const buildFullContext = action({
  args: {
    agentId: v.id("agents"),
    query: v.string(),
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, args): Promise<{
    agentContext: string;
    relationshipContext: string;
    events: string;
    memories: string;
    poiContext: string;
  }> => {
    const agentContext = await ctx.runQuery(internal.functions.ai.buildAgentContext, {
      agentId: args.agentId,
    });

    const relationshipContext = await ctx.runAction(api.functions.ai.buildRelationshipContext, {
      agentId: args.agentId,
    });

    const memoriesResult = await ctx.runAction(api.functions.memory.retrieveMemoriesAction, {
      agentId: args.agentId,
      query: args.query,
      embedding: args.embedding,
    });

    const events = await ctx.runQuery(api.functions.memory.getEvents, {
      agentId: args.agentId,
    });

    // Build events string (without the header — the user prompt builder adds it)
    let eventsStr = "";
    if (events && events.length > 0) {
      const sortedEvents = [...events].sort(
        (a, b) => a._creationTime - b._creationTime,
      );
      const now = Date.now();
      sortedEvents.forEach((event) => {
        const minutesAgo = Math.floor((now - event._creationTime) / 60000);
        const timeLabel = minutesAgo < 1 ? "<1 min ago" : `${minutesAgo} min ago`;
        eventsStr += `- [${timeLabel}] ${event.type}: ${event.description}\n`;
      });
    } else {
      eventsStr += "(No recent events)\n";
    }

    // Build memories string (without the header)
    let memoriesStr = "";
    if (memoriesResult && memoriesResult.length > 0) {
      for (const m of memoriesResult) {
        memoriesStr += `- ${m.content}\n`;
      }
    } else {
      memoriesStr += "(No relevant memories)\n";
    }

    // Build POI context sorted by distance
    const pois = await ctx.runQuery(api.functions.world.getPois);
    let poiContext = "";
    if (pois && pois.length > 0) {
      const agentDoc = await ctx.runQuery(api.functions.agents.getById, { agentId: args.agentId });
      const agentGridX = agentDoc?.gridX ?? 0;
      const agentGridY = agentDoc?.gridY ?? 0;
      const sortedPois = [...pois].map((poi) => {
        const dx = poi.gridX - agentGridX;
        const dy = poi.gridY - agentGridY;
        return { ...poi, distance: Math.sqrt(dx * dx + dy * dy) };
      }).sort((a, b) => a.distance - b.distance);
      for (const poi of sortedPois) {
        poiContext += `- ${poi.name} (${poi.gridX}, ${poi.gridY}): ${poi.description} [${poi.distance.toFixed(1)} tiles away]\n`;
      }
    }
    return {
      agentContext, relationshipContext,
      events: eventsStr, memories: memoriesStr,
      poiContext,
    };
  },
});

/**
 * Action: Reflect on recent experiences and update identity
 */
export const reflect = action({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const { apiKey, baseUrl, model } = await getAiConfig(ctx);

    const context = await ctx.runQuery(internal.functions.ai.buildAgentContext, {
      agentId: args.agentId,
    });

    const events = await ctx.runQuery(api.functions.memory.getEvents, {
      agentId: args.agentId,
    });

    if (!apiKey) {
      // Mock reflection
      await ctx.runMutation(internal.functions.agents.updateIdentity, {
        agentId: args.agentId,
        newTraits: ["reflective"],
      });
      // Add a mock memory
      await ctx.runMutation(internal.functions.memory.insertMemory, {
        agentId: args.agentId,
        content: "Mock reflection memory",
        embedding: new Array(768).fill(0),
        type: "reflection",
        importance: 8,
      });
      return { success: true };
    }

    const eventLog = events.map((e: Doc<"events">) => `- ${e.description}`).join("\n");
    const userPrompt = `
    Agent Context:
    ${context}

    Recent Events:
    ${eventLog}

    Reflect on these experiences. What is worth remembering? Has the agent changed?
    `;

    try {
      const content = await chatCompletion(
        { apiKey, baseUrl, model },
        [
          { role: "system", content: REFLECTION_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        {
          responseFormat: {
            type: "json_schema",
            json_schema: {
              name: "agent-reflection",
              schema: {
                type: "object",
                properties: {
                  memories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        importance: { type: "number" },
                      },
                      required: ["content", "importance"],
                    },
                  },
                  evolutionTraits: { type: "array", items: { type: "string" } },
                  thought: { type: "string" },
                },
                required: ["memories", "evolutionTraits", "thought"],
              },
            },
          },
        }
      );

      const reflection = typeof content === "string" ? JSON.parse(content) : content;

      // 1. Update identity traits
      if (reflection.evolutionTraits && reflection.evolutionTraits.length > 0) {
        await ctx.runMutation(internal.functions.agents.updateIdentity, {
          agentId: args.agentId,
          newTraits: reflection.evolutionTraits,
        });
      }

      // 2. Save high-importance memories in parallel
      if (reflection.memories) {
        const importantMemories = reflection.memories.filter((m: { content: string; importance: number }) => m.importance >= 5);
        await Promise.all(importantMemories.map(async (memory: { content: string; importance: number }) => {
          await ctx.runAction(api.functions.memory.addSemanticMemory, {
            agentId: args.agentId,
            content: memory.content,
          });
        }));
      }

      return { success: true };
    } catch (error) {
      console.error("[AI] Reflection error:", error);
      return { success: false };
    }
  },
});