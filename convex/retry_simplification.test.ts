/// <reference types="vite/client" />
import { expect, test, vi } from "vitest";
import { fetchWithRetry } from "./functions/ai_helpers";

/**
 * Phase 8 Track A: Unbottleneck the World Tick — Phase 2
 *
 * These tests verify the retry simplification for chat vs embedding calls.
 * Chat calls should NOT retry on 429 (the chat model has no rate limits),
 * while embedding calls should retain 429 backoff.
 *
 * These tests should FAIL with the current code (uniform 429 handling) and
 * PASS after adding the `skip429Backoff` parameter to fetchWithRetry.
 */

test("fetchWithRetry: chat calls with skip429Backoff return 429 immediately", async () => {
  // Mock fetch to return 429 on first call
  const mockFetch = vi.fn().mockResolvedValue({
    status: 429,
    ok: false,
    text: async () => "Rate limited",
  });
  vi.stubGlobal("fetch", mockFetch);

  // Chat calls should pass skip429Backoff=true — 429 is returned immediately
  // without retry (unlike embedding calls which would retry with backoff)
  const start = Date.now();
  const response = await fetchWithRetry(
    "https://api.test.com/chat",
    { method: "POST" },
    3,
    1000,
    true // skip429Backoff = true for chat calls
  );
  const duration = Date.now() - start;

  // Should return immediately without retry delay
  expect(response.status).toBe(429);
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(duration).toBeLessThan(100); // No exponential backoff delay

  vi.unstubAllGlobals();
});

test("fetchWithRetry: embedding calls still retry on 429 with backoff", async () => {
  // Mock fetch to return 429 on all calls
  const mockFetch = vi.fn().mockResolvedValue({
    status: 429,
    ok: false,
    text: async () => "Rate limited",
  });
  vi.stubGlobal("fetch", mockFetch);

  // Embedding calls should NOT pass skip429Backoff — they keep 429 retry/backoff
  const start = Date.now();
  const response = await fetchWithRetry(
    "https://api.test.com/embeddings",
    { method: "POST" },
    3,
    100 // Small baseDelay for faster test
  );
  const duration = Date.now() - start;

  // Should have retried with backoff (multiple calls, some delay)
  expect(response.status).toBe(429);
  // fetchWithRetry retries maxRetries times, so total = maxRetries + 1 calls
  // But 0-indexed: attempt 0,1,2,3 = 4 calls total
  expect(mockFetch).toHaveBeenCalledTimes(4);
  expect(duration).toBeGreaterThanOrEqual(100); // At least one backoff delay

  vi.unstubAllGlobals();
});

test("fetchWithRetry: chat calls still retry on network errors (5xx, timeout)", async () => {
  // Mock fetch to throw network error on first 2 calls, succeed on 3rd
  let callCount = 0;
  const mockFetch = vi.fn().mockImplementation(async () => {
    callCount++;
    if (callCount <= 2) {
      throw new Error("Network timeout");
    }
    return {
      status: 200,
      ok: true,
      json: async () => ({ result: "success" }),
    };
  });
  vi.stubGlobal("fetch", mockFetch);

  // Chat calls with skip429Backoff should still retry on network errors
  const response = await fetchWithRetry(
    "https://api.test.com/chat",
    { method: "POST" },
    3,
    10, // small delay for fast test
    true // skip429Backoff = true (chat — no 429 retry, but still network error retry)
  );

  expect(response.status).toBe(200);
  // 2 failures + 1 success = 3 calls
  expect(mockFetch).toHaveBeenCalledTimes(3);

  vi.unstubAllGlobals();
});

test("fetchWithRetry: default behavior (embedding) retries on both 429 and network errors", async () => {
  // Mock fetch: first returns 429, then throws, then succeeds
  let callCount = 0;
  const mockFetch = vi.fn().mockImplementation(async () => {
    callCount++;
    if (callCount === 1) return { status: 429, ok: false, text: async () => "Rate limited" };
    if (callCount === 2) throw new Error("Temporary network blip");
    return { status: 200, ok: true, json: async () => ({ result: "success" }) };
  });
  vi.stubGlobal("fetch", mockFetch);

  // Default (no skip429Backoff) — should retry on both 429 and network errors
  const response = await fetchWithRetry(
    "https://api.test.com/embeddings",
    { method: "POST" },
    3,
    10, // small delay for fast test
  );

  expect(response.status).toBe(200);
  // 2 failures + 1 success = 3 calls
  expect(mockFetch).toHaveBeenCalledTimes(3);

  vi.unstubAllGlobals();
});
