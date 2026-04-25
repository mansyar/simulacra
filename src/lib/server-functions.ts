import { createServerFn } from "@tanstack/react-start";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const convexUrl = process.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL is not set");
}

const httpClient = new ConvexHttpClient(convexUrl);

/**
 * Server Function: Manually trigger world tick
 */
export const triggerManualTick = (createServerFn({ method: "POST" }) as any)
  .handler(async () => {
    return await httpClient.action(api.functions.admin.manualTick, {});
  });

/**
 * Server Function: Manually trigger reflection for an agent
 */
export const triggerManualReflect = (createServerFn({ method: "POST" }) as any)
  .handler(async ({ data }: { data: string }) => {
    return await httpClient.action(api.functions.admin.manualReflect, {
      agentId: data as Id<"agents">,
    });
  });

/**
 * Server Function: Reset agent brain
 */
export const resetAgentBrain = (createServerFn({ method: "POST" }) as any)
  .handler(async ({ data }: { data: string }) => {
    return await httpClient.mutation(api.functions.admin.resetAgentBrain, {
      agentId: data as Id<"agents">,
    });
  });
