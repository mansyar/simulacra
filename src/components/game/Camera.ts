import { Camera, Vector, InputHost, BoundingBox, Engine } from 'excalibur'

export class CameraController {
  private camera: Camera
  private input: InputHost
  private engine: Engine
  private isDragging: boolean = false
  private lastPointerPos: Vector = Vector.Zero
  private zoomMin: number = 0.5
  private zoomMax: number = 3.0
  private targetPos: Vector = Vector.Zero
  private targetZoom: number = 1
  private transitionDuration: number = 200 // milliseconds

  constructor(camera: Camera, input: InputHost, engine: Engine, bounds?: BoundingBox) {
    this.camera = camera
    this.input = input
    this.engine = engine
    this.targetPos = camera.pos.clone()
    this.targetZoom = camera.zoom
    if (bounds) {
      this.camera.strategy.limitCameraBounds(bounds)
    }
  }

  public update(elapsed: number): void {
    // Handle panning via mouse drag
    const pointer = this.input.pointers.primary
    const isDraggingNow = this.input.pointers.isDragging(0)
    if (isDraggingNow) {
      const currentPos = pointer.lastWorldPos ?? Vector.Zero
      if (!this.isDragging) {
        // Drag start
        this.isDragging = true
        this.lastPointerPos = currentPos
      } else {
        // Dragging
        const delta = currentPos.sub(this.lastPointerPos)
        this.targetPos = this.targetPos.add(delta)
        this.lastPointerPos = currentPos
      }
    } else {
      this.isDragging = false
    }

    // Handle zoom with mouse wheel, centered on mouse position
    const wheelEvents = this.input.pointers.currentFrameWheel
    if (wheelEvents.length > 0) {
      const wheelEvent = wheelEvents[0]
      const delta = wheelEvent.deltaY
      const zoomFactor = delta > 0 ? 0.9 : 1.1
      let newZoom = this.targetZoom * zoomFactor
      newZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, newZoom))
      
      // Get mouse screen position (relative to canvas)
      const mouseScreenPos = pointer.lastScreenPos
      if (mouseScreenPos) {
        // Convert mouse screen position to world coordinates before zoom
        const mouseWorldPos = this.engine.screenToWorldCoordinates(mouseScreenPos)
        // Adjust target camera position so that the mouse world position stays under the mouse
        const viewport = this.engine.screen.viewport
        const viewportCenter = new Vector(viewport.width / 2, viewport.height / 2)
        const screenOffset = mouseScreenPos.sub(viewportCenter)
        const worldOffset = screenOffset.scale(1 / newZoom)
        this.targetPos = mouseWorldPos.sub(worldOffset)
        this.targetZoom = newZoom
      } else {
        this.targetZoom = newZoom
      }
    }

    // Smoothly interpolate camera position and zoom towards targets
    const t = Math.min(1, elapsed / this.transitionDuration)
    this.camera.pos = this.camera.pos.lerp(this.targetPos, t)
    this.camera.zoom = this.camera.zoom + (this.targetZoom - this.camera.zoom) * t
  }
}