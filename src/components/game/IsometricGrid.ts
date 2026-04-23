import { Vector, Color } from 'excalibur'
import type { ExcaliburGraphicsContext } from 'excalibur'
import { gridToScreen, screenToGrid } from '../../lib/isometric'

export interface IsometricGridOptions {
  width: number
  height: number
  tileWidth: number
  tileHeight: number
}

export class IsometricGrid {
  private width: number
  private height: number
  private tileWidth: number
  private tileHeight: number
  private hoveredTile: { x: number; y: number } | null = null
  private gridLines: Array<{ start: Vector; end: Vector; color: Color; thickness: number }> = []

  constructor(options: IsometricGridOptions) {
    this.width = options.width
    this.height = options.height
    this.tileWidth = options.tileWidth
    this.tileHeight = options.tileHeight
    this.createGridLines()
  }

  private createGridLines(): void {
    const lineColor = Color.fromHex('#475569')

    // Create vertical lines (x direction)
    for (let x = 0; x <= this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const start = gridToScreen(x, y)
        const end = gridToScreen(x, y + 1)
        this.gridLines.push({
          start: new Vector(Math.round(start.x), Math.round(start.y)),
          end: new Vector(Math.round(end.x), Math.round(end.y)),
          color: lineColor,
          thickness: 1,
        })
      }
    }

    // Create horizontal lines (y direction)
    for (let y = 0; y <= this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const start = gridToScreen(x, y)
        const end = gridToScreen(x + 1, y)
        this.gridLines.push({
          start: new Vector(Math.round(start.x), Math.round(start.y)),
          end: new Vector(Math.round(end.x), Math.round(end.y)),
          color: lineColor,
          thickness: 1,
        })
      }
    }
  }

  public setMousePosition(screenX: number, screenY: number): void {
    const gridPos = screenToGrid(screenX, screenY)
    if (gridPos.x >= 0 && gridPos.x < this.width && gridPos.y >= 0 && gridPos.y < this.height) {
      this.hoveredTile = { x: gridPos.x, y: gridPos.y }
    } else {
      this.hoveredTile = null
    }
  }

  public getBoundingBox(): { left: number; right: number; top: number; bottom: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const screenPos = gridToScreen(x, y)
        const halfWidth = this.tileWidth / 2
        const halfHeight = this.tileHeight / 2
        const vertices = [
          { x: screenPos.x, y: screenPos.y - halfHeight },
          { x: screenPos.x + halfWidth, y: screenPos.y },
          { x: screenPos.x, y: screenPos.y + halfHeight },
          { x: screenPos.x - halfWidth, y: screenPos.y },
        ]
        vertices.forEach(v => {
          if (v.x < minX) minX = v.x
          if (v.x > maxX) maxX = v.x
          if (v.y < minY) minY = v.y
          if (v.y > maxY) maxY = v.y
        })
      }
    }
    return { left: minX, right: maxX, top: minY, bottom: maxY }
  }

  public render(ctx: ExcaliburGraphicsContext): void {
    // Draw static grid lines (pre-calculated)
    for (const line of this.gridLines) {
      ctx.drawLine(line.start, line.end, line.color, line.thickness)
    }

    // Draw hover highlight (only this changes)
    if (this.hoveredTile) {
      const screenPos = gridToScreen(this.hoveredTile.x, this.hoveredTile.y)
      const halfWidth = this.tileWidth / 2
      const halfHeight = this.tileHeight / 2

      const top = new Vector(Math.round(screenPos.x), Math.round(screenPos.y - halfHeight))
      const right = new Vector(Math.round(screenPos.x + halfWidth), Math.round(screenPos.y))
      const bottom = new Vector(Math.round(screenPos.x), Math.round(screenPos.y + halfHeight))
      const left = new Vector(Math.round(screenPos.x - halfWidth), Math.round(screenPos.y))

      const highlightColor = Color.fromHex('#334155')
      const thickness = 2
      ctx.drawLine(top, right, highlightColor, thickness)
      ctx.drawLine(right, bottom, highlightColor, thickness)
      ctx.drawLine(bottom, left, highlightColor, thickness)
      ctx.drawLine(left, top, highlightColor, thickness)
    }
  }
}
