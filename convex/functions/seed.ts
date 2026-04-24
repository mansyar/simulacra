import { mutation } from "../_generated/server";

export const agents = mutation({
  args: {},
  handler: async (ctx) => {
    const existingAgents = await ctx.db.query("agents").collect();
    if (existingAgents.length > 0) {
      return { message: "Database already seeded" };
    }

    const initialAgents = [
      { name: "Builder", archetype: "builder" as const, gridX: 10, gridY: 10, coreTraits: ["diligent", "practical"] },
      { name: "Socialite", archetype: "socialite" as const, gridX: 20, gridY: 20, coreTraits: ["outgoing", "charming"] },
      { name: "Philosopher", archetype: "philosopher" as const, gridX: 30, gridY: 30, coreTraits: ["thoughtful", "analytical"] },
      { name: "Explorer", archetype: "explorer" as const, gridX: 40, gridY: 40, coreTraits: ["curious", "brave"] },
      { name: "Nurturer", archetype: "nurturer" as const, gridX: 50, gridY: 50, coreTraits: ["kind", "patient"] },
    ];

    for (const agent of initialAgents) {
      await ctx.db.insert("agents", {
        ...agent,
        isActive: true,
        hunger: 50,
        energy: 50,
        social: 50,
        currentAction: "idle",
        spriteVariant: Math.floor(Math.random() * 4),
        lastActiveAt: Date.now(),
      });
    }

    return { message: `Seeded ${initialAgents.length} agents` };
  },
});
