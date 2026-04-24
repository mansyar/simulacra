import { action } from "../_generated/server";
import { v } from "convex/values";

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

export const chat = action({
  args: {
    message: v.string(),
    archetype: v.union(v.literal("friendly"), v.literal("grumpy"), v.literal("curious")),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

    if (!apiKey) {
      return {
        content: `[MOCK] ${ARCHETYPE_PROMPTS[args.archetype]} Response to: ${args.message}`,
      };
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
    };
  },
});

export const decision = action({
  args: {
    agentState: v.object({
      name: v.string(),
      hunger: v.number(),
      energy: v.number(),
      social: v.number(),
    }),
    nearbyAgents: v.array(v.string()),
    archetype: v.union(v.literal("friendly"), v.literal("grumpy"), v.literal("curious")),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

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
        reasoning: `[MOCK] Based on hunger ${args.agentState.hunger} and archetype ${args.archetype}`,
      };
    }

    const userPrompt = `
    Agent Name: ${args.agentState.name}
    Archetype: ${args.archetype}
    State: Hunger ${args.agentState.hunger}, Energy ${args.agentState.energy}, Social ${args.agentState.social}
    Nearby Agents: ${args.nearbyAgents.join(", ") || "None"}
    
    What is your next action?
    `;

    const response = await fetch(`${baseUrl}/chat/completions`, {
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
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    try {
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error("Failed to parse AI response:", data.choices[0].message.content);
      return {
        action: "idle",
        target: "none",
        reasoning: "Error parsing AI response",
      };
    }
  },
});
