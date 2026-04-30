import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock ConvexReactClient before any imports
vi.mock("convex/react", () => ({
  ConvexReactClient: vi.fn().mockImplementation(() => ({
    // Mock client instance
  })),
}));

describe("Convex Client (src/lib/convex.ts)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should throw error when VITE_CONVEX_URL is not set", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "");

    await expect(async () => {
      await import("../lib/convex");
    }).rejects.toThrow("VITE_CONVEX_URL is not set");
  });

  it("should create a ConvexReactClient when VITE_CONVEX_URL is set", async () => {
    vi.stubEnv("VITE_CONVEX_URL", "https://test.convex.cloud");

    const mod = await import("../lib/convex");
    expect(mod.convex).toBeTruthy();
  });
});
