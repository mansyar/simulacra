import { Actor, Circle, Color, Vector, Label, Engine } from 'excalibur'
import { gridToScreen } from '../../lib/isometric'

export interface AgentData {
  id: string
  name: string
  gridX: number
  gridY: number
  archetype: string
}

const ARCHETYPE_COLORS: Record<string, string> = {
  builder: '#8B4513',
  socialite: '#FF69B4',
  philosopher: '#9370DB',
  explorer: '#228B22',
  nurturer: '#FFA07A',
}

export class AgentSprite extends Actor {
  private agent: AgentData
  private circleGraphic: Circle
  private nameLabel: Label
  private targetGridX: number
  private targetGridY: number
  private lerpSpeed: number = 0.1 // adjust as needed

  constructor(agent: AgentData) {
    super({
      pos: new Vector(0, 0),
    })
    this.agent = agent
    this.targetGridX = agent.gridX
    this.targetGridY = agent.gridY

    const color = ARCHETYPE_COLORS[agent.archetype] || '#FFFFFF'

    // Create a circle graphic (16x16 pixels)
    this.circleGraphic = new Circle({
      radius: 8,
      color: Color.fromHex(color),
    })
    this.graphics.add(this.circleGraphic)

    // Create a name label floating above
    this.nameLabel = new Label({
      text: agent.name,
      pos: new Vector(0, -12), // above the circle
      color: Color.White,
    })
    this.nameLabel.font.size = 10 // small font
    this.addChild(this.nameLabel)
  }

  public updateGridPosition(gridX: number, gridY: number) {
    this.targetGridX = gridX
    this.targetGridY = gridY
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onPreUpdate(_engine: Engine, _elapsed: number) {
    // Smoothly interpolate grid position towards target
    const currentGridX = this.agent.gridX
    const currentGridY = this.agent.gridY
    const newGridX = currentGridX + (this.targetGridX - currentGridX) * this.lerpSpeed
    const newGridY = currentGridY + (this.targetGridY - currentGridY) * this.lerpSpeed
    this.agent.gridX = newGridX
    this.agent.gridY = newGridY
    // Update screen position
    const screenPos = gridToScreen(newGridX, newGridY)
    this.pos = new Vector(screenPos.x, screenPos.y)
  }
}