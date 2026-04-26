import { action, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { 
  getAiConfig, 
  chatCompletion,
  ARCHETYPE_PROMPTS 
} from "./ai_helpers";

const DECISION_SYSTEM_PROMPT = `
You are an AI brain for an agent in a simulated world. 
Based on the agent's state, nearby agents, and personality archetype, you must decide on the next action.

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
    contextOverride: v.optional(v.string()),
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

    const systemPrompt = args.contextOverride 
      ? `${DECISION_SYSTEM_PROMPT}\n\nCURRENT AGENT CONTEXT:\n${args.contextOverride}`
      : `${DECISION_SYSTEM_PROMPT}\n${ARCHETYPE_PROMPTS[args.archetype]}`;

    const userPrompt = `
    Agent Name: ${args.agentState.name}
    Archetype: ${args.archetype}
    State: Hunger ${args.agentState.hunger}, Energy ${args.agentState.energy}, Social ${args.agentState.social}
    Nearby Agents: ${args.nearbyAgents.join(", ") || "None"}
    
    What is your next action?
    `;

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
 * Action: Build full context with identity and memories
 */
export const buildFullContext = action({
  args: {
    agentId: v.id("agents"),
    query: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const agentContext = await ctx.runQuery(internal.functions.ai.buildAgentContext, {
      agentId: args.agentId,
    });

    const memories = await ctx.runAction(api.functions.memory.retrieveMemoriesAction, {
      agentId: args.agentId,
      query: args.query,
    });

    let fullContext: string = agentContext;
    if (memories && (memories as any[]).length > 0) {
      fullContext += "\nRelevant Memories:\n";
      (memories as any[]).forEach((m: any) => {
        fullContext += `- ${m.content}\n`;
      });
    }

    return fullContext;
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
