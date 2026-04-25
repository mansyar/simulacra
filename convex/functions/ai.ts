import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

const ARCHETYPE_PROMPTS = {
  builder: "You are a builder. You are organized, productive, and detail-oriented. You love creating and improving things. Your tone is practical and focused.",
  socialite: "You are a socialite. You are friendly, charming, and love talking to others. You prioritize building relationships and learning about people. Your tone is warm and engaging.",
  philosopher: "You are a philosopher. You are thoughtful, introspective, and wise. You love contemplating deep questions and sharing insights. Your tone is calm and reflective.",
  explorer: "You are an explorer. You are adventurous, restless, and curious. You love discovering new things and seeking novelty. Your tone is excited and inquisitive.",
  nurturer: "You are a nurturer. You are caring, protective, and generous. You love helping others and ensuring their well-being. Your tone is kind and supportive.",
};

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

async function getEmbeddingConfig(ctx: ActionCtx): Promise<AiConfig> {
  const config = await ctx.runQuery(internal.functions.config.getInternal);
  // Prioritize EMBEDDING_ specific env vars, then config table, then OPENAI_ fallbacks
  return {
    apiKey: process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY,
    baseUrl: process.env.EMBEDDING_API_BASE_URL || config?.llmBaseUrl || process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    model: process.env.EMBEDDING_MODEL || process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
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
    archetype: v.union(v.literal("builder"), v.literal("socialite"), v.literal("philosopher"), v.literal("explorer"), v.literal("nurturer")),
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
      const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
      const response = await fetchWithRetry(
        url,
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
    archetype: v.union(v.literal("builder"), v.literal("socialite"), v.literal("philosopher"), v.literal("explorer"), v.literal("nurturer")),
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

    const userPrompt = `
    Agent Name: ${args.agentState.name}
    Archetype: ${args.archetype}
    State: Hunger ${args.agentState.hunger}, Energy ${args.agentState.energy}, Social ${args.agentState.social}
    Nearby Agents: ${args.nearbyAgents.join(", ") || "None"}
    
    What is your next action?
    `;

    try {
      const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
      const response = await fetchWithRetry(
        url,
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
          thought: "I am having trouble thinking clearly.",
          action: "idle",
          target: "none",
          speech: "",
          confidence: 0,
        };
      }
    } catch (error) {
      console.error("[AI] Decision error:", error);
      // Return mock decision on error
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

export const embed = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { apiKey, baseUrl, model } = await getEmbeddingConfig(ctx);

    if (!apiKey) {
      // Mock embedding (768 dimensions)
      const embedding = new Array(768).fill(0).map(() => Math.random());
      return embedding;
    }

    try {
      const isGoogle = baseUrl.includes("googleapis.com");
      
      let url: string;
      let body: any;

      if (isGoogle) {
        // Native Google AI format (most robust for Gemini Free Tier)
        // Ensure version is in the URL, usually v1beta or v1
        const version = baseUrl.includes("v1beta") ? "v1beta" : "v1";
        const modelName = model.startsWith("models/") ? model : `models/${model}`;
        url = `https://generativelanguage.googleapis.com/${version}/${modelName}:embedContent?key=${apiKey}`;
        body = {
          content: {
            parts: [{ text: args.text }]
          },
          outputDimensionality: 768
        };
      } else {
        // OpenAI-compatible format
        url = `${baseUrl.replace(/\/$/, "")}/embeddings`;
        body = {
          model: model,
          input: args.text,
          dimensions: 768,
        };
      }

      const response = await fetchWithRetry(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      // Handle both OpenAI and Google Gemini response formats
      if (data.embedding) {
        // Native Google format (sometimes)
        return data.embedding.values;
      } else if (data.data && data.data[0] && data.data[0].embedding) {
        // OpenAI format
        return data.data[0].embedding;
      } else {
        // Google Gemini native format
        return data.values;
      }
    } catch (error) {
      console.error("[AI] Embed error:", error);
      // Return mock embedding on error
      return new Array(768).fill(0).map(() => Math.random());
    }
  },
});
