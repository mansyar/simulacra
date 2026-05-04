/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MiniMap } from '../components/game/MiniMap'

// Mock requestAnimationFrame to NOT call callback immediately (avoids infinite recursion)
vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
vi.stubGlobal('cancelAnimationFrame', vi.fn())

describe('MiniMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    agentsData: [
      {
        _id: 'agent1' as any,
        _creationTime: Date.now(),
        name: 'Alpha',
        archetype: 'builder',
        gridX: 10,
        gridY: 10,
        currentAction: 'idle',
        hunger: 50,
        energy: 50,
        social: 50,
        isActive: true,
      },
      {
        _id: 'agent2' as any,
        _creationTime: Date.now(),
        name: 'Beta',
        archetype: 'socialite',
        gridX: 20,
        gridY: 20,
        currentAction: 'idle',
        hunger: 50,
        energy: 50,
        social: 50,
        isActive: true,
      },
    ],
    poisData: [
      { _id: 'poi1' as any, name: 'Library', gridX: 32, gridY: 32, type: 'library' },
      { _id: 'poi2' as any, name: 'Cafe', gridX: 40, gridY: 20, type: 'cafe' },
    ],
    cameraStateRef: {
      current: {
        positionX: 0,
        positionY: 0,
        scaleX: 1,
        viewportWidth: 800,
        viewportHeight: 600,
      },
    } as React.MutableRefObject<{
      positionX: number
      positionY: number
      scaleX: number
      viewportWidth: number
      viewportHeight: number
    }>,
    cameraRef: {
      current: {
        lookAt: vi.fn(),
        getPosition: vi.fn(() => ({ x: 0, y: 0 })),
        getZoom: vi.fn(() => 1),
        setZoom: vi.fn(),
        getScale: vi.fn(() => 1),
        handlePan: vi.fn(),
        handleZoom: vi.fn(),
        tick: vi.fn(),
      },
    } as any,
  }

  it('should render a canvas element with correct dimensions', () => {
    const { container } = render(<MiniMap {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
    expect(canvas!.getAttribute('width')).toBe('120')
    expect(canvas!.getAttribute('height')).toBe('120')
  })

  it('should render with crosshair cursor style', () => {
    const { container } = render(<MiniMap {...defaultProps} />)
    const canvas = container.querySelector('canvas')!
    const style = canvas.getAttribute('style') || ''
    expect(style).toContain('crosshair')
  })

  it('should have absolute positioning at bottom-right', () => {
    const { container } = render(<MiniMap {...defaultProps} />)
    const canvas = container.querySelector('canvas')!
    const style = canvas.getAttribute('style') || ''
    expect(style).toContain('absolute')
    expect(style).toContain('bottom')
    expect(style).toContain('right')
  })

  it('should call cameraRef.lookAt when clicked on minimap', () => {
    const mockLookAt = vi.fn()
    const localProps = {
      ...defaultProps,
      cameraRef: {
        current: {
          lookAt: mockLookAt,
          getPosition: vi.fn(() => ({ x: 0, y: 0 })),
          getZoom: vi.fn(() => 1),
          setZoom: vi.fn(),
          getScale: vi.fn(() => 1),
          handlePan: vi.fn(),
          handleZoom: vi.fn(),
          tick: vi.fn(),
        },
      } as any,
    }

    const { container } = render(<MiniMap {...localProps} />)
    const canvas = container.querySelector('canvas')!

    fireEvent.click(canvas, { clientX: 60, clientY: 60 })

    expect(mockLookAt).toHaveBeenCalled()
  })

  it('should handle camera state ref mutation gracefully', () => {
    const cameraStateRef = {
      current: {
        positionX: 0,
        positionY: 0,
        scaleX: 1,
        viewportWidth: 800,
        viewportHeight: 600,
      },
    }

    const { rerender } = render(
      <MiniMap {...defaultProps} cameraStateRef={cameraStateRef as any} />
    )

    // Update camera state via ref mutation
    cameraStateRef.current = {
      positionX: 100,
      positionY: 50,
      scaleX: 1.5,
      viewportWidth: 800,
      viewportHeight: 600,
    }

    rerender(<MiniMap {...defaultProps} cameraStateRef={cameraStateRef as any} />)

    const canvas = document.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })
})
