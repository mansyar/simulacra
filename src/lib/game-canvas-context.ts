import { createContext, useContext } from "react";
import type { CameraController } from "../components/game/Camera";
import type { AgentSprite } from "../components/game/AgentSprite";
import type { Id } from "../../convex/_generated/dataModel";

export interface GameCanvasContextValue {
  cameraRef: React.MutableRefObject<CameraController | null>;
  agentsRef: React.MutableRefObject<Map<Id<"agents">, AgentSprite>>;
  resetCamera: () => void;
}

export const GameCanvasContext = createContext<GameCanvasContextValue | null>(null);

export function useGameCanvas(): GameCanvasContextValue {
  const ctx = useContext(GameCanvasContext);
  if (!ctx) {
    // Return a fallback for tests and cases where no provider exists
    return {
      cameraRef: { current: null },
      agentsRef: { current: new Map() },
      resetCamera: () => {},
    };
  }
  return ctx;
}
