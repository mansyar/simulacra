/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("getAll returns empty array when no agents", async () => {
  const t = convexTest(schema, modules);
  const agents = await t.query(api.functions.agents.getAll);
  expect(agents).toEqual([]);
});

test("getAll returns active agents", async () => {
  const t = convexTest(schema, modules);
  // Create an agent
  await t.mutation(api.functions.agents.create, {
    name: "Test Agent",
    archetype: "builder",
    gridX: 0,
    gridY: 0,
    spriteVariant: 0,
  });
  const agents = await t.query(api.functions.agents.getAll);
  expect(agents).toHaveLength(1);
  expect(agents[0].name).toBe("Test Agent");
  expect(agents[0].isActive).toBe(true);
});

test("getById returns correct agent", async () => {
  const t = convexTest(schema, modules);
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Agent 2",
    archetype: "socialite",
    gridX: 10,
    gridY: 20,
  });
  const agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent).toBeTruthy();
  expect(agent?.name).toBe("Agent 2");
  expect(agent?.gridX).toBe(10);
});

test("updatePosition updates agent coordinates", async () => {
  const t = convexTest(schema, modules);
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Agent 3",
    archetype: "explorer",
    gridX: 5,
    gridY: 5,
  });
  await t.mutation(api.functions.agents.updatePosition, {
    agentId,
    targetX: 30,
    targetY: 40,
  });
  const agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent?.targetX).toBe(30);
  expect(agent?.targetY).toBe(40);
});