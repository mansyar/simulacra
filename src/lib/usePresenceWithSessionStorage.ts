"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import type { PresenceState } from "@convex-dev/presence/react";
import type { FunctionReference } from "convex/server";

/**
 * Wraps a function to single-flight invocations, using the latest args.
 * (Copied from @convex-dev/presence internal utility)
 */
function useSingleFlight<Args extends unknown[], Return>(
  fn: (...args: Args) => Promise<Return>
): (...args: Args) => Promise<Return> {
  type FlightState = { 
    fn: (...args: Args) => Promise<Return>; 
    resolve: (value: Return | PromiseLike<Return>) => void; 
    reject: (reason?: unknown) => void; 
    args: Args 
  };
  const flightStatus = useRef({
    inFlight: false,
    upNext: null as FlightState | null,
  });
  return useCallback((...args: Args): Promise<Return> => {
    if (flightStatus.current.inFlight) {
      const promise = new Promise<Return>((resolve, reject) => {
        flightStatus.current.upNext = { fn, resolve, reject, args };
      });
      return promise;
    }
    flightStatus.current.inFlight = true;
    const firstReq = fn(...args);
    void (async () => {
      try {
        await firstReq;
      } finally {
        // If it failed, we naively just move on to the next request.
      }
      while (flightStatus.current.upNext) {
        const cur = flightStatus.current.upNext;
        flightStatus.current.upNext = null;
        await cur.fn(...cur.args)
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
export interface PresenceModule {
  heartbeat: FunctionReference<"mutation">;
  disconnect: FunctionReference<"mutation">;
  list: FunctionReference<"query">;
}

export default function usePresenceWithSessionStorage(
  presence: PresenceModule,
  roomId: string,
  userId: string,
  interval: number = 10000,
  convexUrl?: string
): PresenceState[] | undefined {
  const hasMounted = useRef(false);
  
  // Safely access the base URL from the Convex client if not provided
  const baseUrl = useMemo(() => {
    if (convexUrl) return convexUrl;
    // Prefer env var over internal property to avoid 'any' cast
    return (import.meta.env.VITE_CONVEX_URL as string) ?? "";
  }, [convexUrl]);

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
      void disconnect({ sessionToken: sessionTokenRef.current });
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
      const result = await heartbeat({ roomId, userId, sessionId, interval }) as { roomToken: string; sessionToken: string };
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
          await disconnect({ sessionToken: sessionTokenRef.current });
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
          void disconnect({ sessionToken: sessionTokenRef.current });
        }
      }
    };
  }, [heartbeat, disconnect, roomId, userId, baseUrl, interval, sessionId]);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const state = useQuery(presence.list, roomToken ? { roomToken } : "skip") as PresenceState[] | undefined;
  return useMemo(() => {
    if (!state) return [];
    return state.slice().sort((a: PresenceState, b: PresenceState) => {
      if (a.userId === userId) return -1;
      if (b.userId === userId) return 1;
      return 0;
    });
  }, [state, userId]);
}