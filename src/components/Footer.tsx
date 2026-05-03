import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function Footer() {
  const worldState = useQuery(api.functions.world.getState);
  const agents = useQuery(api.functions.agents.getAll);
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update countdown every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Loading state: render nothing
  if (!worldState || !agents) return null;

  const totalTicks = worldState.totalTicks ?? 0;
  const lastTickAt = worldState.lastTickAt ?? 0;
  const tickInterval = worldState.tickIntervalSeconds ?? 60;
  const activeAgentCount = agents.filter((a) => a.isActive).length;

  // Sleep mode: sleeping if no recent user activity (beyond grace period of 30s)
  const lastActivity = worldState.lastUserActivityAt ?? 0;
  const sleeping = lastActivity > 0 && (now - lastActivity) > 30000;

  // Next tick countdown — cycle forward past the last tick by interval until future
  const intervalMs = tickInterval * 1000;
  let nextTickMs = lastTickAt > 0 ? lastTickAt + intervalMs : now + intervalMs;
  while (nextTickMs <= now) {
    nextTickMs += intervalMs;
  }
  const countdownSeconds = Math.max(0, Math.floor((nextTickMs - now) / 1000));
  const countdownDisplay = countdownSeconds > 0 ? `${countdownSeconds}s` : "Tick now";

  // Relative time for last tick
  const relativeTime = lastTickAt > 0 ? formatRelativeTime(lastTickAt) : "—";

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 flex items-center px-4 gap-4 text-[11px] font-mono text-slate-400 z-30">
      <span className="flex items-center gap-1.5">
        <span className="text-slate-600">Ticks:</span>
        <span className="text-slate-300">{totalTicks}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-slate-600">Active:</span>
        <span className="text-slate-300">{activeAgentCount}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-slate-600">Last:</span>
        <span className="text-slate-300">{relativeTime}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-slate-600">Next:</span>
        <span className="text-slate-300">{countdownDisplay}</span>
      </span>
      <span className="ml-auto flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${sleeping ? "bg-amber-500" : "bg-green-500"}`} />
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
          {sleeping ? "Sleeping" : "Active"}
        </span>
      </span>
    </div>
  );
}
