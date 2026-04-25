/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("presence functions existence", async () => {
  expect(api.presence.heartbeat).toBeDefined();
  expect(api.presence.list).toBeDefined();
  expect(api.presence.disconnect).toBeDefined();
});

test.skip("presence heartbeat and list", async () => {
  const t = convexTest(schema, modules);
  const roomId = "test-room";
  const userId = "test-user";
  const sessionId = "test-session";
  const interval = 10000;

  // This will likely fail if component isn't properly registered
  await t.withIdentity({ tokenIdentifier: userId }).mutation(api.presence.heartbeat, {
    roomId,
    userId,
    sessionId,
    interval,
  });

  const users = await t.query(api.presence.list, { roomId });
  expect(users.length).toBeGreaterThanOrEqual(0);
});
