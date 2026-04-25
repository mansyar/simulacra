import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const ARCHETYPE_PROMPTS = {
  builder: "You are a builder. You are organized, productive, and detail-oriented. You love creating and improving things. Your tone is practical and focused.",
  socialite: "You are a socialite. You are friendly, charming, and love talking to others. You prioritize building relationships and learning about people. Your tone is warm and engaging.",
  philosopher: "You are a philosopher. You are thoughtful, introspective, and wise. You love contemplating deep questions and sharing insights. Your tone is calm and reflective.",
  explorer: "You are an explorer. You are adventurous, restless, and curious. You love discovering new things and seeking novelty. Your tone is excited and inquisitive.",
  nurturer: "You are a nurturer. You are caring, protective, and generous. You love helping others and ensuring their well-being. Your tone is kind and supportive.",
};

export interface AiConfig {
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
}

export async function getAiConfig(ctx: ActionCtx, modelOverride?: string): Promise<AiConfig> {
  const config = await ctx.runQuery(internal.functions.config.getInternal);
  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: config?.llmBaseUrl || process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    model: modelOverride || config?.llmModel || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
  };
}

export async function getEmbeddingConfig(ctx: ActionCtx): Promise<AiConfig> {
  const config = await ctx.runQuery(internal.functions.config.getInternal);
  return {
    apiKey: process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY,
    baseUrl: process.env.EMBEDDING_API_BASE_URL || config?.llmBaseUrl || process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    model: process.env.EMBEDDING_MODEL || process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  };
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status !== 429) return response;
      if (attempt === maxRetries) return response;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) throw lastError;
      const delay = baseDelay * Math.pow(2, attempt);
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
      return { content: `[MOCK] ${ARCHETYPE_PROMPTS[args.archetype]} Response to: ${args.message} (Model: ${model})` };
    }

    try {
      const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
      const response = await fetchWithRetry(url, {
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
      });

      if (!response.ok) throw new Error(`AI API error: ${await response.text()}`);
      const data = await response.json();
      return { content: data.choices[0].message.content };
    } catch (error) {
      console.error("[AI] Chat error:", error);
      return { content: `[MOCK] ${ARCHETYPE_PROMPTS[args.archetype]} Response to: ${args.message} (Model: ${model})` };
    }
  },
});

export const embed = action({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const { apiKey, baseUrl, model } = await getEmbeddingConfig(ctx);
    if (!apiKey) return new Array(768).fill(0).map(() => Math.random());

    try {
      const isGoogle = baseUrl.includes("googleapis.com") && !baseUrl.includes("/openai");
      let url: string;
      let body: any;
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (isGoogle) {
        const version = baseUrl.includes("v1beta") ? "v1beta" : "v1";
        url = `https://generativelanguage.googleapis.com/${version}/${model}:embedContent?key=${apiKey}`;
        body = { content: { parts: [{ text: args.text }] }, outputDimensionality: 768 };
      } else {
        url = `${baseUrl.replace(/\/$/, "")}/embeddings`;
        body = { model, input: args.text };
        if (!baseUrl.includes("googleapis.com")) {
          body.dimensions = 768;
        }
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetchWithRetry(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI] Embed API Error: ${response.status} - ${errorText} | URL: ${url}`);
        throw new Error(`AI API error (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      if (data.embedding) return data.embedding.values;
      if (data.data && data.data[0] && data.data[0].embedding) return data.data[0].embedding;
      return data.values;
    } catch (error) {
      console.error("[AI] Embed error:", error);
      return new Array(768).fill(0).map(() => Math.random());
    }
  },
});
