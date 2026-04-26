import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CameraController } from '../components/game/Camera'
import { Container } from 'pixi.js'

describe('CameraController (PixiJS)', () => {
  let mockStage: Container
  let controller: CameraController

  beforeEach(() => {
    mockStage = {
      position: { x: 0, y: 0, set: vi.fn().mockImplementation(function(this: any, x: number, y: number) {
        this.x = x;
        this.y = y !== undefined ? y : x;
      }) },
      scale: { x: 1, y: 1, set: vi.fn().mockImplementation(function(this: any, x: number, y: number) {
        this.x = x;
        this.y = y !== undefined ? y : x;
      }) },
    } as unknown as Container

    controller = new CameraController(mockStage)
  })

  it('should initialize with correct container', () => {
    expect(controller).toBeDefined()
  })

  it('should update stage position when panning', () => {
    // Simulate pan by calling the handler directly (since event listeners are on the canvas)
    controller.handlePan(10, 20)
    expect(mockStage.position.x).toBe(10)
    expect(mockStage.position.y).toBe(20)
  })

  it('should update stage scale when zooming', () => {
    const initialScale = mockStage.scale.x
    controller.handleZoom(-100, 400, 300) // Zoom in at mouse (400, 300)
    expect(mockStage.scale.x).toBeGreaterThan(initialScale)
  })

  it('should clamp zoom within min/max bounds', () => {
    // Zoom out many times
    for(let i=0; i<20; i++) {
      controller.handleZoom(100, 0, 0)
    }
    expect(mockStage.scale.x).toBe(0.5) // minZoom

    // Zoom in many times
    for(let i=0; i<20; i++) {
      controller.handleZoom(-100, 0, 0)
    }
    expect(mockStage.scale.x).toBe(2) // maxZoom
  })

  it('should clamp position to specified bounds', () => {
    const bounds = { left: -100, right: 100, top: -100, bottom: 100 }
    const limitedController = new CameraController(mockStage, bounds)
    
    limitedController.handlePan(500, 500)
    expect(mockStage.position.x).toBeLessThanOrEqual(100)
    expect(mockStage.position.y).toBeLessThanOrEqual(100)
  })
})
