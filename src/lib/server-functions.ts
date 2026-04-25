import { createServerFn } from "@tanstack/react-start";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Try multiple ways to get the Convex URL for server/client compatibility
const convexUrl = 
  process.env.VITE_CONVEX_URL || 
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_CONVEX_URL;

if (!convexUrl) {
  console.error("VITE_CONVEX_URL is not set in process.env or import.meta.env");
}

const httpClient = new ConvexHttpClient(convexUrl || "");

/**
 * Server Function: Manually trigger world tick
 */
export const triggerManualTick = createServerFn({ method: "POST" })
  .handler(async () => {
    return await httpClient.action(api.functions.admin.manualTick, {});
  });

/**
 * Server Function: Manually trigger reflection for an agent
 */
export const triggerManualReflect = createServerFn({ method: "POST" })
  .inputValidator((data: string) => data)
  .handler(async ({ data }) => {
    return await httpClient.action(api.functions.admin.manualReflect, {
      agentId: data as Id<"agents">,
    });
  });

/**
 * Server Function: Reset agent brain
 */
export const resetAgentBrain = createServerFn({ method: "POST" })
  .inputValidator((data: string) => data)
  .handler(async ({ data }) => {
    return await httpClient.mutation(api.functions.admin.resetAgentBrain, {
      agentId: data as Id<"agents">,
    });
  });







