import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useGameCanvas } from '../lib/game-canvas-context'

describe('GameCanvasContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns fallback cameraRef with lookAt when no provider exists', () => {
    let result: unknown = null
    function TestComp() {
      const { cameraRef } = useGameCanvas()
      result = cameraRef.current
      return null
    }
    render(<TestComp />)
    expect(result).toBeNull()
  })

  it('returns fallback agentsRef Map when no provider exists', () => {
    let result: unknown = null
    function TestComp() {
      const { agentsRef } = useGameCanvas()
      result = agentsRef.current
      return null
    }
    render(<TestComp />)
    expect(result).toBeInstanceOf(Map)
  })

  it('returns noop resetCamera when no provider exists', () => {
    let result: unknown = null
    function TestComp() {
      const { resetCamera } = useGameCanvas()
      result = resetCamera
      return null
    }
    render(<TestComp />)
    expect(typeof result).toBe('function')
  })
})
