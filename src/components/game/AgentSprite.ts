import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { gridToScreen } from '../../lib/isometric'
import { createNoise } from '../../lib/noise'
import type { Id } from '../../../convex/_generated/dataModel'

export interface AgentData {
  _id: Id<'agents'>
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

export class AgentSprite extends Container {
  private agent: AgentData
  private visualContainer: Container
  private circleGraphic: Graphics
  private nameLabel: Text
  private actionLabel: Text
  private speechContainer: Container
  private speechBg: Graphics
  private speechLabel: Text
  private targetGridX: number
  private targetGridY: number
  private estimatedGridX: number
  private estimatedGridY: number
  private visualX: number = 0
  private visualY: number = 0
  private lerpSpeed: number = 0.1
  private noise: (x: number, y: number) => number
  private time: number = 0

  constructor(agent: AgentData) {
    super()
    this.agent = { ...agent }
    this.targetGridX = agent.gridX
    this.targetGridY = agent.gridY
    this.estimatedGridX = agent.gridX
    this.estimatedGridY = agent.gridY
    this.label = `agent-${agent.name}`
    this.noise = createNoise(agent._id)

    this.visualContainer = new Container()
    this.addChild(this.visualContainer)

    this.circleGraphic = new Graphics()
    this.visualContainer.addChild(this.circleGraphic)

    const labelStyle = new TextStyle({
      fontSize: 10,
      fill: 0xffffff,
      align: 'center',
      fontWeight: 'bold',
      stroke: { color: 0x000000, width: 2 }
    })

    this.nameLabel = new Text({ text: agent.name, style: labelStyle })
    this.nameLabel.anchor.set(0.5, 1)
    this.nameLabel.position.set(0, -12)
    this.addChild(this.nameLabel)

    const emojiStyle = new TextStyle({
      fontSize: 12,
    })

    this.actionLabel = new Text({
      text: ACTION_EMOJIS[agent.currentAction || 'idle'] || '❓',
      style: emojiStyle
    })
    this.actionLabel.anchor.set(0.5, 0)
    this.actionLabel.position.set(0, 8)
    this.visualContainer.addChild(this.actionLabel)
    // Speech
    this.speechContainer = new Container()
    this.speechContainer.position.set(0, -32)
    this.speechContainer.visible = false
    this.addChild(this.speechContainer)

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

    this.draw()
    this.updatePosition()
  }

  private draw() {
    const color = ARCHETYPE_COLORS[this.agent.archetype] || 0xFFFFFF
    this.circleGraphic.clear()
    this.circleGraphic.circle(0, 0, 8)
      .fill(color)
      .stroke({ width: 2, color: 0xffffff, alpha: 0.5 })
  }

  public updateAgentData(data: Partial<AgentData>) {
    Object.assign(this.agent, data)
    this.targetGridX = data.gridX ?? this.targetGridX
    this.targetGridY = data.gridY ?? this.targetGridY
    
    this.estimatedGridX = data.gridX ?? this.estimatedGridX
    this.estimatedGridY = data.gridY ?? this.estimatedGridY

    if (data.currentAction) {
      this.actionLabel.text = ACTION_EMOJIS[data.currentAction] || '❓'
    }
  }

  public tick(deltaTime: number) {
    // We use deltaTime to maintain consistent speed regardless of frame rate
    const speedFactor = deltaTime
    this.time += deltaTime * 0.05 // Noise speed
    
    const currentGridX = this.agent.gridX
    const currentGridY = this.agent.gridY
    
    const newGridX = currentGridX + (this.targetGridX - currentGridX) * this.lerpSpeed * speedFactor
    const newGridY = currentGridY + (this.targetGridY - currentGridY) * this.lerpSpeed * speedFactor
    
    this.agent.gridX = newGridX
    this.agent.gridY = newGridY
    
    this.estimatedGridX = newGridX
    this.estimatedGridY = newGridY

    // Pacing Logic (Micro-Wandering)
    if (this.agent.currentAction === 'idle' || this.agent.currentAction === 'working') {
      // Small visual offsets based on noise
      this.visualX = this.noise(this.time, 0) * 8
      this.visualY = this.noise(0, this.time) * 4

      // Looking (Flipping)
      const flipNoise = this.noise(this.time * 0.1, 100)
      if (flipNoise > 0.6) this.visualContainer.scale.x = 1
      else if (flipNoise < -0.6) this.visualContainer.scale.x = -1

      // Shifting (Vertical bounce)
      const bounceNoise = this.noise(200, this.time * 0.5)
      this.visualContainer.y = bounceNoise * 2
    } else {
      // Reset offsets when not in wandering states
      // Note: Phase 3 will handle interpolated movement
      this.visualX = 0
      this.visualY = 0
      this.visualContainer.scale.x = 1
      this.visualContainer.y = 0
    }
    
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
    const offsetX = (64 * 32) / 2
    const offsetY = 50
    const screenPos = gridToScreen(this.estimatedGridX, this.estimatedGridY)
    this.position.set(
      screenPos.x + offsetX + this.visualX, 
      screenPos.y + offsetY + this.visualY
    )
  }
}
