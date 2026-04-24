import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define enum types as unions of literals
const AgentArchetype = v.union(
  v.literal("builder"),
  v.literal("socialite"),
  v.literal("philosopher"),
  v.literal("explorer"),
  v.literal("nurturer"),
  v.literal("friendly"),
  v.literal("grumpy"),
  v.literal("curious")
);

const AgentAction = v.union(
  v.literal("idle"),
  v.literal("walking"),
  v.literal("eating"),
  v.literal("sleeping"),
  v.literal("talking"),
  v.literal("working"),
  v.literal("exploring")
);

const Weather = v.union(
  v.literal("sunny"),
  v.literal("cloudy"),
  v.literal("rainy"),
  v.literal("stormy")
);

const MemoryType = v.union(
  v.literal("sensory"),
  v.literal("semantic"),
  v.literal("reflection"),
  v.literal("interaction")
);

const EventType = v.union(
  v.literal("movement"),
  v.literal("interaction"),
  v.literal("conversation"),
  v.literal("need_change"),
  v.literal("weather_change")
);

// Define tables
export default defineSchema({
  agents: defineTable({
    name: v.string(),
    archetype: AgentArchetype,
    gridX: v.number(),
    gridY: v.number(),
    spriteVariant: v.number(),
    currentAction: AgentAction,
    targetX: v.optional(v.number()),
    targetY: v.optional(v.number()),
    hunger: v.number(),
    energy: v.number(),
    social: v.number(),
    coreTraits: v.array(v.string()),
    model: v.optional(v.string()), // per-agent model override
    isActive: v.boolean(),
    lastActiveAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_position", ["gridX", "gridY"])
    .index("by_archetype", ["archetype"]),

  memories: defineTable({
    agentId: v.id("agents"),
    type: MemoryType,
    content: v.string(),
    embedding: v.array(v.float64()),
    timestamp: v.number(),
    importance: v.number(),
    tags: v.array(v.string()),
  })
    .index("by_agent", ["agentId"])
    .index("by_agent_and_type", ["agentId", "type"])
    .index("by_timestamp", ["timestamp"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["agentId", "type"],
    }),

  relationships: defineTable({
    agentAId: v.id("agents"),
    agentBId: v.id("agents"),
    affinity: v.number(),
    interactionsCount: v.number(),
    lastInteractionAt: v.number(),
    lastInteractionType: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
  })
    .index("by_agents", ["agentAId", "agentBId"])
    .index("by_affinity", ["affinity"]),

  world_state: defineTable({
    weather: Weather,
    timeOfDay: v.number(),
    dayCount: v.number(),
    tickIntervalSeconds: v.number(),
    totalTicks: v.number(),
    lastTickAt: v.number(),
  }),

  events: defineTable({
    type: EventType,
    agentId: v.optional(v.id("agents")),
    targetId: v.optional(v.id("agents")),
    description: v.string(),
    gridX: v.number(),
    gridY: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_position", ["gridX", "gridY"]),

  config: defineTable({
    masterPasswordHash: v.string(),
    defaultTickInterval: v.number(),
    enableSleepMode: v.boolean(),
    llmProvider: v.string(), // e.g. "openai", "siliconflow", "deepseek"
    llmBaseUrl: v.optional(v.string()),
    llmModel: v.string(),
  }),

  archetypes: defineTable({
    name: AgentArchetype,
    basePrompt: v.string(),
    goalPriorities: v.array(v.string()),
    interactionStyle: v.string(),
    speechPatterns: v.object({
      greeting: v.array(v.string()),
      question: v.array(v.string()),
      statement: v.array(v.string()),
    }),
    baseColor: v.string(),
  }),
});