"use client";

import { api } from "../../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import { useState } from "react";

export default function ActiveUserCount() {
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
  const roomId = "main-app";
  const presenceState = usePresence(api.presence, roomId, userId, 10000);

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
    <div className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-slate-300 bg-slate-800/50 rounded-full border border-slate-700/50">
      <span className="icon">👁</span>
      <span className="count">
        {displayCount} observer{displayCount !== 1 ? "s" : ""}{suffix}
      </span>
    </div>
  );
}