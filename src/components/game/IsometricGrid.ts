import { Container, Graphics } from 'pixi.js'
import { gridToScreen, screenToGrid } from '../../lib/isometric'

export interface IsometricGridOptions {
  width: number
  height: number
  tileWidth: number
  tileHeight: number
}

export interface Viewport {
  left: number
  top: number
  right: number
  bottom: number
}

export class IsometricGrid {
  private width: number
  private height: number
  private tileWidth: number
  private tileHeight: number
  private container: Container
  private gridGraphics: Graphics
  private highlightGraphics: Graphics
  private hoveredTile: { x: number; y: number } | null = null

  constructor(options: IsometricGridOptions) {
    this.width = options.width
    this.height = options.height
    this.tileWidth = options.tileWidth
    this.tileHeight = options.tileHeight

    this.container = new Container()
    this.gridGraphics = new Graphics()
    this.highlightGraphics = new Graphics()

    this.container.addChild(this.gridGraphics)
    this.container.addChild(this.highlightGraphics)

    this.drawGrid()
  }

  private drawGrid(): void {
    const g = this.gridGraphics
    g.clear()
    // Slate-600
    g.setStrokeStyle({ color: 0x475569, width: 1 })

    const offsetX = (this.width * this.tileWidth) / 2
    const offsetY = 50 // Padding from top

    // Create vertical lines (x direction)
    for (let x = 0; x <= this.width; x++) {
      const start = gridToScreen(x, 0)
      const end = gridToScreen(x, this.height)
      g.moveTo(start.x + offsetX, start.y + offsetY)
      g.lineTo(end.x + offsetX, end.y + offsetY)
    }

    // Create horizontal lines (y direction)
    for (let y = 0; y <= this.height; y++) {
      const start = gridToScreen(0, y)
      const end = gridToScreen(this.width, y)
      g.moveTo(start.x + offsetX, start.y + offsetY)
      g.lineTo(end.x + offsetX, end.y + offsetY)
    }
    
    g.stroke()
  }

  public updateHover(screenX: number, screenY: number): void {
    const offsetX = (this.width * this.tileWidth) / 2
    const offsetY = 50

    // Adjust screen coordinates for grid offset
    const gridPos = screenToGrid(screenX - offsetX, screenY - offsetY)
    
    // Check bounds
    if (gridPos.x >= 0 && gridPos.x < this.width && gridPos.y >= 0 && gridPos.y < this.height) {
      if (!this.hoveredTile || this.hoveredTile.x !== gridPos.x || this.hoveredTile.y !== gridPos.y) {
        this.hoveredTile = { x: gridPos.x, y: gridPos.y }
        this.drawHighlight()
      }
    } else {
      if (this.hoveredTile !== null) {
        this.hoveredTile = null
        this.highlightGraphics.clear()
      }
    }
  }

  private drawHighlight(): void {
    if (!this.hoveredTile) return

    const g = this.highlightGraphics
    g.clear()
    
    const offsetX = (this.width * this.tileWidth) / 2
    const offsetY = 50

    const screenPos = gridToScreen(this.hoveredTile.x, this.hoveredTile.y)
    const halfWidth = this.tileWidth / 2
    const halfHeight = this.tileHeight / 2

    const points = [
      screenPos.x + offsetX, screenPos.y + offsetY - halfHeight,
      screenPos.x + offsetX + halfWidth, screenPos.y + offsetY,
      screenPos.x + offsetX, screenPos.y + offsetY + halfHeight,
      screenPos.x + offsetX - halfWidth, screenPos.y + offsetY,
    ]

    // Slate-700
    g.setStrokeStyle({ color: 0x334155, width: 2 })
    g.poly(points, true)
    g.stroke()
  }

  /**
   * Culls the grid graphics based on the current viewport.
   * For simplicity in this initial migration, we cull the entire grid graphics object.
   * Future optimization: Split grid into chunks and cull chunks.
   */
  public cull(viewport: Viewport): void {
    const bounds = this.getGridBounds()
    
    const isVisible = !(
      bounds.right < viewport.left ||
      bounds.left > viewport.right ||
      bounds.bottom < viewport.top ||
      bounds.top > viewport.bottom
    )

    this.gridGraphics.visible = isVisible
  }

  private getGridBounds(): Viewport {
    const offsetX = (this.width * this.tileWidth) / 2
    const offsetY = 50

    // The isometric grid's extreme points
    const top = gridToScreen(0, 0)
    const right = gridToScreen(this.width, 0)
    const bottom = gridToScreen(this.width, this.height)
    const left = gridToScreen(0, this.height)

    return {
      top: top.y + offsetY - this.tileHeight / 2,
      bottom: bottom.y + offsetY + this.tileHeight / 2,
      left: left.x + offsetX - this.tileWidth / 2,
      right: right.x + offsetX + this.tileWidth / 2,
    }
  }

  public getContainer(): Container {
    return this.container
  }
}
