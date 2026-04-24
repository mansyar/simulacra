"use client";

import { api } from "../../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import { useState } from "react";

export default function ActiveUserCount() {
  const [userId] = useState(() => `user_${Math.floor(Math.random() * 10000)}`);
  const roomId = "main-app";
  const presenceState = usePresence(api.presence, roomId, userId, 10000);

  const count = presenceState?.length ?? 0;

  return (
    <div className="active-user-count">
      <span className="icon">👁</span>
      <span className="count">{count} observer{count !== 1 ? "s" : ""}</span>
    </div>
  );
}