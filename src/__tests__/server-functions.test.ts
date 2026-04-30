import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- Mock setup ---

const mockAction = vi.fn();
const mockMutation = vi.fn();

vi.mock("convex/browser", () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    action: mockAction,
    mutation: mockMutation,
  })),
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    functions: {
      admin: {
        manualTick: "admin:manualTick",
        manualReflect: "admin:manualReflect",
        resetAgentBrain: "admin:resetAgentBrain",
        resetWorld: "admin:resetWorld",
      },
    },
  },
}));

/**
 * Mock TanStack Start's createServerFn.
 * Returns a builder with .inputValidator() and .handler().
 * .handler(fn) returns a callable function that delegates to the handler.
 */
vi.mock("@tanstack/react-start", () => {
  type Builder = {
    _validator: ((data: unknown) => unknown) | null;
    inputValidator: ReturnType<typeof vi.fn>;
    handler: ReturnType<typeof vi.fn>;
  };

  return {
    createServerFn: vi.fn(() => {
      const builder: Builder = {
        _validator: null,
        inputValidator: vi.fn(
          (validator: (data: unknown) => unknown) => {
            builder._validator = validator;
            return builder;
          },
        ),
        handler: vi.fn(
          (handler: (opts: { data: unknown }) => unknown) => {
            const callable = async (payload?: unknown) => {
              const data = builder._validator
                ? builder._validator(payload)
                : payload;
              return handler({ data });
            };
            return callable;
          },
        ),
      };

      return builder;
    }),
  };
});

// --- Tests ---

describe("Server Functions (src/lib/server-functions.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set a valid URL to prevent console.error
    vi.stubEnv("VITE_CONVEX_URL", "https://test.convex.cloud");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("triggerManualTick should call httpClient.action with admin.manualTick", async () => {
    mockAction.mockResolvedValue({ ticked: true });
    const { triggerManualTick } = await import("../lib/server-functions");

    const result = await triggerManualTick();

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockAction).toHaveBeenCalledWith("admin:manualTick", {});
    expect(result).toEqual({ ticked: true });
  });

  it("triggerManualReflect should call httpClient.action with admin.manualReflect and agentId", async () => {
    mockAction.mockResolvedValue({ reflected: true });
    const { triggerManualReflect } = await import("../lib/server-functions");
    // @ts-expect-error — mock creates simpler function signature than TanStack's createServerFn type
    const result = await triggerManualReflect("agent_123");

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockAction).toHaveBeenCalledWith("admin:manualReflect", {
      agentId: "agent_123",
    });
    expect(result).toEqual({ reflected: true });
  });

  it("resetAgentBrain should call httpClient.mutation with admin.resetAgentBrain and agentId", async () => {
    mockMutation.mockResolvedValue({ reset: true });
    const { resetAgentBrain } = await import("../lib/server-functions");
    // @ts-expect-error — mock creates simpler function signature than TanStack's createServerFn type
    const result = await resetAgentBrain("agent_456");

    expect(mockMutation).toHaveBeenCalledTimes(1);
    expect(mockMutation).toHaveBeenCalledWith("admin:resetAgentBrain", {
      agentId: "agent_456",
    });
    expect(result).toEqual({ reset: true });
  });

  it("resetWorldState should call httpClient.mutation with admin.resetWorld", async () => {
    mockMutation.mockResolvedValue({ reset: true });
    const { resetWorldState } = await import("../lib/server-functions");

    const result = await resetWorldState();

    expect(mockMutation).toHaveBeenCalledTimes(1);
    expect(mockMutation).toHaveBeenCalledWith("admin:resetWorld", {});
    expect(result).toEqual({ reset: true });
  });
});
