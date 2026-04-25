import { Actor, Circle, Rectangle, Color, Vector, Label, TextAlign } from 'excalibur'
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
  private speechBg: Actor
  private bgRect: Rectangle
  private actionLabel: Label
  private targetGridX: number
  private targetGridY: number
  private lerpSpeed: number = 0.1

  constructor(agent: AgentData) {
    super({
      pos: new Vector(0, 0),
      z: 20,
    })
    this.agent = agent
    this.targetGridX = agent.gridX
    this.targetGridY = agent.gridY

    const color = ARCHETYPE_COLORS[agent.archetype] || '#FFFFFF'

    this.circleGraphic = new Circle({
      radius: 8,
      color: Color.fromHex(color),
    })
    this.graphics.add(this.circleGraphic)

    this.nameLabel = new Label({
      text: agent.name,
      pos: new Vector(0, -12), 
      color: Color.White,
    })
    this.nameLabel.font.size = 10
    this.nameLabel.font.textAlign = TextAlign.Center
    this.addChild(this.nameLabel)

    this.actionLabel = new Label({
      text: ACTION_EMOJIS[agent.currentAction || 'idle'] || '❓',
      pos: new Vector(0, 8),
      color: Color.White,
    })
    this.actionLabel.font.size = 12
    this.actionLabel.font.textAlign = TextAlign.Center
    this.addChild(this.actionLabel)

    // Speech Background
    this.speechBg = new Actor({
      pos: new Vector(0, -32),
      z: 29,
    })
    this.bgRect = new Rectangle({
      width: 100,
      height: 20,
      color: Color.fromHex('#0f172a').clone(),
    })
    this.bgRect.opacity = 0.9
    this.speechBg.graphics.add(this.bgRect)
    this.addChild(this.speechBg)

    this.speechLabel = new Label({
      text: '',
      pos: new Vector(0, -32),
      color: Color.fromHex('#f8fafc'),
      maxWidth: 150,
    })
    this.speechLabel.font.size = 10
    this.speechLabel.font.bold = true
    this.speechLabel.font.textAlign = TextAlign.Center
    this.addChild(this.speechLabel)
    
    // Initial state
    this.speechLabel.graphics.visible = false
    this.speechBg.graphics.visible = false
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

  public onPreUpdate() {
    const currentGridX = this.agent.gridX
    const currentGridY = this.agent.gridY
    const newGridX = currentGridX + (this.targetGridX - currentGridX) * this.lerpSpeed
    const newGridY = currentGridY + (this.targetGridY - currentGridY) * this.lerpSpeed
    this.agent.gridX = newGridX
    this.agent.gridY = newGridY
    
    const screenPos = gridToScreen(newGridX, newGridY)
    this.pos = new Vector(screenPos.x, screenPos.y)

    const now = Date.now()
    if (this.agent.speech && this.agent.lastSpeechAt && (now - this.agent.lastSpeechAt < 8000)) {
      this.speechLabel.text = this.agent.speech
      this.speechLabel.graphics.visible = true
      this.speechBg.graphics.visible = true
      
      const estimatedWidth = Math.min(180, Math.max(60, this.agent.speech.length * 7))
      this.bgRect.width = estimatedWidth
    } else {
      this.speechLabel.graphics.visible = false
      this.speechBg.graphics.visible = false
    }
  }
}
