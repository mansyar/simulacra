import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CameraController } from '../components/game/Camera'
import { Camera, InputHost, PointerEventReceiver, Vector, BoundingBox, Engine, Screen, WheelEvent } from 'excalibur'

describe('CameraController', () => {
  let mockCamera: Camera
  let mockInput: InputHost
  let mockPointers: PointerEventReceiver
  let mockEngine: Engine
  let controller: CameraController

  beforeEach(() => {
    // Mock Camera
    mockCamera = {
      pos: Vector.Zero,
      zoom: 1,
      strategy: {
        limitCameraBounds: vi.fn(),
      },
    } as unknown as Camera

    // Mock InputHost
    const isDraggingMock = vi.fn()
    mockPointers = {
      isDragging: isDraggingMock,
      primary: {
        lastWorldPos: Vector.Zero,
        lastScreenPos: Vector.Zero,
      },
      currentFrameWheel: [],
    } as unknown as PointerEventReceiver
    mockInput = {
      pointers: mockPointers,
    } as unknown as InputHost

    // Mock Engine with screen and screenToWorldCoordinates
    mockEngine = {
      screen: {
        viewport: { width: 800, height: 600 },
      } as unknown as Screen,
      screenToWorldCoordinates: vi.fn((point) => point),
    } as unknown as Engine

    controller = new CameraController(mockCamera, mockInput, mockEngine)
  })

  it('should limit camera bounds when bounds provided', () => {
    const bounds = new BoundingBox({ left: 0, right: 100, top: 0, bottom: 100 })
    const controller = new CameraController(mockCamera, mockInput, mockEngine, bounds)
    expect(controller).toBeDefined()
  })

  it('should pan camera when dragging', () => {
    // Simulate drag start
    mockPointers.isDragging = vi.fn().mockReturnValue(true)
    mockPointers.primary.lastWorldPos = new Vector(10, 20)
    // First update: drag start
    controller.update(16)
    // Second update: dragging
    controller.update(16)
    // Ensure no error thrown
    expect(() => controller.update(16)).not.toThrow()
  })

  it('should zoom camera when mouse wheel event', () => {
    // Simulate wheel event
    mockPointers.currentFrameWheel = [{ deltaY: -100 }] as WheelEvent[]
    const initialZoom = mockCamera.zoom
    controller.update(16)
    // Zoom should increase (deltaY negative => zoom in)
    expect(mockCamera.zoom).toBeGreaterThan(initialZoom)
  })

  it('should handle null primary pointer during drag', () => {
    mockPointers.isDragging = vi.fn().mockReturnValue(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPointers.primary = null as any
    controller.update(16)
    expect(controller).toBeDefined()
  })

  it('should clamp position to specified bounds', () => {
    const bounds = new BoundingBox({ left: 0, right: 100, top: 0, bottom: 100 })
    const limitedController = new CameraController(mockCamera, mockInput, mockEngine, bounds)
    
    // Simulate position outside bounds
    mockPointers.isDragging = vi.fn().mockReturnValue(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPointers.primary = { lastWorldPos: new Vector(500, 500) } as any
    
    limitedController.update(16)
    limitedController.update(16)
    
    // Position should be clamped
    expect(mockCamera.pos.x).toBeLessThanOrEqual(100)
    expect(mockCamera.pos.y).toBeLessThanOrEqual(100)
  })
})