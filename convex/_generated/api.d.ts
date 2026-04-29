/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as functions_admin from "../functions/admin.js";
import type * as functions_agents from "../functions/agents.js";
import type * as functions_ai from "../functions/ai.js";
import type * as functions_ai_helpers from "../functions/ai_helpers.js";
import type * as functions_config from "../functions/config.js";
import type * as functions_memory from "../functions/memory.js";
import type * as functions_seed from "../functions/seed.js";
import type * as functions_sentiment from "../functions/sentiment.js";
import type * as functions_world from "../functions/world.js";
import type * as presence from "../presence.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "functions/admin": typeof functions_admin;
  "functions/agents": typeof functions_agents;
  "functions/ai": typeof functions_ai;
  "functions/ai_helpers": typeof functions_ai_helpers;
  "functions/config": typeof functions_config;
  "functions/memory": typeof functions_memory;
  "functions/seed": typeof functions_seed;
  "functions/sentiment": typeof functions_sentiment;
  "functions/world": typeof functions_world;
  presence: typeof presence;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
