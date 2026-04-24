import { expect, test } from "vitest";
import { api } from "./_generated/api";

test("presence.heartbeat exists", () => {
  // This test just ensures the API reference is valid
  expect(api.presence).toBeDefined();
  expect(api.presence.heartbeat).toBeDefined();
});

test("presence.list exists", () => {
  expect(api.presence.list).toBeDefined();
});

test("presence.disconnect exists", () => {
  expect(api.presence.disconnect).toBeDefined();
});