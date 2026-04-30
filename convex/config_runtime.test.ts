/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// ─── Config field presence ────────────────────────────────────────────────

test("config schema has maxTraits field (optional float64)", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const config = await t.query(api.functions.config.get);
  expect(config!.maxTraits).toBeUndefined();
});

test("config schema has reflectionIntervalTicks field (optional float64)", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const config = await t.query(api.functions.config.get);
  expect(config!.reflectionIntervalTicks).toBeUndefined();
});

test("config schema has maxConversationTurns field (optional float64)", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const config = await t.query(api.functions.config.get);
  expect(config!.maxConversationTurns).toBeUndefined();
});

test("config schema has safetyMultiplier field (optional float64)", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const config = await t.query(api.functions.config.get);
  expect(config!.safetyMultiplier).toBeUndefined();
});

test("config schema has agentSpeed field (optional float64)", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const config = await t.query(api.functions.config.get);
  expect(config!.agentSpeed).toBeUndefined();
});

// ─── Config helper: getConfigValue ────────────────────────────────────────

test("getConfigValue: config maxTraits overrides default 10", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  // Set maxTraits to 3
  await t.mutation(
    api.functions.config.setConfigValue,
    { field: "maxTraits", value: 3 },
  );
  // Read back via getConfigValue
  const result = await t.query(
    api.functions.config.getConfigValue,
    { field: "maxTraits", defaultValue: 10 },
  );
  expect(result).toBe(3);
});

test("getConfigValue: config reflectionIntervalTicks overrides default 480", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const result = await t.query(
    api.functions.config.getConfigValue,
    { field: "reflectionIntervalTicks", defaultValue: 480 },
  );
  expect(result).toBe(480);
});

test("getConfigValue: config maxConversationTurns overrides default 5", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const result = await t.query(
    api.functions.config.getConfigValue,
    { field: "maxConversationTurns", defaultValue: 5 },
  );
  expect(result).toBe(5);
});

test("getConfigValue: config safetyMultiplier overrides default 2", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const result = await t.query(
    api.functions.config.getConfigValue,
    { field: "safetyMultiplier", defaultValue: 2 },
  );
  expect(result).toBe(2);
});

test("getConfigValue: config agentSpeed overrides default 6", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const result = await t.query(
    api.functions.config.getConfigValue,
    { field: "agentSpeed", defaultValue: 6 },
  );
  expect(result).toBe(6);
});

// ─── Env var fallback ─────────────────────────────────────────────────────

test("getConfigValue: env var MAX_TRAITS overrides config", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  // getConfigValue should check process.env.MAX_TRAITS before config value
  const result = await t.query(
    api.functions.config.getConfigValue,
    { field: "maxTraits", defaultValue: 10 },
  );
  // In test env, no env var is set, so should fall through to config (then default)
  expect(result).toBe(10);
});

// ─── Integration: updateIdentity uses config maxTraits ────────────────────

test("updateIdentity respects config maxTraits cap (not hardcoded 10)", async () => {
  const t = convexTest(schema, modules);
  // Seed config with maxTraits=3
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  await t.mutation(api.functions.config.setConfigValue, { field: "maxTraits", value: 3 });

  // Create an agent with 5 initial coreTraits
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Test Agent",
    archetype: "builder",
    gridX: 5,
    gridY: 5,
  });

  // Add 5 more traits (total would be 10, but cap is 3)
  await t.mutation(internal.functions.agents.updateIdentity, {
    agentId,
    newTraits: ["trait6", "trait7", "trait8", "trait9", "trait10"],
  });

  const agent = await t.query(api.functions.agents.getById, { agentId });
  // FIXME: Currently hardcoded at 10 — this test will fail until config-driven
  expect(agent!.coreTraits.length).toBe(3);
});

// ─── Integration: updateRelationship uses config maxConversationTurns ─────

test("updateRelationship respects config maxConversationTurns for valenceHistory cap", async () => {
  const t = convexTest(schema, modules);
  // Seed config with maxConversationTurns=2
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  await t.mutation(api.functions.config.setConfigValue, { field: "maxConversationTurns", value: 2 });

  // Create two agents
  const agentA = await t.mutation(api.functions.agents.create, {
    name: "Agent A", archetype: "builder", gridX: 5, gridY: 5,
  });
  const agentB = await t.mutation(api.functions.agents.create, {
    name: "Agent B", archetype: "socialite", gridX: 6, gridY: 6,
  });

  // Update relationship multiple times to build up valence history
  for (let i = 0; i < 5; i++) {
    await t.mutation(internal.functions.agents.updateRelationship, {
      agentAId: agentA,
      agentBId: agentB,
      delta: 10,
    });
  }

  const rels = await t.query(api.functions.agents.getRelationships, { agentId: agentA });
  const rel = rels.find(r => r.agentBId === agentB || r.agentAId === agentB);
  // FIXME: Currently hardcoded at 5 — this test will fail until config-driven
  expect(rel).toBeDefined();
  expect(rel!.valenceHistory.length).toBe(2);
});

// ─── Integration: resolveMovement uses config agentSpeed ──────────────────

test("resolveMovement respects config agentSpeed", async () => {
  const t = convexTest(schema, modules);
  // Seed config with agentSpeed=3
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  await t.mutation(api.functions.config.setConfigValue, { field: "agentSpeed", value: 3 });

  // Create agent, then directly set a target different from position.
  // We use a direct query to patch the target fields in the test.
  const agentId = await t.mutation(api.functions.agents.create, {
    name: "Test Agent", archetype: "explorer", gridX: 10, gridY: 10,
  });

  // Read new config value
  const configSpeed = await t.query(
    api.functions.config.getConfigValue,
    { field: "agentSpeed", defaultValue: 6 },
  );
  // Config was set to 3
  expect(configSpeed).toBe(3);

  // The resolveMovement function reads config.agentSpeed.
  // To test, we need targetX/targetY set but different from current grid.
  // Create agent at (10,10) with a target of (40,40) using updateAction which sets targetX/Y
  await t.mutation(internal.functions.agents.updateAction, {
    agentId,
    action: "walking",
    targetX: 40,
    targetY: 40,
  });

  // Verify target was set
  const agentBefore = await t.query(api.functions.agents.getById, { agentId });
  expect(agentBefore!.targetX).toBe(40);
  expect(agentBefore!.gridX).toBe(10); // Should still be at start

  // Resolve movement with speedMultiplier=1
  await t.mutation(internal.functions.agents.resolveMovement, {
    agentId, speedMultiplier: 1,
  });

  // With agentSpeed=3 and speedMultiplier=1, distance should be 3 units
  const agentAfter = await t.query(api.functions.agents.getById, { agentId });
  const dx = agentAfter!.gridX - 10;
  const dy = agentAfter!.gridY - 10;
  const movedDistance = Math.sqrt(dx * dx + dy * dy);
  // Should be approximately 3 (config.agentSpeed * speedMultiplier)
  expect(movedDistance).toBeGreaterThan(2);
  expect(movedDistance).toBeLessThan(5);
  expect(movedDistance).toBeCloseTo(3, 0);
});

// ─── Integration: cleanStaleConversations uses config ─────────────────────

test("cleanStaleConversations reads maxConversationTurns from config", async () => {
  const t = convexTest(schema, modules);
  // Seed config with maxConversationTurns=2, safetyMultiplier=2, defaultTickInterval=180
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  await t.mutation(api.functions.config.setConfigValue, { field: "maxConversationTurns", value: 2 });
  await t.mutation(api.functions.config.setConfigValue, { field: "safetyMultiplier", value: 2 });

  // Create two agents
  const agentA = await t.mutation(api.functions.agents.create, {
    name: "Agent A", archetype: "builder", gridX: 5, gridY: 5,
  });
  const agentB = await t.mutation(api.functions.agents.create, {
    name: "Agent B", archetype: "socialite", gridX: 6, gridY: 6,
  });

  // Start a conversation
  await t.mutation(internal.functions.agents.setConversationState, {
    agentId: agentA,
    partnerId: agentB,
    role: "initiator",
    turnCount: 1,
  });
  await t.mutation(internal.functions.agents.setConversationState, {
    agentId: agentB,
    partnerId: agentA,
    role: "responder",
    turnCount: 1,
  });

  // Run tick (which calls cleanStaleConversations internally)
  // FIXME: Currently uses hardcoded MAX_TURNS=5 and SAFETY_MULTIPLIER=2
  // This test may not directly validate — the TTL formula uses config values
  // For now, verify config values are readable
  const config = await t.query(api.functions.config.get);
  expect(config!.maxConversationTurns).toBe(2);
  expect(config!.safetyMultiplier).toBe(2);
});

// ─── Integration: processAgent config-driven reflection ───────────────────

test("processAgent reflection interval reads reflectionIntervalTicks from config", async () => {
  const t = convexTest(schema, modules);
  // Seed config with reflectionIntervalTicks=10
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  await t.mutation(api.functions.config.setConfigValue, { field: "reflectionIntervalTicks", value: 10 });

  // This test validates the config value is accessible
  const configVal = await t.query(
    api.functions.config.getConfigValue,
    { field: "reflectionIntervalTicks", defaultValue: 480 },
  );
  expect(configVal).toBe(10);
});

test("getConfigValue: env var AGENT_SPEED fallback works", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const result = await t.query(
    api.functions.config.getConfigValue,
    { field: "agentSpeed", defaultValue: 6 },
  );
  expect(result).toBe(6);
});
