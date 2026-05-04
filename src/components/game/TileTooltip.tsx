import type { AgentData } from './AgentSprite'
import type { POIData } from './POISprite'

interface TileTooltipProps {
  hoveredTile: { gridX: number; gridY: number } | null
  hoveredAgent: AgentData | null
  hoveredPoi: POIData | null
  cursorX: number
  cursorY: number
}

const ARHCETYPE_BADGES: Record<string, string> = {
  builder: '🛠️',
  socialite: '💬',
  philosopher: '📖',
  explorer: '🔍',
  nurturer: '🌱',
}

export function TileTooltip({ hoveredTile, hoveredAgent, hoveredPoi, cursorX, cursorY }: TileTooltipProps) {
  if (!hoveredTile) return null

  // Priority 1: POI name
  if (hoveredPoi) {
    return (
      <div
        className="fixed pointer-events-none"
        style={{
          left: cursorX + 10,
          top: cursorY + 10,
          zIndex: 50,
        }}
      >
        <div className="bg-slate-900/90 backdrop-blur-sm text-[10px] font-mono text-slate-200 rounded border border-slate-700/50 px-1.5 py-0.5 whitespace-nowrap">
          {hoveredPoi.name}
        </div>
      </div>
    )
  }

  // Priority 2: Agent name + archetype badge
  if (hoveredAgent) {
    return (
      <div
        className="fixed pointer-events-none"
        style={{
          left: cursorX + 10,
          top: cursorY + 10,
          zIndex: 50,
        }}
      >
        <div className="bg-slate-900/90 backdrop-blur-sm text-[10px] font-mono text-slate-200 rounded border border-slate-700/50 px-1.5 py-0.5 whitespace-nowrap flex items-center gap-1">
          <span>{ARHCETYPE_BADGES[hoveredAgent.archetype] ?? '❓'}</span>
          <span>{hoveredAgent.name}</span>
        </div>
      </div>
    )
  }

  // Priority 3: Grid coordinates fallback
  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: cursorX + 10,
        top: cursorY + 10,
        zIndex: 50,
      }}
    >
      <div className="bg-slate-900/90 backdrop-blur-sm text-[10px] font-mono text-slate-400 rounded border border-slate-700/50 px-1.5 py-0.5 whitespace-nowrap">
        ({hoveredTile.gridX}, {hoveredTile.gridY})
      </div>
    </div>
  )
}
