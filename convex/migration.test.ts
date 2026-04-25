/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("schema restricts archetypes to primary five", async () => {
  const t = convexTest(schema, modules);
  
  // These should pass
  const primaryArchetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"] as const;
  
  for (const archetype of primaryArchetypes) {
    await t.mutation(api.functions.agents.create, {
      name: `Test ${archetype}`,
      archetype: archetype as any,
      gridX: 0,
      gridY: 0,
    });
  }

  // This SHOULD FAIL
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

test("migration mutation logic", async () => {
  const t = convexTest(schema, modules);

  // We test that the mutation exists and runs without error on an empty or valid DB
  const result = await t.mutation(api.functions.agents.migrateArchetypes, {});
  expect(result).toHaveProperty("migratedCount");
});
