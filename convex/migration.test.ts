/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("schema restricts archetypes to primary five", async () => {
  const t = convexTest(schema, modules);
  
  // These should pass after migration
  const primaryArchetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"] as const;
  
  for (const archetype of primaryArchetypes) {
    await t.mutation(api.functions.agents.create, {
      name: `Test ${archetype}`,
      archetype: archetype as any,
      gridX: 0,
      gridY: 0,
    });
  }

  // This SHOULD FAIL after we update the schema
  // (Red Phase: Currently it might pass if friendly is still in schema)
  const deprecatedArchetypes = ["friendly", "grumpy", "curious"] as const;
  
  for (const archetype of deprecatedArchetypes) {
    await expect(
      t.mutation(api.functions.agents.create, {
        name: `Deprecated ${archetype}`,
        archetype: archetype as any,
        gridX: 0,
        gridY: 0,
      })
    ).rejects.toThrow();
  }
});

test("migration of deprecated archetypes", async () => {
  const t = convexTest(schema, modules);

  // 1. Seed with deprecated archetypes BYPASSING validation
  const deprecatedMap = {
    "friendly": "socialite",
    "grumpy": "philosopher",
    "curious": "explorer",
  } as const;

  for (const arch of Object.keys(deprecatedMap)) {
    await t.run(async (ctx) => {
      // @ts-ignore - bypassing schema validation for setup
      await ctx.db.insert("agents", {
        name: `Old ${arch}`,
        archetype: arch as any,
        gridX: 0,
        gridY: 0,
        spriteVariant: 0,
        currentAction: "idle",
        hunger: 50,
        energy: 50,
        social: 50,
        coreTraits: [],
        isActive: true,
        lastActiveAt: Date.now(),
      });
    });
  }

  // 2. Run migration mutation (this SHOULD pass because it patches the data)
  await t.mutation(api.functions.agents.migrateArchetypes, {});

  // 3. Verify all agents now have primary archetypes
  const agents = await t.query(api.functions.agents.getAll);
  const primaryArchetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"];
  
  for (const agent of agents) {
    expect(primaryArchetypes).toContain(agent.archetype);
    if (agent.name === "Old friendly") expect(agent.archetype).toBe("socialite");
    if (agent.name === "Old grumpy") expect(agent.archetype).toBe("philosopher");
    if (agent.name === "Old curious") expect(agent.archetype).toBe("explorer");
  }
});
