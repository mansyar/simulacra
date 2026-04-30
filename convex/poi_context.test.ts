/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("POI Context in buildFullContext", () => {
  test("buildFullContext returns a poiContext string field with POI data", async () => {
    const t = convexTest(schema, modules);

    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Test Agent",
      archetype: "explorer",
      gridX: 0,
      gridY: 0,
    });

    // Insert a POI
    await t.run(async (ctx) => {
      await ctx.db.insert("pois", {
        name: "Cozy Cafe",
        description: "Fresh coffee and good conversation.",
        gridX: 45,
        gridY: 15,
        type: "cafe",
      });
    });

    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId,
      query: "test query",
    });

    // poiContext should be a defined string
    expect(fullContext.poiContext).toBeDefined();
    expect(typeof fullContext.poiContext).toBe("string");
  });

  test("poiContext contains POI names", async () => {
    const t = convexTest(schema, modules);

    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Test Agent",
      archetype: "explorer",
      gridX: 0,
      gridY: 0,
    });

    // Insert multiple POIs
    await t.run(async (ctx) => {
      await ctx.db.insert("pois", {
        name: "Cozy Cafe",
        description: "Fresh coffee and good conversation.",
        gridX: 45,
        gridY: 15,
        type: "cafe",
      });
      await ctx.db.insert("pois", {
        name: "The Great Library",
        description: "A quiet place for reflection and study.",
        gridX: 32,
        gridY: 32,
        type: "library",
      });
    });

    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId,
      query: "test query",
    });

    expect(fullContext.poiContext).toContain("Cozy Cafe");
    expect(fullContext.poiContext).toContain("The Great Library");
  });

  test("poiContext includes POI coordinates, descriptions, and distances from agent", async () => {
    const t = convexTest(schema, modules);

    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Test Agent",
      archetype: "explorer",
      gridX: 0,
      gridY: 0,
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("pois", {
        name: "Cozy Cafe",
        description: "Fresh coffee and good conversation.",
        gridX: 45,
        gridY: 15,
        type: "cafe",
      });
    });

    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId,
      query: "test query",
    });

    // Should contain coordinates in format "(45, 15)"
    expect(fullContext.poiContext).toContain("(45, 15)");
    // Should contain the description
    expect(fullContext.poiContext).toContain("Fresh coffee and good conversation.");
    // Should contain distance in format "[X.X tiles away]"
    expect(fullContext.poiContext).toMatch(/\[\d+\.?\d* tiles away\]/);
  });

  test("return type includes poiContext field", async () => {
    const t = convexTest(schema, modules);

    const agentId = await t.mutation(api.functions.agents.create, {
      name: "Test Agent",
      archetype: "builder",
      gridX: 5,
      gridY: 5,
    });

    const fullContext = await t.action(api.functions.ai.buildFullContext, {
      agentId,
      query: "test query",
    });

    // Verify all expected fields exist in the return value
    expect(fullContext).toHaveProperty("agentContext");
    expect(fullContext).toHaveProperty("relationshipContext");
    expect(fullContext).toHaveProperty("events");
    expect(fullContext).toHaveProperty("memories");
    expect(fullContext).toHaveProperty("poiContext");
  });
});
