import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gridToScreen } from '../../lib/isometric'
import type { Id } from '../../../convex/_generated/dataModel'

export interface POIData {
  _id: Id<'pois'>
  name: string
  gridX: number
  gridY: number
  type: string
}

const POI_COLORS: Record<string, number> = {
  library: 0x4f46e5, // Indigo
  plaza: 0xf59e0b,   // Amber
  cafe: 0x10b981,    // Emerald
  nature: 0x84cc16,  // Lime
  default: 0x64748b  // Slate
}

export class POISprite extends Container {
  private rectGraphic: Graphics
  private nameLabel: Text

  constructor(poi: POIData) {
    super()
    this.label = `poi-${poi.name}`
    
    const offsetX = (64 * 32) / 2
    const offsetY = 50
    const screenPos = gridToScreen(poi.gridX, poi.gridY)
    this.position.set(screenPos.x + offsetX, screenPos.y + offsetY)

    this.rectGraphic = new Graphics()
    this.addChild(this.rectGraphic)

    const color = POI_COLORS[poi.type] || POI_COLORS.default

    this.rectGraphic.rect(-12, -12, 24, 24)
      .fill(color)
      .stroke({ width: 2, color: 0xffffff, alpha: 0.3 })
    this.rectGraphic.rotation = Math.PI / 4

    const labelStyle = new TextStyle({
      fontSize: 12,
      fill: 0xe2e8f0,
      fontWeight: 'bold',
      align: 'center',
      stroke: { color: 0x000000, width: 2 }
    })

    this.nameLabel = new Text({ text: poi.name, style: labelStyle })
    this.nameLabel.anchor.set(0.5, 1)
    this.nameLabel.position.set(0, -20)
    this.addChild(this.nameLabel)
  }
}
