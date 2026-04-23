import { Camera, Vector, InputHost, BoundingBox, Engine } from 'excalibur'

export class CameraController {
  private camera: Camera
  private input: InputHost
  private bounds: BoundingBox
  private targetZoom: number = 1
  private targetPos: Vector = Vector.Zero
  private isDragging: boolean = false
  private lastPointerPos: Vector = Vector.Zero
  private minZoom: number = 0.5
  private maxZoom: number = 2

  constructor(camera: Camera, input: InputHost, _engine: Engine, bounds?: BoundingBox) {
    this.camera = camera
    this.input = input
    this.bounds = bounds ?? new BoundingBox({ left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity })
    this.targetPos = camera.pos.clone()
  }

  public update(_elapsed: number): void {
    const pointer = this.input.pointers

    // Handle panning with mouse drag
    if (pointer.isDragging(0)) {
      const currentPos = pointer.primary?.lastWorldPos ?? Vector.Zero
      if (!this.isDragging) {
        this.isDragging = true
        this.lastPointerPos = currentPos
      } else {
        const delta = currentPos.sub(this.lastPointerPos)
        this.targetPos = this.targetPos.add(delta)
        this.lastPointerPos = currentPos
      }
    } else {
      this.isDragging = false
    }

    // Handle zooming with mouse wheel
    const wheelEvents = pointer.currentFrameWheel
    if (wheelEvents.length > 0) {
      const wheelEvent = wheelEvents[0]
      const delta = wheelEvent.deltaY
      const zoomFactor = delta > 0 ? 0.9 : 1.1
      this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom * zoomFactor))
    }

    // Clamp position to bounds
    this.targetPos.x = Math.max(this.bounds.left, Math.min(this.bounds.right, this.targetPos.x))
    this.targetPos.y = Math.max(this.bounds.top, Math.min(this.bounds.bottom, this.targetPos.y))

    // Round positions to prevent sub-pixel flickering
    const roundedX = Math.round(this.targetPos.x)
    const roundedY = Math.round(this.targetPos.y)
    this.camera.pos = new Vector(roundedX, roundedY)
    this.camera.zoom = this.targetZoom
  }
}
