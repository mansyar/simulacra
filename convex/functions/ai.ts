import { action, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { 
  getAiConfig, 
  chatCompletion,
  ARCHETYPE_PROMPTS 
} from "./ai_helpers";

/**
 * Keyword-based sentiment analysis for agent speech.
 * Classifies speech as positive, negative, or neutral and returns a delta value.
 * Positive keywords → +1 to +3 (intensity-graded)
 * Negative keywords → -1 to -3 (intensity-graded)
 * Neutral (no match) → 0
 */

// Positive keywords grouped by intensity
const POSITIVE_KEYWORDS: [string, number][] = [
  // +3 intensity (strong positive)
  ["wonderful", 3],
  ["amazing", 3],
  ["fantastic", 3],
  ["incredible", 3],
  ["brilliant", 3],
  ["delightful", 3],
  ["magnificent", 3],
  ["splendid", 3],
  ["marvelous", 3],
  ["outstanding", 3],
  ["glorious", 3],
  ["superb", 3],
  ["terrific", 3],
  ["excellent", 3],
  ["perfect", 3],
  // +2 intensity (moderate positive)
  ["love", 2],
  ["great", 2],
  ["happy", 2],
  ["beautiful", 2],
  ["wonderful", 3],
  ["joy", 2],
  ["pleased", 2],
  ["glad", 2],
  ["grateful", 2],
  ["thank", 2],
  ["appreciate", 2],
  ["cheerful", 2],
  ["friendly", 2],
  ["kind", 2],
  ["nice", 2],
  ["lovely", 2],
  ["pleasant", 2],
  // +1 intensity (mild positive)
  ["good", 1],
  ["fine", 1],
  ["okay", 1],
  ["alright", 1],
  ["better", 1],
  ["well", 1],
  ["agree", 1],
  ["yes", 1],
  ["sure", 1],
  ["help", 1],
  ["care", 1],
];

// Negative keywords grouped by intensity
const NEGATIVE_KEYWORDS: [string, number][] = [
  // -3 intensity (strong negative)
  ["terrible", -3],
  ["horrible", -3],
  ["awful", -3],
  ["hate", -3],
  ["despise", -3],
  ["disgusting", -3],
  ["abysmal", -3],
  ["atrocious", -3],
  ["dreadful", -3],
  ["hideous", -3],
  ["vile", -3],
  ["wretched", -3],
  ["miserable", -3],
  // -2 intensity (moderate negative)
  ["bad", -2],
  ["angry", -2],
  ["sad", -2],
  ["upset", -2],
  ["annoyed", -2],
  ["frustrated", -2],
  ["disappointed", -2],
  ["unhappy", -2],
  ["hurt", -2],
  ["lonely", -2],
  ["mean", -2],
  ["cruel", -2],
  // -1 intensity (mild negative)
  ["tired", -1],
  ["bored", -1],
  ["no", -1],
  ["not", -1],
  ["cannot", -1],
  ["can't", -1],
  ["don't", -1],
  ["won't", -1],
  ["maybe", -1],
  ["confused", -1],
  ["uncertain", -1],
  ["sorry", -1],
  ["apologize", -1],
];

/**
 * Normalize speech text: lowercase, strip punctuation
 */
function normalizeSpeech(speech: string): string {
  return speech
    .toLowerCase()
    .replace(/[^\w\s']/g, " ") // Replace punctuation (except apostrophes) with spaces
    .replace(/\s+/g, " ")      // Collapse multiple spaces
    .trim();
}

/**
 * Analyze speech text for sentiment.
 * Returns classification and an affinity delta value.
 */
export function analyzeSentiment(speech: string): {
  classification: "positive" | "negative" | "neutral";
  delta: number;
} {
  if (!speech || speech.trim().length === 0) {
    return { classification: "neutral", delta: 0 };
  }

  const normalized = normalizeSpeech(speech);
  const words = normalized.split(" ");

  let totalDelta = 0;

  // Score positive keywords (use includes for partial word matching)
  for (const [keyword, intensity] of POSITIVE_KEYWORDS) {
    if (words.some((word) => word.includes(keyword))) {
      totalDelta += intensity;
    }
  }

  // Score negative keywords
  for (const [keyword, intensity] of NEGATIVE_KEYWORDS) {
    if (words.some((word) => word.includes(keyword))) {
      totalDelta += intensity; // intensity is already negative
    }
  }

  // Clamp delta to [-3, 3] range
  const delta = Math.max(-3, Math.min(3, totalDelta));

  if (delta > 0) {
    return { classification: "positive", delta };
  } else if (delta < 0) {
    return { classification: "negative", delta };
  } else {
    return { classification: "neutral", delta: 0 };
  }
}

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

/**
 * Build a structured user prompt from agent state and context data
 */
function buildContextPrompt(
  agentState: { name: string; hunger: number; energy: number; social: number },
  context?: {
    agentContext?: string;
    relationshipContext?: string;
    events?: string;
    memories?: string;
    conversationContext?: string;
  },
): string {
  let prompt = "";

  // Identity section
  prompt += `## Your Identity\n`;
  if (context?.agentContext) {
    // agentContext (from buildAgentContext) already contains Name, Archetype, Biography, etc.
    prompt += context.agentContext;
  }
  if (!prompt.endsWith("\n")) prompt += "\n";
  prompt += "\n";

  // State section
  prompt += `## Your State\n`;
  prompt += `Hunger: ${agentState.hunger}\n`;
  prompt += `Energy: ${agentState.energy}\n`;
  prompt += `Social: ${agentState.social}\n`;
  prompt += "\n";

  // Relationships section
  if (context?.relationshipContext) {
    prompt += `## Your Relationships\n`;
    prompt += context.relationshipContext;
    prompt += "\n";
  }

  // Recent Events section
  if (context?.events) {
    prompt += `## Recent Events\n`;
    prompt += context.events;
    prompt += "\n";
  }

  // Relevant Memories section
  if (context?.memories) {
    prompt += `## Relevant Memories\n`;
    prompt += context.memories;
    prompt += "\n";
  }

  // Active conversation (if any)
  if (context?.conversationContext) {
    prompt += context.conversationContext;
    prompt += "\n";
  }

  // Concluding instruction
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
      model: v.optional(v.string()),
    }),
    nearbyAgents: v.array(v.string()),
    archetype: v.union(v.literal("builder"), v.literal("socialite"), v.literal("philosopher"), v.literal("explorer"), v.literal("nurturer")),
    agentContext: v.optional(v.string()),
    relationshipContext: v.optional(v.string()),
    events: v.optional(v.string()),
    memories: v.optional(v.string()),
    conversationContext: v.optional(v.string()),
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
      } catch (e) {
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

    return context;
  },
});

/**
 * Action: Build full context with identity, relationships, and memories
 */
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
    if (memoriesResult && (memoriesResult as any[]).length > 0) {
      (memoriesResult as any[]).forEach((m: any) => {
        memoriesStr += `- ${m.content}\n`;
      });
    } else {
      memoriesStr += "(No relevant memories)\n";
    }

    return {
      agentContext,
      relationshipContext,
      events: eventsStr,
      memories: memoriesStr,
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

    const eventLog = events.map((e: any) => `- ${e.description}`).join("\n");
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
        const importantMemories = reflection.memories.filter((m: any) => m.importance >= 5);
        await Promise.all(importantMemories.map(async (memory: any) => {
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
