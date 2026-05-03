/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("resolveMovement clamps position at upper boundary (interpolated path)", async () => {
  const t = convexTest(schema, modules);

  // Agent at (60, 60) heading to (70, 70) — movement will overshoot the [0,63] grid
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "UpperClamp",
    archetype: "explorer",
    gridX: 60,
    gridY: 60,
  });

  // Use _testSetTarget to bypass any clamping and set off-map target
  await t.mutation(internal.functions.agents._testSetTarget, {
    agentId,
    targetX: 70,
    targetY: 70,
  });

  await t.mutation(internal.functions.agents.resolveMovement, {
    agentId,
    speedMultiplier: 1,
  });

  const agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent?.gridX).toBe(63);
  expect(agent?.gridY).toBe(63);
});

test("resolveMovement clamps position at lower boundary (interpolated path)", async () => {
  const t = convexTest(schema, modules);

  // Agent at (2, 60) heading to (-10, 60) — movement will go below 0
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "LowerClamp",
    archetype: "explorer",
    gridX: 2,
    gridY: 60,
  });

  await t.mutation(internal.functions.agents._testSetTarget, {
    agentId,
    targetX: -10,
    targetY: 60,
  });

  await t.mutation(internal.functions.agents.resolveMovement, {
    agentId,
    speedMultiplier: 1,
  });

  const agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent?.gridX).toBe(0);
});

test("resolveMovement clamps position in snap path (distance < 0.1)", async () => {
  const t = convexTest(schema, modules);

  // Agent at (63, 63) with target just beyond boundary at (63.05, 63.05)
  // Distance = sqrt(0.05^2 + 0.05^2) = 0.0707 < 0.1 → snap path
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "SnapClamp",
    archetype: "explorer",
    gridX: 63,
    gridY: 63,
  });

  await t.mutation(internal.functions.agents._testSetTarget, {
    agentId,
    targetX: 63.05,
    targetY: 63.05,
  });

  await t.mutation(internal.functions.agents.resolveMovement, {
    agentId,
    speedMultiplier: 1,
  });

  const agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent?.gridX).toBe(63);
  expect(agent?.gridY).toBe(63);
});

test("resolveMovement marks arrived and clears targets when clamping changes position", async () => {
  const t = convexTest(schema, modules);

  // Agent at (60, 60) heading to (70, 70) — raw newX would be ~64.24, clamped to 63
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "StuckGuard",
    archetype: "explorer",
    gridX: 60,
    gridY: 60,
  });

  await t.mutation(internal.functions.agents._testSetTarget, {
    agentId,
    targetX: 70,
    targetY: 70,
  });

  await t.mutation(internal.functions.agents.resolveMovement, {
    agentId,
    speedMultiplier: 1,
  });

  const agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent?.targetX).toBeUndefined();
  expect(agent?.targetY).toBeUndefined();
});

test("updateAction clamps targetX/targetY to [0, 63]", async () => {
  const t = convexTest(schema, modules);

  const agentId = await t.mutation(api.functions.agents.create, {
    name: "ActionClamp",
    archetype: "explorer",
    gridX: 30,
    gridY: 30,
  });

  await t.mutation(internal.functions.agents.updateAction, {
    agentId,
    action: "walking",
    targetX: 100,
    targetY: -10,
  });

  const agent = await t.query(api.functions.agents.getById, { agentId });
  expect(agent?.targetX).toBe(63);
  expect(agent?.targetY).toBe(0);
});
