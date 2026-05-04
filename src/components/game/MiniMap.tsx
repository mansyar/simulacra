import { useEffect, useRef, useCallback } from 'react'
import type { AgentData } from './AgentSprite'
import { ARCHETYPE_COLORS } from './AgentSprite'
import type { POIData } from './POISprite'
import { screenToGrid, gridToScreen } from '../../lib/isometric'
import type { CameraController } from './Camera'

const MINIMAP_SIZE = 120
const PADDING = 8
const USABLE_SIZE = MINIMAP_SIZE - PADDING * 2 // 104px
const GRID_SIZE = 64
const SCALE_FACTOR = USABLE_SIZE / (GRID_SIZE - 1) // Map grid 0-63 to canvas pixels

// Offset constants matching GameCanvas
const OFFSET_X = 1024
const OFFSET_Y = 50

const POI_MARKER_COLORS: Record<string, string> = {
  library: '#4f46e5',
  plaza: '#f59e0b',
  cafe: '#10b981',
  nature: '#84cc16',
  default: '#64748b',
}

type CameraState = {
  positionX: number
  positionY: number
  scaleX: number
  viewportWidth: number
  viewportHeight: number
}

function gridToMinimap(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: PADDING + gridX * SCALE_FACTOR,
    y: PADDING + gridY * SCALE_FACTOR,
  }
}

function minimapToGrid(px: number, py: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.round((px - PADDING) / SCALE_FACTOR),
    gridY: Math.round((py - PADDING) / SCALE_FACTOR),
  }
}

function computeViewportBounds(state: CameraState): {
  minGridX: number
  minGridY: number
  maxGridX: number
  maxGridY: number
} {
  const corners = [
    { sx: 0, sy: 0 },
    { sx: state.viewportWidth, sy: 0 },
    { sx: 0, sy: state.viewportHeight },
    { sx: state.viewportWidth, sy: state.viewportHeight },
  ]

  let minGridX = Infinity
  let minGridY = Infinity
  let maxGridX = -Infinity
  let maxGridY = -Infinity

  for (const { sx, sy } of corners) {
    // Convert screen coords to world pixel coords
    const worldX = (sx - state.positionX) / state.scaleX
    const worldY = (sy - state.positionY) / state.scaleX

    // Remove offset to get grid-relative coords
    const unoffsetX = worldX - OFFSET_X
    const unoffsetY = worldY - OFFSET_Y

    // Convert to grid coords
    const { x: gridX, y: gridY } = screenToGrid(unoffsetX, unoffsetY)

    minGridX = Math.min(minGridX, gridX)
    minGridY = Math.min(minGridY, gridY)
    maxGridX = Math.max(maxGridX, gridX)
    maxGridY = Math.max(maxGridY, gridY)
  }

  // Clamp to grid bounds
  return {
    minGridX: Math.max(0, Math.floor(minGridX)),
    minGridY: Math.max(0, Math.floor(minGridY)),
    maxGridX: Math.min(GRID_SIZE - 1, Math.ceil(maxGridX)),
    maxGridY: Math.min(GRID_SIZE - 1, Math.ceil(maxGridY)),
  }
}

interface MiniMapProps {
  agentsData: AgentData[]
  poisData: POIData[]
  cameraStateRef: React.MutableRefObject<CameraState>
  cameraRef: React.MutableRefObject<CameraController | null>
}

export function MiniMap({ agentsData, poisData, cameraStateRef, cameraRef }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = cameraStateRef.current

    // Clear canvas
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)

    // Draw dark background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE)

    // Draw viewport rectangle
    const bounds = computeViewportBounds(state)
    const topLeft = gridToMinimap(bounds.minGridX, bounds.minGridY)
    const bottomRight = gridToMinimap(bounds.maxGridX, bounds.maxGridY)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1
    ctx.fillRect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y
    )
    ctx.strokeRect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y
    )

    // Draw POI markers (4x4 colored squares)
    for (const poi of poisData) {
      const pos = gridToMinimap(poi.gridX, poi.gridY)
      ctx.fillStyle = POI_MARKER_COLORS[poi.type] ?? POI_MARKER_COLORS.default
      ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4)
    }

    // Draw agent dots (3px radius circles)
    for (const agent of agentsData) {
      const pos = gridToMinimap(agent.gridX, agent.gridY)
      const hexColor = ARCHETYPE_COLORS[agent.archetype] ?? 0x64748b
      ctx.fillStyle = `#${hexColor.toString(16).padStart(6, '0')}`
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [agentsData, poisData, cameraStateRef])

  // RAF redraw loop
  useEffect(() => {
    let isActive = true

    const loop = () => {
      if (!isActive) return
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      isActive = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  // Handle click-to-jump
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas || !cameraRef.current) return

      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      const { gridX, gridY } = minimapToGrid(clickX, clickY)

      // Clamp to grid bounds
      const clampedX = Math.max(0, Math.min(GRID_SIZE - 1, gridX))
      const clampedY = Math.max(0, Math.min(GRID_SIZE - 1, gridY))

      // Convert to world pixel coords (with offset)
      const { x: worldX, y: worldY } = gridToScreen(clampedX, clampedY)
      const state = cameraStateRef.current

      cameraRef.current.lookAt(
        worldX + OFFSET_X,
        worldY + OFFSET_Y,
        state.viewportWidth,
        state.viewportHeight
      )
    },
    [cameraRef, cameraStateRef]
  )

  return (
    <canvas
      ref={canvasRef}
      width={MINIMAP_SIZE}
      height={MINIMAP_SIZE}
      onClick={handleClick}
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        borderRadius: 8,
        border: '1px solid rgba(148, 163, 184, 0.3)',
        cursor: 'crosshair',
        zIndex: 10,
      }}
    />
  )
}
