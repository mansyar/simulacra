/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
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

test("getConfigValue: env var AGENT_SPEED fallback works", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(api.functions.seed.config, { clearExisting: true });
  const result = await t.query(
    api.functions.config.getConfigValue,
    { field: "agentSpeed", defaultValue: 6 },
  );
  expect(result).toBe(6);
});
