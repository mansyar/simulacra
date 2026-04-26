import { Container, Graphics, Text, TextStyle } from 'pixi.js'
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

const ARCHETYPE_COLORS: Record<string, number> = {
  builder: 0x3b82f6,
  socialite: 0xec4899,
  philosopher: 0x8b5cf6,
  explorer: 0xf59e0b,
  nurturer: 0x10b981,
}

export class AgentSprite {
  private container: Container
  private agent: AgentData
  private circleGraphic: Graphics
  private nameLabel: Text
  private actionLabel: Text
  private speechContainer: Container
  private speechBg: Graphics
  private speechLabel: Text
  private targetGridX: number
  private targetGridY: number
  private lerpSpeed: number = 0.1

  constructor(agent: AgentData) {
    this.agent = { ...agent }
    this.targetGridX = agent.gridX
    this.targetGridY = agent.gridY

    this.container = new Container()
    
    const color = ARCHETYPE_COLORS[agent.archetype] || 0xFFFFFF

    this.circleGraphic = new Graphics()
    this.circleGraphic.circle(0, 0, 8)
    this.circleGraphic.fill(color)
    this.container.addChild(this.circleGraphic)

    const labelStyle = new TextStyle({
      fontSize: 10,
      fill: 0xffffff,
      align: 'center',
    })

    this.nameLabel = new Text({ text: agent.name, style: labelStyle })
    this.nameLabel.anchor.set(0.5, 1)
    this.nameLabel.position.set(0, -12)
    this.container.addChild(this.nameLabel)

    const emojiStyle = new TextStyle({
      fontSize: 12,
    })

    this.actionLabel = new Text({ 
      text: ACTION_EMOJIS[agent.currentAction || 'idle'] || '❓', 
      style: emojiStyle 
    })
    this.actionLabel.anchor.set(0.5, 0)
    this.actionLabel.position.set(0, 8)
    this.container.addChild(this.actionLabel)

    // Speech
    this.speechContainer = new Container()
    this.speechContainer.position.set(0, -32)
    this.speechContainer.visible = false
    this.container.addChild(this.speechContainer)

    this.speechBg = new Graphics()
    this.speechContainer.addChild(this.speechBg)

    const speechStyle = new TextStyle({
      fontSize: 10,
      fill: 0xf8fafc,
      fontWeight: 'bold',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 150,
    })

    this.speechLabel = new Text({ text: '', style: speechStyle })
    this.speechLabel.anchor.set(0.5, 0.5)
    this.speechContainer.addChild(this.speechLabel)

    this.updatePosition()
  }

  public updateAgentData(data: Partial<AgentData>) {
    Object.assign(this.agent, data)
    this.targetGridX = data.gridX ?? this.targetGridX
    this.targetGridY = data.gridY ?? this.targetGridY
    
    if (data.currentAction) {
      this.actionLabel.text = ACTION_EMOJIS[data.currentAction] || '❓'
    }
  }

  public tick(_elapsed: number) {
    const currentGridX = this.agent.gridX
    const currentGridY = this.agent.gridY
    
    // Smooth lerp for movement
    const newGridX = currentGridX + (this.targetGridX - currentGridX) * this.lerpSpeed
    const newGridY = currentGridY + (this.targetGridY - currentGridY) * this.lerpSpeed
    
    this.agent.gridX = newGridX
    this.agent.gridY = newGridY
    
    this.updatePosition()

    // Speech visibility logic
    const now = Date.now()
    if (this.agent.speech && this.agent.lastSpeechAt && (now - this.agent.lastSpeechAt < 8000)) {
      this.speechLabel.text = this.agent.speech
      this.speechContainer.visible = true
      
      const bounds = this.speechLabel.getBounds()
      const padding = 8
      this.speechBg.clear()
      this.speechBg.roundRect(
        -bounds.width / 2 - padding, 
        -bounds.height / 2 - padding, 
        bounds.width + padding * 2, 
        bounds.height + padding * 2, 
        4
      )
      this.speechBg.fill({ color: 0x0f172a, alpha: 0.9 })
    } else {
      this.speechContainer.visible = false
    }
  }

  private updatePosition() {
    const screenPos = gridToScreen(this.agent.gridX, this.agent.gridY)
    this.container.position.set(screenPos.x, screenPos.y)
  }

  public getContainer(): Container {
    return this.container
  }
}
