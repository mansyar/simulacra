/**
 * Shared type interfaces for the Convex backend.
 *
 * This module centralizes all custom type definitions used across
 * Convex functions, replacing `any` annotations throughout the codebase.
 *
 * Where possible, types reference the generated Convex data model types
 * (Doc<TableName>, Id<TableName>) from `convex/_generated/dataModel`.
 */

import type { Doc } from "../_generated/dataModel";
import type { ActionCtx as GeneratedActionCtx } from "../_generated/server";

// ──────────────────────────────────────────
// Re-exports & Type Aliases
// ──────────────────────────────────────────

/**
 * The action context type for Convex action functions.
 * Re-exported for convenience so consumers can import from a single module.
 */
export type ActionCtx = GeneratedActionCtx;

/**
 * The raw agent document as stored in Convex.
 * Represents a row in the `agents` table.
 */
export type AgentDoc = Doc<"agents">;

/**
 * The raw world state document as stored in Convex.
 */
export type WorldStateDoc = Doc<"world_state">;

/**
 * The raw config document as stored in Convex.
 */
export type ConfigDoc = Doc<"config">;

/**
 * A single relationship document.
 */
export type RelationshipDoc = Doc<"relationships">;

/**
 * A single event document for the sensory buffer.
 */
export type EventDoc = Doc<"events">;

/**
 * A single memory document (semantic, sensory, reflection, or interaction).
 */
export type MemoryDoc = Doc<"memories">;

/**
 * A point-of-interest document.
 */
export type POIDoc = Doc<"pois">;

// ──────────────────────────────────────────
// AgentState — typed agent with runtime fields
// ──────────────────────────────────────────

/**
 * The runtime representation of an agent processed during a world tick.
 *
 * This extends Doc<"agents"> with all the fields the codebase accesses,
 * providing a fully typed view of the agent object used in world.ts helpers.
 *
 * Fields like `targetX`, `targetY`, `conversationState` are optional
 * because they may not be set for every agent.
 */
export type AgentState = Doc<"agents">;

// ──────────────────────────────────────────
// WorldStateConfig — typed world state
// ──────────────────────────────────────────

/**
 * Configuration and runtime state for the world simulation.
 *
 * Mirrors the `world_state` table but exposed as a plain interface
 * for use in helper functions that receive world state as a parameter.
 */
export type WorldState = Doc<"world_state">;

// ──────────────────────────────────────────
// ProcessedAgentDecision — AI decision output
// ──────────────────────────────────────────

/**
 * The structured decision object returned by the AI decision-making action.
 *
 * This mirrors the JSON schema enforced in the LLM prompt.
 */
export interface ProcessedAgentDecision {
  /** Internal reasoning / monologue */
  thought: string;
  /** The chosen action */
  action: "idle" | "walking" | "eating" | "sleeping" | "talking" | "working" | "exploring";
  /** Target name, coordinates "x,y", or "none" */
  target: string;
  /** Spoken dialogue (empty string if not talking) */
  speech: string;
  /** Decision certainty (0.0 to 1.0) */
  confidence: number;
}

// ──────────────────────────────────────────
// ConversationState — typed conversation state
// ──────────────────────────────────────────

/**
 * The conversation state embedded in an agent document.
 */
export interface ConversationState {
  partnerId: string;
  role: "initiator" | "responder";
  turnCount: number;
  myLastSpeech?: string;
  startedAt: number;
}

// ──────────────────────────────────────────
// AiConfig — AI provider configuration
// ──────────────────────────────────────────

/**
 * AI provider configuration for making API calls.
 *
 * Matches the interface defined in `ai_helpers.ts`.
 */
export interface AiConfig {
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
}

// ──────────────────────────────────────────
// API request/response types for ai_helpers.ts
// ──────────────────────────────────────────

/**
 * A chat message in OpenAI-compatible format.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Options for the chat completion helper, including structured output format.
 */
export interface ChatCompletionOptions {
  responseFormat?: Record<string, unknown>;
}

/**
 * OpenAI-compatible chat completion request body.
 */
export interface ChatCompletionRequestBody {
  model: string;
  messages: ChatMessage[];
  response_format?: Record<string, unknown>;
}

/**
 * A model listing entry from an OpenAI-compatible API.
 */
export interface ModelEntry {
  id: string;
  name: string;
  owned_by?: string;
  methods?: string[];
}

/**
 * Google Gemini native model listing entry.
 */
export interface GoogleModelEntry {
  id: string;
  name: string;
  methods: string[];
}

/**
 * OpenAI-compatible embedding request body.
 */
export interface EmbeddingRequestBody {
  model: string;
  input: string | string[];
  dimensions?: number;
}

/**
 * OpenAI-compatible embedding response item.
 */
export interface EmbeddingResponseItem {
  embedding: number[];
  index?: number;
}

/**
 * OpenAI-compatible embedding response.
 */
export interface EmbeddingResponse {
  data: EmbeddingResponseItem[];
  embeddings?: number[][];
}

// ──────────────────────────────────────────
// ListModelsAction response types
// ──────────────────────────────────────────

/**
 * A single model entry in the list models response.
 * Supports both Google-native and OpenAI-compatible formats.
 */
export interface ListModelsItem {
  id: string;
  name: string;
  owned_by?: string;
  methods?: string[];
}

/**
 * List models action success response (Google-native).
 */
export interface GoogleListModelsResponse {
  provider: "google-native";
  models: ListModelsItem[];
  chatModels: ListModelsItem[];
  embedModels: ListModelsItem[];
}

/**
 * List models action success response (OpenAI-compatible).
 */
export interface OpenAIListModelsResponse {
  provider: "openai-compatible";
  models: ListModelsItem[];
}

/**
 * Union type for the list models action response.
 */
export type ListModelsResponse =
  | GoogleListModelsResponse
  | OpenAIListModelsResponse
  | { models: []; error: string };

// ──────────────────────────────────────────
// ProcessedAgent — agent with computed fields
// ──────────────────────────────────────────

/**
 * An agent document augmented with runtime-computed fields.
 *
 * Used when presenting agent data to the UI or when additional context
 * needs to be attached to the raw document.
 */
export interface ProcessedAgent extends Doc<"agents"> {
  /** Names of nearby agents (resolved during world tick) */
  nearbyAgentNames?: string[];
  /** Human-readable display name */
  displayName?: string;
}

// ──────────────────────────────────────────
// Utility Types
// ──────────────────────────────────────────

/**
 * Makes all properties of T deeply optional (recursive).
 * Useful for partial updates and patch operations.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Removes `readonly` from all properties.
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Extracts the element type from an array type.
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

/**
 * Makes specified keys of T required (removes optional modifier).
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Makes specified keys of T optional.
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};

/**
 * A non-nullable version of T.
 * Equivalent to `NonNullable<T>` from standard lib, re-exported for convenience.
 */
export type NonNullable<T> = T extends null | undefined ? never : T;
