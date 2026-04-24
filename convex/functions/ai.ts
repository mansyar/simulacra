import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

const ARCHETYPE_PROMPTS = {
  friendly: "You are a friendly and outgoing agent. You love meeting new people and are always eager to help. Your tone is warm and enthusiastic. You prioritize social interaction.",
  grumpy: "You are a grumpy and reclusive agent. You prefer to be alone and find most interactions annoying. Your tone is blunt and short. You prioritize solitude and efficiency.",
  curious: "You are a curious and exploratory agent. You are fascinated by everything around you and always ask lots of questions. Your tone is inquisitive and excited. You prioritize exploring new things.",
};

const DECISION_SYSTEM_PROMPT = `
You are an AI brain for an agent in a simulated world. 
Based on the agent's state, nearby agents, and personality archetype, you must decide on the next action.
Valid actions are: "idle", "walking", "eating", "sleeping", "talking", "working", "exploring".

You MUST return your decision in the following JSON format:
{
  "action": "action_name",
  "target": "target_name_or_none",
  "reasoning": "short explanation of why this action was chosen"
}
`;

interface AiConfig {
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
}

async function getAiConfig(ctx: ActionCtx, modelOverride?: string): Promise<AiConfig> {
  const config = await ctx.runQuery(internal.functions.config.getInternal);
  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: config?.llmBaseUrl || process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    model: modelOverride || config?.llmModel || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
  };
}

/**
 * Retry wrapper with exponential backoff for rate-limited requests
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If not a rate limit error, return immediately
      if (response.status !== 429) {
        return response;
      }

      // Rate limit error - check if we should retry
      if (attempt === maxRetries) {
        // Last attempt, return the rate limit response
        return response;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[AI] Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[AI] Error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

export const chat = action({
  args: {
    message: v.string(),
    archetype: v.union(v.literal("friendly"), v.literal("grumpy"), v.literal("curious")),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { apiKey, baseUrl, model } = await getAiConfig(ctx, args.model);

    if (!apiKey) {
      return {
        content: `[MOCK] ${ARCHETYPE_PROMPTS[args.archetype]} Response to: ${args.message} (Model: ${model})`,
      };
    }

    try {
      const response = await fetchWithRetry(
        `${baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: ARCHETYPE_PROMPTS[args.archetype] },
              { role: "user", content: args.message },
            ],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${error}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
      };
    } catch (error) {
      console.error("[AI] Chat error:", error);
      // Return mock response on error
      return {
        content: `[MOCK] ${ARCHETYPE_PROMPTS[args.archetype]} Response to: ${args.message} (Model: ${model})`,
      };
    }
  },
});

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
    archetype: v.union(v.literal("friendly"), v.literal("grumpy"), v.literal("curious")),
  },
  handler: async (ctx, args) => {
    const { apiKey, baseUrl, model } = await getAiConfig(ctx, args.agentState.model);

    if (!apiKey) {
      // Mock decision logic
      let action = "idle";
      if (args.agentState.hunger > 70) action = "eating";
      else if (args.agentState.energy < 30) action = "sleeping";
      else if (args.nearbyAgents.length > 0 && args.archetype === "friendly") action = "talking";
      else if (args.archetype === "curious") action = "exploring";

      return {
        action,
        target: args.nearbyAgents[0] || "none",
        reasoning: `[MOCK] Based on hunger ${args.agentState.hunger} and archetype ${args.archetype} (Model: ${model})`,
      };
    }

    const userPrompt = `
    Agent Name: ${args.agentState.name}
    Archetype: ${args.archetype}
    State: Hunger ${args.agentState.hunger}, Energy ${args.agentState.energy}, Social ${args.agentState.social}
    Nearby Agents: ${args.nearbyAgents.join(", ") || "None"}
    
    What is your next action?
    `;

    try {
      const response = await fetchWithRetry(
        `${baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: DECISION_SYSTEM_PROMPT + "\n" + ARCHETYPE_PROMPTS[args.archetype] },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${error}`);
      }

      const data = await response.json();
      try {
        const content = data.choices[0].message.content;
        return typeof content === "string" ? JSON.parse(content) : content;
      } catch (e) {
        console.error("Failed to parse AI response:", data.choices[0].message.content);
        return {
          action: "idle",
          target: "none",
          reasoning: "Error parsing AI response",
        };
      }
    } catch (error) {
      console.error("[AI] Decision error:", error);
      // Return mock decision on error
      let action = "idle";
      if (args.agentState.hunger > 70) action = "eating";
      else if (args.agentState.energy < 30) action = "sleeping";
      else if (args.nearbyAgents.length > 0 && args.archetype === "friendly") action = "talking";
      else if (args.archetype === "curious") action = "exploring";

      return {
        action,
        target: args.nearbyAgents[0] || "none",
        reasoning: `[MOCK] Rate limited - using mock decision (Model: ${model})`,
      };
    }
  },
});

export const embed = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { apiKey, baseUrl } = await getAiConfig(ctx);
    const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

    if (!apiKey) {
      // Mock embedding (768 dimensions)
      const embedding = new Array(768).fill(0).map(() => Math.random());
      return embedding;
    }

    try {
      const response = await fetchWithRetry(
        `${baseUrl}/embeddings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            input: args.text,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${error}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error("[AI] Embed error:", error);
      // Return mock embedding on error
      return new Array(768).fill(0).map(() => Math.random());
    }
  },
});
