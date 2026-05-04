import { describe, it, expect, vi } from 'vitest'
import { CameraController } from '../components/game/Camera'

// Mock PixiJS
vi.mock('pixi.js', () => {
  return {
    Container: class {
      position = { x: 0, y: 0, set: vi.fn() }
      scale = { x: 1, y: 1, set: vi.fn() }
    }
  }
})

describe('CameraController', () => {
  it('should smoothly pan to target in tick', () => {
    const mockStage = { 
      scale: { x: 1, y: 1, set: vi.fn() }, 
      position: { x: 0, y: 0, set: vi.fn() } 
    }
    // @ts-expect-error - mock stage
    const camera = new CameraController(mockStage)
    
    camera.lookAt(100, 100, 800, 600)
    // Target position should be: 400 - 100*1 = 300, 300 - 100*1 = 200
    
    // @ts-expect-error - private property
    expect(camera.targetX).toBe(300)
    // @ts-expect-error - private property
    expect(camera.targetY).toBe(200)

    camera.tick(1)
    expect(mockStage.position.set).toHaveBeenCalled()
  })

  it('should return current stage scale from getScale', () => {
    const mockStage = { 
      scale: { x: 1.5, y: 1.5, set: vi.fn() }, 
      position: { x: 0, y: 0, set: vi.fn() } 
    }
    // @ts-expect-error - mock stage
    const camera = new CameraController(mockStage)
    
    expect(camera.getScale()).toBe(1.5)
  })

  it('should cancel auto-pan on manual handlePan', () => {
    const mockStage = { 
      scale: { x: 1, y: 1, set: vi.fn() }, 
      position: { x: 0, y: 0, set: vi.fn() } 
    }
    // @ts-expect-error - mock stage
    const camera = new CameraController(mockStage)
    
    camera.lookAt(100, 100, 800, 600)
    camera.handlePan(50, 50)
    
    // @ts-expect-error - private property
    expect(camera.targetX).toBeNull()
  })
})
