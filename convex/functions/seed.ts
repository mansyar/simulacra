import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const agents = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, { clearExisting }) => {
    if (clearExisting) {
      const existingAgents = await ctx.db.query("agents").collect();
      if (existingAgents.length > 0) {
        // Clear existing agents for a fresh seed
        for (const agent of existingAgents) {
          await ctx.db.delete(agent._id);
        }
      }
    }

    // OPTIMIZED: Reduced to 10 agents for token limits
    const archetypes = [
      { 
        type: "builder", 
        traits: ["diligent", "practical"], 
        names: ["Bob", "Wendy"],
        bios: ["A master craftsman who believes everything should have a purpose.", "A determined engineer who loves optimizing workflows."]
      },
      { 
        type: "socialite", 
        traits: ["outgoing", "charming"], 
        names: ["Paris", "Kim"],
        bios: ["A charismatic influencer who knows everyone in town.", "A social butterfly who lives for deep conversations and community."]
      },
      { 
        type: "philosopher", 
        traits: ["thoughtful", "analytical"], 
        names: ["Socrates", "Plato"],
        bios: ["A deep thinker searching for the fundamental truths of the simulation.", "A visionary theorist who believes in a world beyond the grid."]
      },
      { 
        type: "explorer", 
        traits: ["adventurous", "curious"], 
        names: ["Indiana", "Lara"],
        bios: ["A bold adventurer who seeks the unknown beyond the mapped borders.", "A relentless seeker of ancient artifacts and forgotten lore."]
      },
      { 
        type: "nurturer", 
        traits: ["caring", "protective"], 
        names: ["Florence", "Clara"],
        bios: ["A compassionate soul dedicated to the well-being of all agents.", "A protective guardian who finds joy in supporting others."]
      },
    ] as const;

    let count = 0;
    for (const arch of archetypes) {
      for (let i = 0; i < arch.names.length; i++) {
        const name = arch.names[i];
        const bio = arch.bios[i];
        await ctx.db.insert("agents", {
          name,
          bio,
          archetype: arch.type,
          gridX: Math.floor(Math.random() * 64),
          gridY: Math.floor(Math.random() * 64),
          coreTraits: [...arch.traits],
          isActive: true,
          hunger: 50,
          energy: 50,
          social: 50,
          currentAction: "idle",
          spriteVariant: Math.floor(Math.random() * 4),
          lastActiveAt: Date.now(),
          inventory: [],
          currentGoal: "Wandering around",
          lastReflectedTick: 0,
          actionStartedAt: Date.now(),
        });
        count++;
      }
    }

    // Also seed world state if missing
    const existingState = await ctx.db.query("world_state").first();
    if (!existingState) {
      await ctx.db.insert("world_state", {
        weather: "sunny",
        timeOfDay: 10,
        dayCount: 1,
        tickIntervalSeconds: 180,  // Increased to 3 minutes
        totalTicks: 0,
        lastTickAt: Date.now(),
      });
    }

    return { message: `Seeded ${count} agents and world state` };
  },
});

export const config = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, { clearExisting }) => {
    if (clearExisting) {
      const existingConfig = await ctx.db.query("config").collect();
      for (const cfg of existingConfig) await ctx.db.delete(cfg._id);
    }

    const existing = await ctx.db.query("config").first();
    if (!existing) {
      await ctx.db.insert("config", {
        masterPasswordHash: "pbkdf2_sha256$260000$hashedpassword", // Placeholder
        defaultTickInterval: 180,
        enableSleepMode: true,
        llmProvider: "openai",
        llmModel: "gpt-3.5-turbo",
        interactionRadius: 5,
        conversationMaxTtlMs: undefined,
      });
    } else if (existing.interactionRadius === undefined) {
      await ctx.db.patch(existing._id, { interactionRadius: 5 });
    }

    return { message: "Config seeded successfully" };
  },
});

export const world = mutation({
  args: {
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, { clearExisting }) => {
    if (clearExisting) {
      const existingPois = await ctx.db.query("pois").collect();
      for (const poi of existingPois) await ctx.db.delete(poi._id);
      
      const existingArchetypes = await ctx.db.query("archetypes").collect();
      for (const arch of existingArchetypes) await ctx.db.delete(arch._id);
    }

    // 1. Seed POIs
    const pois = [
      { name: "The Great Library", description: "A quiet place for reflection and study.", gridX: 32, gridY: 32, type: "library" },
      { name: "Central Plaza", description: "The bustling heart of the town.", gridX: 10, gridY: 10, type: "plaza" },
      { name: "Cozy Cafe", description: "Fresh coffee and good conversation.", gridX: 45, gridY: 15, type: "cafe" },
      { name: "Forest Grove", description: "A peaceful natural retreat.", gridX: 5, gridY: 50, type: "nature" },
    ];

    for (const poi of pois) {
      await ctx.db.insert("pois", poi);
    }

    // 2. Seed Archetype details
    const archetypeData: {
      name: "builder" | "socialite" | "philosopher" | "explorer" | "nurturer";
      basePrompt: string;
      goalPriorities: string[];
      interactionStyle: string;
      baseColor: string;
      speechPatterns: { greeting: string[]; question: string[]; statement: string[] };
    }[] = [
      {
        name: "builder",
        basePrompt: "You are a builder. You are organized, productive, and detail-oriented. You love creating and improving things.",
        goalPriorities: ["working", "eating", "sleeping"],
        interactionStyle: "practical and focused",
        baseColor: "#3b82f6",
        speechPatterns: {
          greeting: ["Ready to get to work!", "Need a hand with anything?", "Just finishing up here."],
          question: ["How's the project coming along?", "What should we tackle next?", "Got the supplies?"],
          statement: ["That looks sturdy.", "I've got a plan for this.", "Efficiency is key."],
        }
      },
      {
        name: "socialite",
        basePrompt: "You are a socialite. You are friendly, charming, and love talking to others.",
        goalPriorities: ["talking", "exploring", "eating"],
        interactionStyle: "warm and engaging",
        baseColor: "#ec4899",
        speechPatterns: {
          greeting: ["So good to see you!", "Hi there! How's your day?", "I was just thinking about you!"],
          question: ["What's the latest news?", "Have you met Bob yet?", "Want to grab a coffee?"],
          statement: ["It's such a lovely day for a chat.", "I love meeting new people.", "Relationship building is everything."],
        }
      },
      {
        name: "philosopher",
        basePrompt: "You are a philosopher. You are thoughtful, introspective, and wise.",
        goalPriorities: ["idle", "exploring", "sleeping"],
        interactionStyle: "calm and reflective",
        baseColor: "#8b5cf6",
        speechPatterns: {
          greeting: ["Greetings, fellow traveler.", "A fine moment for contemplation.", "I was lost in thought."],
          question: ["What is the essence of this world?", "Do you ever wonder why we are here?", "What does progress truly mean?"],
          statement: ["Existence is a curious thing.", "Wisdom often found in silence.", "Everything is connected."],
        }
      },
      {
        name: "explorer",
        basePrompt: "You are an explorer. You are adventurous, restless, and curious.",
        goalPriorities: ["exploring", "walking", "eating"],
        interactionStyle: "excited and inquisitive",
        baseColor: "#f59e0b",
        speechPatterns: {
          greeting: ["Found anything cool yet?", "Onward to the next discovery!", "The horizon is calling!"],
          question: ["What's over those hills?", "Have you seen the edge of the map?", "Ready for an adventure?"],
          statement: ["There's so much to see.", "I wonder where this path leads.", "Discovery is the spice of life."],
        }
      },
      {
        name: "nurturer",
        basePrompt: "You are a nurturer. You are caring, protective, and generous.",
        goalPriorities: ["talking", "eating", "idle"],
        interactionStyle: "kind and supportive",
        baseColor: "#10b981",
        speechPatterns: {
          greeting: ["I hope you're feeling well today.", "Take care of yourself.", "It's a pleasure to be of help."],
          question: ["Have you eaten yet?", "Are you getting enough rest?", "How can I support you?"],
          statement: ["Wellness is our greatest treasure.", "Community keeps us strong.", "A kind word goes a long way."],
        }
      }
    ];

    for (const arch of archetypeData) {
      await ctx.db.insert("archetypes", arch);
    }

    return { message: `Seeded ${pois.length} POIs and ${archetypeData.length} archetypes` };
  },
});
