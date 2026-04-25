import { test, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("seed:world populates pois and archetypes", async () => {
  const t = convexTest(schema, modules);
  
  await t.mutation(api.functions.seed.world, { clearExisting: true });

  const pois = await t.run(async (ctx) => {
    return await ctx.db.query("pois").collect();
  });

  const archetypes = await t.run(async (ctx) => {
    return await ctx.db.query("archetypes").collect();
  });

  expect(pois.length).toBeGreaterThan(0);
  expect(archetypes.length).toBe(5);
  expect(archetypes[0].speechPatterns).toBeDefined();
});

test("seed:agents populates agents with bios", async () => {
  const t = convexTest(schema, modules);
  
  await t.mutation(api.functions.seed.agents, { clearExisting: true });

  const agents = await t.query(api.functions.agents.getAll, {});
  
  expect(agents.length).toBe(10);
  expect(agents[0].bio).not.toBe("");
  expect(agents[0].inventory).toEqual([]);
});
