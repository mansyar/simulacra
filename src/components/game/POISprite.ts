import { Actor, Rectangle, Color, Vector, Label } from 'excalibur'
import { gridToScreen } from '../../lib/isometric'

export interface POIData {
  id: string
  name: string
  gridX: number
  gridY: number
  type: string
}

const POI_COLORS: Record<string, string> = {
  library: '#4f46e5', // Indigo
  plaza: '#f59e0b',   // Amber
  cafe: '#10b981',    // Emerald
  nature: '#84cc16',  // Lime
  default: '#64748b'  // Slate
}

export class POISprite extends Actor {
  private rectGraphic: Rectangle
  private nameLabel: Label

  constructor(poi: POIData) {
    const screenPos = gridToScreen(poi.gridX, poi.gridY)
    super({
      pos: new Vector(screenPos.x, screenPos.y),
      width: 32,
      height: 32,
      z: 10,
    })

    const color = POI_COLORS[poi.type] || POI_COLORS.default

    // Create a square/rect graphic (isometric-ish representation)
    this.rectGraphic = new Rectangle({
      width: 24,
      height: 24,
      color: Color.fromHex(color),
    })
    // Rotate 45 degrees for that isometric look
    this.rectGraphic.rotation = Math.PI / 4
    this.graphics.add(this.rectGraphic)

    // Create a name label floating above
    this.nameLabel = new Label({
      text: poi.name,
      pos: new Vector(0, -20), 
      color: Color.fromHex('#e2e8f0'),
    })
    this.nameLabel.font.size = 12
    this.nameLabel.font.bold = true
    this.addChild(this.nameLabel)
  }
}
