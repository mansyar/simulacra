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
  targetX?: number
  targetY?: number
  speech?: string
  lastSpeechAt?: number
  conversationState?: {
    partnerId: Id<'agents'>
    role: 'initiator' | 'responder'
    turnCount: number
    lastPartnerSpeech?: string
    startedAt: number
  }
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
  private selectionRing: Graphics
  private circleGraphic: Graphics
  private nameLabel: Text
  private actionLabel: Text
  private speechContainer: Container
  private speechBg: Graphics
  private speechLabel: Text
  private chatIconContainer: Container
  private chatIcon: Text
  private targetGridX: number
  private targetGridY: number
  private estimatedGridX: number
  private estimatedGridY: number
  private visualX: number = 0
  private visualY: number = 0
  private lerpSpeed: number = 0.1
  private noise: (x: number, y: number) => number
  private time: number = 0
  private blendProgress: number = 1.0
  private blendSourceX: number = 0
  private blendSourceY: number = 0
  private blendTargetX: number = 0
  private blendTargetY: number = 0

  constructor(agent: AgentData) {
    super()
    this.agent = { ...agent }
    this.targetGridX = agent.targetX ?? agent.gridX
    this.targetGridY = agent.targetY ?? agent.gridY
    this.estimatedGridX = agent.gridX
    this.estimatedGridY = agent.gridY
    this.label = `agent-${agent.name}`
    this.noise = createNoise(agent._id)

    this.selectionRing = new Graphics()
    this.selectionRing.visible = false
    this.addChildAt(this.selectionRing, 0)

    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.on('pointertap', () => {
      this.emit('select', this.agent._id)
    })

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

    // Chat icon for active conversations
    this.chatIconContainer = new Container()
    this.chatIconContainer.position.set(0, -24)
    this.chatIconContainer.visible = false
    this.addChild(this.chatIconContainer)

    const chatIconStyle = new TextStyle({
      fontSize: 12,
    })

    this.chatIcon = new Text({ text: '💬', style: chatIconStyle })
    this.chatIcon.anchor.set(0.5, 0.5)
    this.chatIconContainer.addChild(this.chatIcon)

    this.draw()
    this.updatePosition()
  }

  private draw() {
    const color = ARCHETYPE_COLORS[this.agent.archetype] || 0xFFFFFF

    // Draw selection ring
    this.selectionRing.clear()
    this.selectionRing.circle(0, 0, 12)
      .stroke({ width: 3, color: 0x60a5fa, alpha: 1 }) // Blue-400

    this.circleGraphic.clear()
    this.circleGraphic.circle(0, 0, 8)
      .fill(color)
      .stroke({ width: 2, color: 0xffffff, alpha: 0.5 })
  }

  public updateAgentData(data: Partial<AgentData>) {
    Object.assign(this.agent, data)
    this.targetGridX = data.targetX ?? data.gridX ?? this.targetGridX
    this.targetGridY = data.targetY ?? data.gridY ?? this.targetGridY

    // Smooth Course Correction (Phase 3)
    if (data.gridX !== undefined || data.gridY !== undefined) {
      const newTruthX = data.gridX ?? this.agent.gridX
      const newTruthY = data.gridY ?? this.agent.gridY
      
      // If there's a significant difference from our estimate (>0.01 tile)
      if (Math.abs(newTruthX - this.estimatedGridX) > 0.01 || Math.abs(newTruthY - this.estimatedGridY) > 0.01) {
        this.blendSourceX = this.estimatedGridX
        this.blendSourceY = this.estimatedGridY
        this.blendTargetX = newTruthX
        this.blendTargetY = newTruthY
        this.blendProgress = 0
      }
    }

    if (data.currentAction) {
      this.actionLabel.text = ACTION_EMOJIS[data.currentAction] || '❓'
    }
  }

  public setSelected(selected: boolean) {
    this.selectionRing.visible = selected
  }

  public tick(deltaTime: number) {
    // PIXI v8 deltaTime is usually ~1.0 for 60FPS. 
    // Convert to elapsed seconds for time-synced calculations.
    const elapsedSeconds = deltaTime / 60
    this.time += elapsedSeconds * 1 // Slower noise traversal

    // Pulsing Ring Effect
    if (this.selectionRing.visible) {
      const pulse = (Math.sin(this.time * 5) + 1) / 2 // 0 to 1
      this.selectionRing.scale.set(1 + pulse * 0.2)
      this.selectionRing.alpha = 0.5 + pulse * 0.5
    }

    if (this.blendProgress < 1.0) {
      // Smooth Course Correction (Phase 3)
      this.blendProgress += deltaTime / 30 // 30 frames = 500ms at 60fps
      if (this.blendProgress > 1.0) this.blendProgress = 1.0
      
      const t = this.blendProgress
      this.estimatedGridX = this.blendSourceX + (this.blendTargetX - this.blendSourceX) * t
      this.estimatedGridY = this.blendSourceY + (this.blendTargetY - this.blendSourceY) * t
    } else if (this.agent.currentAction === 'walking' || this.agent.currentAction === 'exploring') {
      // Predicted Movement (Interpolated Goal-Seeking)
      const dx = this.targetGridX - this.estimatedGridX
      const dy = this.targetGridY - this.estimatedGridY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0.01) {
        // Time-Synced Velocity: distance / world_tick_interval
        // Default tick interval is 180s. 
        // Backend AGENT_SPEED is 6 units per tick.
        // So speed is 6 / 180 = 0.0333 units/sec.
        const speed = 6 / 180
        const moveStep = speed * elapsedSeconds

        const ratio = Math.min(1, moveStep / distance)
        this.estimatedGridX += dx * ratio
        this.estimatedGridY += dy * ratio
      }
    } else {
      // For non-walking states, keep estimated in sync with backend position (lerped)
      const currentGridX = this.estimatedGridX
      const currentGridY = this.estimatedGridY

      this.estimatedGridX = currentGridX + (this.agent.gridX - currentGridX) * this.lerpSpeed * deltaTime
      this.estimatedGridY = currentGridY + (this.agent.gridY - currentGridY) * this.lerpSpeed * deltaTime
    }

    // Keep agent.gridX/Y somewhat in sync for legacy reasons or updatePosition
    this.agent.gridX = this.estimatedGridX
    this.agent.gridY = this.estimatedGridY

    // Pacing Logic (Micro-Wandering) - Optimization: Only update noise every 2 frames
    if (Math.floor(this.time * 60) % 2 === 0) {
      if (this.agent.currentAction === 'idle' || this.agent.currentAction === 'working') {
        // Small visual offsets based on noise
        this.visualX = this.noise(this.time, 0) * 8
        this.visualY = this.noise(0, this.time) * 4

        // Looking (Flipping)
        const flipNoise = this.noise(this.time * 0.05, 100)
        if (flipNoise > 0.6) this.visualContainer.scale.x = 1
        else if (flipNoise < -0.6) this.visualContainer.scale.x = -1

        // Shifting (Vertical bounce)
        const bounceNoise = this.noise(200, this.time * 0.25)
        this.visualContainer.y = bounceNoise * 2
      } else {
        // Reset offsets when not in wandering states
        this.visualX = 0
        this.visualY = 0
        this.visualContainer.scale.x = 1
        this.visualContainer.y = 0
      }
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

    // Chat icon visibility for active conversations
    const isInConversation = this.agent.conversationState !== undefined;
    this.chatIconContainer.visible = isInConversation;
    
    // Pulse animation for chat icon
    if (isInConversation) {
      const pulse = (Math.sin(this.time * 6) + 1) / 2;
      this.chatIcon.scale.set(0.6 + pulse * 0.1);
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
