/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a mock of the presence module to satisfy the dependency in world.ts
const presenceMock = {
  list: query({
    args: { roomToken: v.string() },
    handler: async () => [],
  }),
  heartbeat: mutation({
    args: {
      roomId: v.string(),
      userId: v.string(),
      sessionId: v.string(),
      interval: v.number(),
    },
    handler: async () => {},
  }),
  disconnect: mutation({
    args: { sessionToken: v.string() },
    handler: async () => {},
  }),
};

// We'll pass our own modules map to convexTest
const modules = {
  ...import.meta.glob("./**/*.ts"),
  "./presence.ts": async () => presenceMock,
};

test("sleep mode: stays awake during grace period", async () => {
  const t = convexTest(schema, modules);
  process.env.ENABLE_SLEEP_MODE = "true";
  process.env.SLEEP_MODE_GRACE_PERIOD = "30000";

  // Create world state with recent activity (10s ago)
  const tenSecondsAgo = Date.now() - 10000;
  await t.mutation(api.functions.world.updateState, {
    lastUserActivityAt: tenSecondsAgo
  });

  const status = await t.action(api.functions.world.checkSleepMode, {});
  expect(status.sleeping).toBe(false);
  expect(status.reason).toContain("within grace period");

  delete process.env.ENABLE_SLEEP_MODE;
  delete process.env.SLEEP_MODE_GRACE_PERIOD;
});

test("sleep mode: sleeps immediately after grace period (no 30m timeout)", async () => {
  const t = convexTest(schema, modules);
  process.env.ENABLE_SLEEP_MODE = "true";
  process.env.SLEEP_MODE_GRACE_PERIOD = "30000";

  // Create world state with old activity (40s ago)
  // This is outside the 30s grace period.
  const fortySecondsAgo = Date.now() - 40000;
  await t.mutation(api.functions.world.updateState, {
    lastUserActivityAt: fortySecondsAgo,
    lastTickAt: fortySecondsAgo
  });

  const status = await t.action(api.functions.world.checkSleepMode, {});
  
  // BEFORE the fix, this would have been FALSE (because 40s < 30m)
  // AFTER the fix, this should be TRUE
  expect(status.sleeping).toBe(true);
  expect(status.reason).toContain("Inactive for 40s");

  delete process.env.ENABLE_SLEEP_MODE;
  delete process.env.SLEEP_MODE_GRACE_PERIOD;
});
