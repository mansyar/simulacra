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

  constructor(stage: Container, bounds?: CameraBounds) {
    this.stage = stage
    this.bounds = bounds ?? { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity }
    this.targetZoom = stage.scale.x
  }

  public handlePan(x: number, y: number): void {
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

  public setZoom(zoom: number): void {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom))
    this.stage.scale.set(this.targetZoom)
  }

  public getZoom(): number {
    return this.targetZoom
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.stage.position.x, y: this.stage.position.y }
  }
}
