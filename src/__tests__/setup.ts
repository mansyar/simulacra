// Setup for jsdom environment
import { vi } from 'vitest'

// Mock window for Excalibur
Object.defineProperty(window, 'audioContext', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(window, 'webkitAudioContext', {
  value: vi.fn(),
  writable: true,
})

// Mock HTMLCanvasElement methods
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,')
   
  HTMLCanvasElement.prototype.getContext = vi.fn((_type: string) => {
    // Return a mock context with all possible methods
    return {
      canvas: { width: 0, height: 0 },
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      rect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      translate: vi.fn(),
      transform: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      clip: vi.fn(),
      isPointInPath: vi.fn(),
      isPointInStroke: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      drawImage: vi.fn(),
      createImageData: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      lineDashOffset: 0,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      shadowBlur: 0,
      shadowColor: 'transparent',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  })
}