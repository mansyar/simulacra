import { Container } from 'pixi.js'

export interface CameraBounds {
  left: number
  right: number
  top: number
  bottom: number
}

export class CameraController {
  private stage: Container
  private bounds: CameraBounds
  private targetZoom: number = 1
  private minZoom: number = 0.5
  private maxZoom: number = 2
  private targetX: number | null = null
  private targetY: number | null = null
  private lerpSpeed: number

  constructor(stage: Container, bounds?: CameraBounds, lerpSpeed: number = 0.1) {
    this.lerpSpeed = lerpSpeed
    this.stage = stage
    this.bounds = bounds ?? { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity }
    this.targetZoom = stage.scale.x
  }

  public handlePan(x: number, y: number): void {
    // Manual pan cancels auto-panning
    this.targetX = null
    this.targetY = null

    // Clamp position to bounds
    const clampedX = Math.max(this.bounds.left, Math.min(this.bounds.right, x))
    const clampedY = Math.max(this.bounds.top, Math.min(this.bounds.bottom, y))

    this.stage.position.set(Math.round(clampedX), Math.round(clampedY))
  }

  public handleZoom(deltaY: number, mouseX: number, mouseY: number): void {
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom * zoomFactor))

    if (newZoom !== this.targetZoom) {
      // Zoom relative to mouse position
      const worldPos = {
        x: (mouseX - this.stage.position.x) / this.targetZoom,
        y: (mouseY - this.stage.position.y) / this.targetZoom
      }

      this.targetZoom = newZoom
      this.stage.scale.set(newZoom)

      const newScreenPos = {
        x: mouseX - worldPos.x * newZoom,
        y: mouseY - worldPos.y * newZoom
      }

      this.handlePan(newScreenPos.x, newScreenPos.y)
    }
  }

  public lookAt(worldX: number, worldY: number, viewportWidth: number, viewportHeight: number): void {
    // targetX/Y are in screen coordinates (stage.position)
    // To center worldX, worldY:
    // stage.position.x = viewportWidth / 2 - worldX * stage.scale.x
    this.targetX = viewportWidth / 2 - worldX * this.stage.scale.x
    this.targetY = viewportHeight / 2 - worldY * this.stage.scale.y
  }

  public tick(deltaTime: number): void {
    if (this.targetX !== null && this.targetY !== null) {
      const dx = this.targetX - this.stage.position.x
      const dy = this.targetY - this.stage.position.y
      
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        this.stage.position.set(this.targetX, this.targetY)
        this.targetX = null
        this.targetY = null
      } else {
        const nextX = this.stage.position.x + dx * this.lerpSpeed * deltaTime
        const nextY = this.stage.position.y + dy * this.lerpSpeed * deltaTime
        
        // Use a variant of handlePan that doesn't clear targets
        const clampedX = Math.max(this.bounds.left, Math.min(this.bounds.right, nextX))
        const clampedY = Math.max(this.bounds.top, Math.min(this.bounds.bottom, nextY))
        this.stage.position.set(clampedX, clampedY)
      }
    }
  }

  public setZoom(zoom: number): void {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom))
    this.stage.scale.set(this.targetZoom)
  }

  public getZoom(): number {
    return this.targetZoom
  }

  public getScale(): number {
    return this.stage.scale.x
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.stage.position.x, y: this.stage.position.y }
  }
}
