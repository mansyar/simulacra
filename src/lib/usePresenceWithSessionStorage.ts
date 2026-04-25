/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import type { PresenceState } from "@convex-dev/presence/react";

/**
 * Wraps a function to single-flight invocations, using the latest args.
 * (Copied from @convex-dev/presence internal utility)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useSingleFlight<F extends (...args: any[]) => Promise<any>>(fn: F): (...args: Parameters<F>) => ReturnType<F> {
  const flightStatus = useRef({
    inFlight: false,
    upNext: null as { fn: F; resolve: (value: any) => void; reject: (reason?: any) => void; args: Parameters<F> } | null,
  });
  return useCallback((...args: Parameters<F>): ReturnType<F> => {
    if (flightStatus.current.inFlight) {
      const promise = new Promise((resolve, reject) => {
        flightStatus.current.upNext = { fn, resolve, reject, args };
      });
      return promise as any as ReturnType<F>;
    }
    flightStatus.current.inFlight = true;
    const firstReq = fn(...args) as ReturnType<F>;
    void (async () => {
      try {
        await firstReq;
      } finally {
        // If it failed, we naively just move on to the next request.
      }
      while (flightStatus.current.upNext) {
        const cur = flightStatus.current.upNext;
        flightStatus.current.upNext = null;
        await cur
          .fn(...cur.args)
          .then(cur.resolve)
          .catch(cur.reject);
      }
      flightStatus.current.inFlight = false;
    })();
    return firstReq;
  }, [fn]);
}

/**
 * Custom hook that duplicates @convex-dev/presence/usePresence but with sessionStorage persistence
 * for session IDs. This ensures the same session ID persists across page reloads.
 */
export default function usePresenceWithSessionStorage(
  presence: any,
  roomId: string,
  userId: string,
  interval: number = 10000,
  convexUrl?: string
): PresenceState[] | undefined {
  const hasMounted = useRef(false);
  const convex = useConvex();
  const baseUrl = convexUrl ?? (convex ? convex.url : "");

  // Generate or retrieve session ID from sessionStorage
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === "undefined") return crypto.randomUUID();
    
    const storageKey = `presence_session_${roomId}_${userId}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    
    // Generate new session ID
    const newId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, newId);
    return newId;
  });

  // Update sessionStorage when sessionId changes
  useEffect(() => {
    if (typeof window !== "undefined" && sessionId) {
      const storageKey = `presence_session_${roomId}_${userId}`;
      sessionStorage.setItem(storageKey, sessionId);
    }
  }, [sessionId, roomId, userId]);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const [roomToken, setRoomToken] = useState<string | null>(null);
  const roomTokenRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const heartbeat = useSingleFlight(useMutation(presence.heartbeat));
  const disconnect = useSingleFlight(useMutation(presence.disconnect));

  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip on first mount to preserve the session ID from useState initializer
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Reset session state when roomId or userId changes.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sessionTokenRef.current) {
      void (disconnect as any)({ sessionToken: sessionTokenRef.current });
    }
    // Generate new session ID for new room/user combination
    if (typeof window !== "undefined") {
      const storageKey = `presence_session_${roomId}_${userId}`;
      const newId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, newId);
      setSessionId(newId);
    }
    setSessionToken(null);
    setRoomToken(null);
  }, [roomId, userId, disconnect]);

  useEffect(() => {
    // Update refs whenever tokens change.
    sessionTokenRef.current = sessionToken;
    roomTokenRef.current = roomToken;
  }, [sessionToken, roomToken]);

  useEffect(() => {
    // Periodic heartbeats.
    const sendHeartbeat = async () => {
      const result = await (heartbeat as any)({ roomId, userId, sessionId, interval }) as { roomToken: string; sessionToken: string };
      setRoomToken(result.roomToken);
      setSessionToken(result.sessionToken);
    };

    // Send initial heartbeat
    void sendHeartbeat();
    // Clear any existing interval before setting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(sendHeartbeat, interval);

    // Handle page unload.
    const handleUnload = () => {
      if (sessionTokenRef.current) {
        const blob = new Blob([
          JSON.stringify({
            path: "presence:disconnect",
            args: { sessionToken: sessionTokenRef.current },
          }),
        ], {
          type: "application/json",
        });
        navigator.sendBeacon(`${baseUrl}/api/mutation`, blob);
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    // Handle visibility changes.
    const handleVisibility = async () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (sessionTokenRef.current) {
          await (disconnect as any)({ sessionToken: sessionTokenRef.current });
        }
      } else {
        void sendHeartbeat();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(sendHeartbeat, interval);
      }
    };
    const wrappedHandleVisibility = () => {
      handleVisibility().catch(console.error);
    };
    document.addEventListener("visibilitychange", wrappedHandleVisibility);

    // Cleanup.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", wrappedHandleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      // Don't disconnect on first render in strict mode.
      if (hasMounted.current) {
        if (sessionTokenRef.current) {
          void (disconnect as any)({ sessionToken: sessionTokenRef.current });
        }
      }
    };
  }, [heartbeat, disconnect, roomId, userId, baseUrl, interval, sessionId]);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const state = useQuery(presence.list, roomToken ? { roomToken } : "skip");
  return useMemo(() => {
    if (!state) return [];
    return (state as PresenceState[]).slice().sort((a, b) => {
      if (a.userId === userId) return -1;
      if (b.userId === userId) return 1;
      return 0;
    });
  }, [state, userId]);
}