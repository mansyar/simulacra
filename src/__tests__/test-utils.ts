/**
 * Reusable test utilities for Simulacra frontend tests.
 *
 * Provides shared mock factories for Convex hooks, TanStack Router,
 * and common test data fixtures to reduce duplication across test files.
 */
import { vi } from "vitest";

// ──────────────────────────────────────────
// Convex Mocks
// ──────────────────────────────────────────

/**
 * Creates a mock Convex module with configurable useQuery and useMutation.
 * Components that need ConvexProvider JSX should add it in their test file.
 */
export function createConvexMock() {
  return {
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn()),
    useConvex: vi.fn(() => ({})),
  };
}

/**
 * Creates a mock TanStack Router module.
 */
export function createRouterMock() {
  return {
    useRouterState: vi.fn(() => ({ location: { pathname: "/" } })),
    useNavigate: vi.fn(() => vi.fn()),
    useParams: vi.fn(() => ({})),
    Link: vi.fn(() => null),
  };
}

/**
 * Creates a mock @convex-dev/presence module.
 */
export function createPresenceMock() {
  return {
    usePresence: vi.fn(() => []),
  };
}

// ──────────────────────────────────────────
// Test Data Fixtures
// ──────────────────────────────────────────

/**
 * Returns a minimal valid agent object for testing.
 */
export function createMockAgent(overrides: Record<string, unknown> = {}) {
  return {
    _id: `agent_${Math.random().toString(36).slice(2, 8)}`,
    _creationTime: Date.now(),
    name: "Test Agent",
    archetype: "builder",
    gridX: 10,
    gridY: 10,
    spriteVariant: 0,
    currentAction: "idle",
    hunger: 50,
    energy: 50,
    social: 50,
    isActive: true,
    ...overrides,
  };
}

/**
 * Returns an array of mock agents with distinct names and archetypes.
 */
export function createMockAgents(count: number = 3) {
  const archetypes = ["builder", "socialite", "philosopher", "explorer", "nurturer"] as const;
  const names = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
  return Array.from({ length: count }, (_, i) =>
    createMockAgent({
      _id: `agent${i + 1}`,
      name: names[i % names.length],
      archetype: archetypes[i % archetypes.length],
      gridX: 10 + i * 5,
      gridY: 10 + i * 5,
    })
  );
}

/**
 * Returns a mock event for the sensory buffer.
 */
export function createMockEvent(overrides: Record<string, unknown> = {}) {
  return {
    _id: `evt_${Math.random().toString(36).slice(2, 8)}`,
    _creationTime: Date.now(),
    agentId: "agent1",
    agentName: "Alpha",
    type: "movement",
    description: "Moved to a new location",
    gridX: 10,
    gridY: 10,
    ...overrides,
  };
}

/**
 * Returns an array of mock events with varied types.
 */
export function createMockEvents(count: number = 3) {
  const types = ["movement", "interaction", "conversation", "need_change", "weather_change"] as const;
  const descriptions = [
    "explored the northern ridge",
    "chatted with a fellow villager",
    "had a deep conversation",
    "felt hungry after walking",
    "watched the sky turn cloudy",
  ];
  return Array.from({ length: count }, (_, i) =>
    createMockEvent({
      _id: `evt${i + 1}`,
      type: types[i % types.length],
      description: `${["Alpha", "Beta", "Gamma"][i % 3]} ${descriptions[i % descriptions.length]}`,
    })
  );
}

/**
 * Returns a mock world state object.
 */
export function createMockWorldState(overrides: Record<string, unknown> = {}) {
  return {
    _id: "world_state_1",
    _creationTime: Date.now(),
    weather: "sunny",
    timeOfDay: 12,
    dayCount: 1,
    tickIntervalSeconds: 60,
    totalTicks: 42,
    lastTickAt: Date.now(),
    lastUserActivityAt: Date.now(),
    ...overrides,
  };
}
