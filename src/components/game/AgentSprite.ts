import { Actor, Circle, Color, Vector, Label, Engine } from 'excalibur'
import { gridToScreen } from '../../lib/isometric'

export interface AgentData {
  id: string
  name: string
  gridX: number
  gridY: number
  archetype: string
  currentAction?: string
  speech?: string
  lastSpeechAt?: number
}

const ACTION_EMOJIS: Record<string, string> = {
  idle: '😴',
  walking: '🚶',
  eating: '🍱',
  sleeping: '💤',
  talking: '💬',
  listening: '👂',
  working: '🛠️',
  exploring: '🔍',
}

const ARCHETYPE_COLORS: Record<string, string> = {
  builder: '#3b82f6',
  socialite: '#ec4899',
  philosopher: '#8b5cf6',
  explorer: '#f59e0b',
  nurturer: '#10b981',
}

export class AgentSprite extends Actor {
  private agent: AgentData
  private circleGraphic: Circle
  private nameLabel: Label
  private speechLabel: Label
  private actionLabel: Label
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
      pos: new Vector(0, -12), 
      color: Color.White,
    })
    this.nameLabel.font.size = 10
    this.addChild(this.nameLabel)

    // Create an action emoji label
    this.actionLabel = new Label({
      text: ACTION_EMOJIS[agent.currentAction || 'idle'] || '❓',
      pos: new Vector(0, 8),
      color: Color.White,
    })
    this.actionLabel.font.size = 12
    this.addChild(this.actionLabel)

    // Create a speech bubble label
    this.speechLabel = new Label({
      text: '',
      pos: new Vector(0, -30),
      color: Color.fromHex('#f1f5f9'),
      maxWidth: 120,
    })
    this.speechLabel.font.size = 11
    this.speechLabel.font.bold = true
    this.addChild(this.speechLabel)
  }

  public updateAgentData(data: Partial<AgentData>) {
    Object.assign(this.agent, data)
    this.targetGridX = data.gridX ?? this.targetGridX
    this.targetGridY = data.gridY ?? this.targetGridY
    
    if (data.currentAction) {
      this.actionLabel.text = ACTION_EMOJIS[data.currentAction] || '❓'
    }
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

    // Update speech visibility
    const now = Date.now()
    if (this.agent.speech && this.agent.lastSpeechAt && (now - this.agent.lastSpeechAt < 8000)) {
      this.speechLabel.text = `"${this.agent.speech}"`
      this.speechLabel.graphics.visible = true
    } else {
      this.speechLabel.graphics.visible = false
    }
  }
}