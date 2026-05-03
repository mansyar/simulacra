import { HeadContent, Scripts, createRootRoute, Outlet, useRouter } from '@tanstack/react-router'
import { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react'
import { ConvexProvider } from "convex/react"
import { convex } from "../lib/convex"
import { DrawerContext } from "../lib/drawer-context"
import { GameCanvasContext } from "../lib/game-canvas-context"
import { triggerManualTick } from "../lib/server-functions"
import type { Id } from "../../convex/_generated/dataModel"
import type { CameraController } from '../components/game/Camera'
import type { AgentSprite } from '../components/game/AgentSprite'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { GlobalThoughtStream, AdminPanel } from '../components'

import appCss from '../styles.css?url'

// Lazy load GameCanvas - it will only load in the browser
const GameCanvas = lazy(() => import('../components/game/GameCanvas').then(m => ({ default: m.GameCanvas })))

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient ? <>{children}</> : null
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Simulacra - Isometric World',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument() {
  const router = useRouter()
  const [drawerExpanded, setDrawerExpanded] = useState(false)
  const [adminPanelVisible, setAdminPanelVisible] = useState(true)
  const toggleDrawer = useCallback(() => {
    setDrawerExpanded((prev) => !prev)
  }, [])
  const cameraRef = useRef<CameraController | null>(null)
  const agentsRef = useRef<Map<Id<'agents'>, AgentSprite>>(new Map())

  const resetCamera = useCallback(() => {
    if (cameraRef.current) {
      // Center of 64x64 grid: 32 tiles * 32px tile width = 1024, 32 tiles * 16px tile height = 512
      // Add some offset for the header/status bar
      cameraRef.current.lookAt(32 * 32, 50 + (64 * 16) / 2, window.innerWidth, window.innerHeight)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      switch (e.code) {
        case 'Space': {
          e.preventDefault()
          // TODO: Add Master auth guard when auth state is available (spec: only trigger when authenticated)
          void triggerManualTick()
          break
        }
        case 'KeyR': {
          resetCamera()
          break
        }
        case 'Escape': {
          // Navigate to / if on agent detail route
          if (window.location.pathname.startsWith('/agent/')) {
            router.history.push('/')
          }
          break
        }
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5': {
          const index = parseInt(e.code.replace('Digit', '')) - 1
          const agents = agentsRef.current
          const agentIds = Array.from(agents.keys())
          if (index < agentIds.length && cameraRef.current) {
            const sprite = agents.get(agentIds[index])
            if (sprite) {
              cameraRef.current.lookAt(
                sprite.position.x,
                sprite.position.y,
                window.innerWidth,
                window.innerHeight
              )
            }
          }
          break
        }
        case 'KeyT': {
          toggleDrawer()
          break
        }
        case 'KeyM': {
          setAdminPanelVisible((prev) => !prev)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetCamera, toggleDrawer, router])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ConvexProvider client={convex}>
          <GameCanvasContext.Provider value={{ cameraRef, agentsRef, resetCamera }}>
            <DrawerContext.Provider value={{ isExpanded: drawerExpanded, toggle: toggleDrawer, setExpanded: setDrawerExpanded }}>
              <div className="flex flex-col h-screen w-screen overflow-hidden">
                <Header />
                <main className="flex-1 w-full overflow-hidden relative pb-8">
                  <ClientOnly>
                    {adminPanelVisible && <AdminPanel />}
                    <GlobalThoughtStream />
                    <Suspense fallback={
                      <div className="flex h-full w-full items-center justify-center bg-slate-900">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-slate-400">Loading game...</p>
                        </div>
                      </div>
                    }>
                      <GameCanvas />
                    </Suspense>
                    <Outlet />
                  </ClientOnly>
                </main>
                <Footer />
              </div>
            </DrawerContext.Provider>
          </GameCanvasContext.Provider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}