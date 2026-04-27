import * as PIXI from 'pixi.js';

export interface AgentData {
  id: string;
  name: string;
  gridX: number;
  gridY: number;
  archetype: 'builder' | 'socialite' | 'philosopher' | 'explorer' | 'nurturer';
}

export interface ConversationLine {
  agentA: AgentData;
  agentB: AgentData;
  graphics: PIXI.Graphics;
  isFadingOut: boolean;
  fadeAlpha: number;
}

export class ConversationLines {
  private conversations: Map<string, ConversationLine> = new Map();
  private graphicsContainer: PIXI.Container;
  private dirty: boolean = true;

  constructor() {
    this.graphicsContainer = new PIXI.Container();
  }

  getContainer(): PIXI.Container {
    return this.graphicsContainer;
  }

  getConversationCount(): number {
    return this.conversations.size;
  }

  addConversation(agentA: AgentData, agentB: AgentData): void {
    const key = this.getConversationKey(agentA.id, agentB.id);
    
    if (this.conversations.has(key)) {
      return; // Already exists
    }

    const graphics = new PIXI.Graphics();
    this.graphicsContainer.addChild(graphics);

    const conversation: ConversationLine = {
      agentA,
      agentB,
      graphics,
      isFadingOut: false,
      fadeAlpha: 1.0,
    };

    this.conversations.set(key, conversation);
    this.dirty = true;
  }

  removeConversation(agentAId: string, agentBId: string): void {
    const key = this.getConversationKey(agentAId, agentBId);
    const conversation = this.conversations.get(key);
    
    if (conversation) {
      conversation.isFadingOut = true;
      this.dirty = true;
    }
  }

  updatePositions(agentA: AgentData, agentB: AgentData): void {
    const key = this.getConversationKey(agentA.id, agentB.id);
    const conversation = this.conversations.get(key);
    
    if (conversation) {
      conversation.agentA = agentA;
      conversation.agentB = agentB;
      this.dirty = true;
    }
  }

  update(deltaTime: number): void {
    if (!this.dirty) {
      return;
    }

    // Clear all graphics
    this.graphicsContainer.removeChildren();

    // Redraw all conversations
    for (const [key, conversation] of this.conversations) {
      if (conversation.isFadingOut) {
        // Fade out animation
        conversation.fadeAlpha -= deltaTime * 0.002; // 500ms fade out
        if (conversation.fadeAlpha <= 0) {
          this.conversations.delete(key);
          continue;
        }
      }

      this.drawConversationLine(conversation);
    }

    this.dirty = false;
  }

  private drawConversationLine(conversation: ConversationLine): void {
    const { agentA, agentB, graphics, fadeAlpha } = conversation;

    // Convert grid coordinates to screen coordinates
    const screenA = this.gridToScreen(agentA.gridX, agentA.gridY);
    const screenB = this.gridToScreen(agentB.gridX, agentB.gridY);

    // Get archetype color
    const color = this.getArchetypeColor(agentA.archetype);

    // Draw dotted line
    graphics.clear();
    graphics.lineStyle(2, color, fadeAlpha);

    const dx = screenB.x - screenA.x;
    const dy = screenB.y - screenA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const segments = Math.max(1, Math.floor(distance / 10));

    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 0.5) / segments;

      const x1 = screenA.x + dx * t1;
      const y1 = screenA.y + dy * t1;
      const x2 = screenA.x + dx * t2;
      const y2 = screenA.y + dy * t2;

      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
    }
  }

  private gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
    // Isometric conversion (same as in AgentSprite)
    const TILE_WIDTH = 32;
    const TILE_HEIGHT = 16;
    const screenX = (gridX - gridY) * (TILE_WIDTH / 2);
    const screenY = (gridX + gridY) * (TILE_HEIGHT / 2);
    return { x: screenX, y: screenY };
  }

  private getArchetypeColor(archetype: string): number {
    const colors: Record<string, number> = {
      builder: 0x8B4513,      // Brown
      socialite: 0xFF69B4,    // Pink
      philosopher: 0x9370DB,  // Purple
      explorer: 0x32CD32,     // Green
      nurturer: 0xFFD700,     // Gold
    };
    return colors[archetype] || 0xFFFFFF;
  }

  private getConversationKey(agentAId: string, agentBId: string): string {
    return agentAId < agentBId ? `${agentAId}-${agentBId}` : `${agentBId}-${agentAId}`;
  }

  clear(): void {
    for (const conversation of this.conversations.values()) {
      this.graphicsContainer.removeChild(conversation.graphics);
    }
    this.conversations.clear();
    this.dirty = true;
  }
}
