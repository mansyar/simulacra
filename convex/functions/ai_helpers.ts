import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

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

/**
 * Pick a random model from a comma-separated pool, or fall back to a single model.
 * Set OPENAI_MODEL_POOL="gemma-4-27b-it,gemma-4-12b-it" to rotate across models.
 */
function pickModel(pool: string | undefined, single: string | undefined, fallback: string): string {
  if (pool) {
    const models = pool.split(",").map((m) => m.trim()).filter(Boolean);
    if (models.length > 0) {
      return models[Math.floor(Math.random() * models.length)];
    }
  }
  return single || fallback;
}

export async function getAiConfig(ctx: ActionCtx, modelOverride?: string): Promise<AiConfig> {
  const config = await ctx.runQuery(internal.functions.config.getInternal);
  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: config?.llmBaseUrl || process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    model: modelOverride
      || pickModel(process.env.OPENAI_MODEL_POOL, config?.llmModel || process.env.OPENAI_MODEL, "gpt-3.5-turbo"),
  };
}

/**
 * Shared chat completion helper that supports both native Gemini and OpenAI-compatible APIs.
 * Detects Google native endpoints the same way `embed` does.
 */
export async function chatCompletion(
  config: AiConfig,
  messages: { role: string; content: string }[],
  options?: { responseFormat?: any }
): Promise<string> {
  const { apiKey, baseUrl, model } = config;
  if (!apiKey) throw new Error("No API key configured");

  const isGoogleNative = baseUrl.includes("googleapis.com") && !baseUrl.includes("/openai");

  if (isGoogleNative) {
    // --- Native Gemini generateContent API ---
    const version = baseUrl.includes("v1beta") ? "v1beta" : "v1";
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

    // Convert OpenAI-style messages to Gemini format
    const systemParts = messages
      .filter((m) => m.role === "system")
      .map((m) => ({ text: m.content }));
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: any = { contents };
    if (systemParts.length > 0) {
      body.systemInstruction = { parts: systemParts };
    }
    if (options?.responseFormat) {
      const fmt = options.responseFormat;
      if (fmt.type === "json_schema" && fmt.json_schema?.schema) {
        // Map OpenAI json_schema to Gemini's responseSchema
        body.generationConfig = {
          responseMimeType: "application/json",
          responseSchema: fmt.json_schema.schema,
        };
      } else if (fmt.type === "json_object") {
        body.generationConfig = { responseMimeType: "application/json" };
      }
    }

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, 3, 1000, true /* skip429Backoff */);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } else {
    // --- OpenAI-compatible API ---
    const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
    const body: any = { model, messages };
    if (options?.responseFormat) {
      body.response_format = options.responseFormat;
    }

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }, 3, 1000, true /* skip429Backoff */);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

export async function getEmbeddingConfig(ctx: ActionCtx): Promise<AiConfig> {
  const config = await ctx.runQuery(internal.functions.config.getInternal);
  return {
    apiKey: process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY,
    baseUrl: process.env.EMBEDDING_API_BASE_URL || config?.llmBaseUrl || process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    model: pickModel(
      process.env.EMBEDDING_MODEL_POOL, 
      process.env.EMBEDDING_MODEL || process.env.OPENAI_EMBEDDING_MODEL, 
      "text-embedding-3-small"
    ),
  };
}

/**
 * Fetch with retry logic. Chat calls (skip429Backoff=true) skip 429 retries since
 * the chat model has no rate limits. Embedding calls (skip429Backoff=false, default)
 * retain 429 backoff due to separate rate limit concerns.
 * Network errors (5xx, timeouts) are always retried regardless.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  skip429Backoff: boolean = false
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      // For chat calls: return 429 immediately instead of retrying
      // For embedding calls: keep existing 429 backoff behavior
      if (response.status === 429 && skip429Backoff) return response;
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

/**
 * Action: List available models from the configured AI provider.
 * Supports both native Gemini API and OpenAI-compatible endpoints.
 */
export const listModels = action({
  args: {
    filter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { apiKey, baseUrl } = await getAiConfig(ctx);

    if (!apiKey) {
      return { models: [], error: "No API key configured" };
    }

    const isGoogleNative = baseUrl.includes("googleapis.com") && !baseUrl.includes("/openai");

    try {
      if (isGoogleNative) {
        // --- Native Gemini ListModels API ---
        const version = baseUrl.includes("v1beta") ? "v1beta" : "v1";
        const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}&pageSize=100`;

        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini ListModels error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const models = (data.models || [])
          .map((m: any) => ({
            id: m.name?.replace("models/", "") || m.name,
            name: m.displayName || m.name,
            methods: m.supportedGenerationMethods || [],
          }))
          .filter((m: any) => {
            // If filter provided, match against id or name
            if (args.filter) {
              const f = args.filter.toLowerCase();
              return m.id.toLowerCase().includes(f) || m.name.toLowerCase().includes(f);
            }
            return true;
          });

        return {
          provider: "google-native",
          models,
          chatModels: models.filter((m: any) => m.methods.includes("generateContent")),
          embedModels: models.filter((m: any) => m.methods.includes("embedContent")),
        };
      } else {
        // --- OpenAI-compatible /models endpoint ---
        const url = `${baseUrl.replace(/\/$/, "")}/models`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Models API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const models = (data.data || data.models || [])
          .map((m: any) => ({
            id: m.id || m.name,
            name: m.id || m.name,
            owned_by: m.owned_by || "unknown",
          }))
          .filter((m: any) => {
            if (args.filter) {
              const f = args.filter.toLowerCase();
              return m.id.toLowerCase().includes(f) || m.name.toLowerCase().includes(f);
            }
            return true;
          });

        return { provider: "openai-compatible", models };
      }
    } catch (error) {
      console.error("[AI] ListModels error:", error);
      return { models: [], error: String(error) };
    }
  },
});

export const chat = action({
  args: {
    message: v.string(),
    archetype: v.union(v.literal("builder"), v.literal("socialite"), v.literal("philosopher"), v.literal("explorer"), v.literal("nurturer")),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = await getAiConfig(ctx, args.model);

    if (!config.apiKey) {
      return { content: `[MOCK] ${ARCHETYPE_PROMPTS[args.archetype]} Response to: ${args.message} (Model: ${config.model})` };
    }

    try {
      const content = await chatCompletion(config, [
        { role: "system", content: ARCHETYPE_PROMPTS[args.archetype] },
        { role: "user", content: args.message },
      ]);
      return { content };
    } catch (error) {
      console.error("[AI] Chat error:", error);
      return { content: `[MOCK] ${ARCHETYPE_PROMPTS[args.archetype]} Response to: ${args.message} (Model: ${config.model})` };
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
        url = `https://generativelanguage.googleapis.com/${version}/models/${model}:embedContent?key=${apiKey}`;
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

export const batchEmbed = action({
  args: { texts: v.array(v.string()) },
  handler: async (ctx, args): Promise<number[][]> => {
    if (args.texts.length === 0) return [];

    const { apiKey, baseUrl, model } = await getEmbeddingConfig(ctx);
    if (!apiKey) {
      return args.texts.map(() => new Array(768).fill(0).map(() => Math.random()));
    }

    try {
      const isGoogle = baseUrl.includes("googleapis.com") && !baseUrl.includes("/openai");

      if (isGoogle) {
        // Google Gemini doesn't support batch embedding natively — fall back to individual calls
        const results = await Promise.all(
          args.texts.map((text) =>
            ctx.runAction(api.functions.ai_helpers.embed, { text }),
          ),
        );
        return results;
      }

      // OpenAI-compatible batch embedding
      const url = `${baseUrl.replace(/\/$/, "")}/embeddings`;
      const body: Record<string, unknown> = { model, input: args.texts };
      if (!baseUrl.includes("googleapis.com")) {
        body.dimensions = 768;
      }

      const response = await fetchWithRetry(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI] BatchEmbed API Error: ${response.status} - ${errorText} | URL: ${url}`);
        throw new Error(`AI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // OpenAI-compatible: data.data[].embedding
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((item: { embedding: number[] }) => item.embedding);
      }

      // Alternative: data.embeddings[] (some providers)
      if (data.embeddings && Array.isArray(data.embeddings)) {
        return data.embeddings;
      }

      throw new Error("Unexpected embedding response format");
    } catch (error) {
      console.error("[AI] BatchEmbed error:", error);
      return args.texts.map(() => new Array(768).fill(0).map(() => Math.random()));
    }
  },
});
