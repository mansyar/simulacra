export const TILE_WIDTH = 32
export const TILE_HEIGHT = 16

export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  const screenX = (gridX - gridY) * (TILE_WIDTH / 2)
  const screenY = (gridX + gridY) * (TILE_HEIGHT / 2)
  return { x: screenX, y: screenY }
}

export function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  const dx = screenX / (TILE_WIDTH / 2)
  const dy = screenY / (TILE_HEIGHT / 2)
  const gridX = (dx + dy) / 2
  const gridY = (dy - dx) / 2
  return { x: Math.round(gridX), y: Math.round(gridY) }
}
