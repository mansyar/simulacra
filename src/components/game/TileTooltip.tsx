import type { ReactNode } from 'react'
import type { AgentData } from './AgentSprite'
import type { POIData } from './POISprite'

interface TileTooltipProps {
  hoveredTile: { gridX: number; gridY: number } | null
  hoveredAgent: AgentData | null
  hoveredPoi: POIData | null
  cursorX: number
  cursorY: number
}

const ARCHETYPE_BADGES: Record<string, string> = {
  builder: '🛠️',
  socialite: '💬',
  philosopher: '📖',
  explorer: '🔍',
  nurturer: '🌱',
}

export function TileTooltip({ hoveredTile, hoveredAgent, hoveredPoi, cursorX, cursorY }: TileTooltipProps) {
  if (!hoveredTile) return null

  let inner: ReactNode

  // Priority 1: POI name
  if (hoveredPoi) {
    inner = hoveredPoi.name
  }
  // Priority 2: Agent name + archetype badge
  else if (hoveredAgent) {
    inner = (
      <>
        <span>{ARCHETYPE_BADGES[hoveredAgent.archetype] ?? '❓'}</span>
        <span>{hoveredAgent.name}</span>
      </>
    )
  }
  // Priority 3: Grid coordinates fallback
  else {
    inner = `(${hoveredTile.gridX}, ${hoveredTile.gridY})`
  }

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: cursorX + 10,
        top: cursorY + 10,
        zIndex: 50,
      }}
    >
      <div
        className={`bg-slate-900/90 backdrop-blur-sm text-[10px] font-mono rounded border border-slate-700/50 px-1.5 py-0.5 whitespace-nowrap ${
          hoveredPoi || hoveredAgent ? 'text-slate-200 flex items-center gap-1' : 'text-slate-400'
        }`}
      >
        {inner}
      </div>
    </div>
  )
}
