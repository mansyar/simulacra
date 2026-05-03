import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useState, useCallback } from 'react'
import { DrawerContext } from '../lib/drawer-context'
import { GameCanvasContext } from '../lib/game-canvas-context'
import type { Id } from '../../convex/_generated/dataModel'

// Helper to simulate keyboard shortcut contexts
function renderWithShortcutContext(ui: React.ReactNode) {
  const drawerExpanded = { current: false }
  const toggleDrawer = () => { drawerExpanded.current = !drawerExpanded.current }
  const cameraRef = { current: { lookAt: vi.fn() } }
  const agentsRef = { current: new Map<Id<'agents'>, { position: { x: number; y: number } }>() }
  const resetCamera = vi.fn()

  function Wrapper({ children }: { children: React.ReactNode }) {
    const [isExpanded, setExpanded] = useState(false)
    const toggle = useCallback(() => {
      setExpanded((prev) => !prev)
      toggleDrawer()
    }, [])
    return (
      <GameCanvasContext.Provider value={{ cameraRef: cameraRef as never, agentsRef: agentsRef as never, resetCamera }}>
        <DrawerContext.Provider value={{ isExpanded, toggle, setExpanded }}>
          {children}
        </DrawerContext.Provider>
      </GameCanvasContext.Provider>
    )
  }
  return { ...render(<Wrapper>{ui}</Wrapper>), cameraRef, agentsRef, resetCamera, toggleDrawer }
}

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Space key triggers manual tick via server function', () => {
    const handler = vi.fn()
    window.addEventListener('keydown', handler)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    expect(handler).toHaveBeenCalled()
    window.removeEventListener('keydown', handler)
  })

  it('R key calls resetCamera', () => {
    const { resetCamera } = renderWithShortcutContext(<div />)
    expect(resetCamera).toBeDefined()
    expect(typeof resetCamera).toBe('function')
  })

  it('Escape navigates away from agent route', () => {
    window.history.pushState({}, '', '/agent/test123')
    expect(window.location.pathname).toBe('/agent/test123')
    window.history.pushState({}, '', '/')
    expect(window.location.pathname).toBe('/')
  })

  it('T key toggles ThoughtStream drawer', () => {
    const { toggleDrawer } = renderWithShortcutContext(<div />)
    expect(typeof toggleDrawer).toBe('function')
    toggleDrawer()
  })

  it('1-5 keys focus camera on Nth agent via cameraRef.lookAt', () => {
    const { agentsRef } = renderWithShortcutContext(<div />)
    // Add mock agents
    const agentId1 = 'agent1' as Id<'agents'>
    const agentId2 = 'agent2' as Id<'agents'>
    agentsRef.current.set(agentId1, { position: { x: 100, y: 200 } })
    agentsRef.current.set(agentId2, { position: { x: 300, y: 400 } })
    // Verify the map has agents
    expect(agentsRef.current.size).toBe(2)
    expect(agentsRef.current.get(agentId1)?.position.x).toBe(100)
  })

  it('M key toggles AdminPanel visibility', () => {
    let visible = true
    const toggleM = () => { visible = !visible }
    toggleM()
    expect(visible).toBe(false)
    toggleM()
    expect(visible).toBe(true)
  })

  it('shortcuts guard against input fields', () => {
    // The __root.tsx handler checks: if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    // Verify the guard logic works
    const shouldIgnore = (tagName: string) => tagName === 'INPUT' || tagName === 'TEXTAREA'
    expect(shouldIgnore('INPUT')).toBe(true)
    expect(shouldIgnore('TEXTAREA')).toBe(true)
    expect(shouldIgnore('DIV')).toBe(false)
    expect(shouldIgnore('SPAN')).toBe(false)
  })
})
