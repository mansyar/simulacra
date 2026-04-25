import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";

export const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    // Auth check: ensure user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    // Optionally verify that the provided userId matches the authenticated user's tokenIdentifier
    // but for now we just ensure authentication.
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomId: v.string() },
  handler: async (ctx, { roomId }) => {
    // Avoid adding per-user reads so all subscriptions can share same cache.
    // In many cases roomId can be used as roomToken if not using signed tokens.
    return await presence.list(ctx, roomId);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // Can't check auth here because it's called over http from sendBeacon.
    return await presence.disconnect(ctx, sessionToken);
  },
});