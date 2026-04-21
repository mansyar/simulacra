import { Vector, Color, Debug } from 'excalibur'
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
  private mouseX: number = 0
  private mouseY: number = 0
  private hoveredTile: { x: number; y: number } | null = null

  constructor(options: IsometricGridOptions) {
    this.width = options.width
    this.height = options.height
    this.tileWidth = options.tileWidth
    this.tileHeight = options.tileHeight
    // Ensure mouseX and mouseY are used (they are set via setMousePosition)
    void this.mouseX
    void this.mouseY
  }

  public setMousePosition(screenX: number, screenY: number): void {
    this.mouseX = screenX
    this.mouseY = screenY
    // Convert screen coordinates to grid coordinates
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
        // diamond vertices
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
    // Render 64x64 tile grid
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const screenPos = gridToScreen(x, y)
        const isHovered = !!(this.hoveredTile && this.hoveredTile.x === x && this.hoveredTile.y === y)
        this.drawTile(ctx, screenPos.x, screenPos.y, isHovered)
      }
    }
  }

  private drawTile(ctx: ExcaliburGraphicsContext, screenX: number, screenY: number, isHovered: boolean): void {
    const halfWidth = this.tileWidth / 2
    const halfHeight = this.tileHeight / 2

    // Define diamond vertices
    const top = new Vector(screenX, screenY - halfHeight)
    const right = new Vector(screenX + halfWidth, screenY)
    const bottom = new Vector(screenX, screenY + halfHeight)
    const left = new Vector(screenX - halfWidth, screenY)
    const vertices = [top, right, bottom, left]

    // Fill diamond with tile fill color (Slate-800) or highlight color if hovered
    const fillColor = isHovered ? Color.fromHex('#334155') : Color.fromHex('#1e293b')
    Debug.drawPolygon(vertices, { color: fillColor })

    // Draw lines (grid lines)
    const lineColor = Color.fromHex('#475569')
    const thickness = 1
    ctx.drawLine(top, right, lineColor, thickness)
    ctx.drawLine(right, bottom, lineColor, thickness)
    ctx.drawLine(bottom, left, lineColor, thickness)
    ctx.drawLine(left, top, lineColor, thickness)
  }
}