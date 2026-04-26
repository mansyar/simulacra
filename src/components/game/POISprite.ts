import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gridToScreen } from '../../lib/isometric'

export interface POIData {
  id: string
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

export class POISprite {
  private container: Container
  private rectGraphic: Graphics
  private nameLabel: Text

  constructor(poi: POIData) {
    this.container = new Container()
    const screenPos = gridToScreen(poi.gridX, poi.gridY)
    this.container.position.set(screenPos.x, screenPos.y)

    const color = POI_COLORS[poi.type] || POI_COLORS.default

    this.rectGraphic = new Graphics()
    this.rectGraphic.rect(-12, -12, 24, 24)
    this.rectGraphic.fill(color)
    this.rectGraphic.rotation = Math.PI / 4
    this.container.addChild(this.rectGraphic)

    const labelStyle = new TextStyle({
      fontSize: 12,
      fill: 0xe2e8f0,
      fontWeight: 'bold',
      align: 'center',
    })

    this.nameLabel = new Text({ text: poi.name, style: labelStyle })
    this.nameLabel.anchor.set(0.5, 1)
    this.nameLabel.position.set(0, -20)
    this.container.addChild(this.nameLabel)
  }

  public getContainer(): Container {
    return this.container
  }
}
