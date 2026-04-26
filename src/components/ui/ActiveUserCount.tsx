"use client";

import { api } from "../../../convex/_generated/api";
import usePresenceWithSessionStorage from "../../lib/usePresenceWithSessionStorage";
import { useState } from "react";
import { useQuery } from "convex/react";

export default function ActiveUserCount() {
  const sleepConfig = useQuery(api.functions.world.getSleepConfig);
  const [userId] = useState(() => {
    // Try to get existing user ID from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('simulacra_user_id');
      if (stored) {
        return stored;
      }
    }
    // Generate new user ID
    const newId = `user_${Math.floor(Math.random() * 10000)}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('simulacra_user_id', newId);
    }
    return newId;
  });
  
  const roomId = sleepConfig?.roomId || "main-app";
  const presenceState = usePresenceWithSessionStorage(api.presence, roomId, userId, 10000);

  const onlineUsers = presenceState?.filter((p) => p.online) ?? [];
  const count = onlineUsers.length;
  const isLoading = presenceState === undefined;

  // Optimistic display while loading
  let displayCount: number | string = count;
  let suffix = "";
  if (isLoading) {
    displayCount = 1; // Assume we're online
    suffix = " (connecting...)";
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 text-base font-pixel tracking-wider text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all">
      <span className={`icon flex items-center justify-center ${displayCount > 0 ? "animate-pulse text-lagoon dark:text-lagoon" : "text-slate-400"}`}>
        👁
      </span>
      <span className="count">
        {displayCount} observer{displayCount !== 1 ? "s" : ""}{suffix}
      </span>
    </div>
  );
}