'use client'

import { useEffect, useRef } from 'react'
import { Application } from 'pixi.js'
// import { useQuery, useMutation } from 'convex/react'
// import { api } from '../../../convex/_generated/api'
// Temporarily commenting out or stubbing components that still use Excalibur
import { IsometricGrid } from './IsometricGrid'
// import { CameraController } from './Camera'
// import { AgentSprite } from './AgentSprite'
// import { POISprite } from './POISprite'
// import { screenToGrid } from '../../lib/isometric'

interface ExtendedApplication extends Application {
  _handleMouseMove?: (e: MouseEvent) => void
}

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<ExtendedApplication | null>(null)
  const gridRef = useRef<IsometricGrid | null>(null)

  // const agentsData = useQuery(api.functions.agents.getAll)
  // const updatePosition = useMutation(api.functions.agents.updatePosition)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const app = new Application() as ExtendedApplication

    const initPixi = async () => {
      const rect = container.getBoundingClientRect()
      
      await app.init({
        width: rect.width,
        height: rect.height,
        backgroundColor: 0x0f172a,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: container,
      })

      container.appendChild(app.canvas)
      appRef.current = app

      const grid = new IsometricGrid({
        width: 64,
        height: 64,
        tileWidth: 32,
        tileHeight: 16,
      })
      gridRef.current = grid
      app.stage.addChild(grid.getContainer())

      // Add event listeners here after init
      const handleMouseMove = (e: MouseEvent) => {
        const rect = app.canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        grid.updateHover(x, y)
      }

      app.canvas.addEventListener('mousemove', handleMouseMove)
      // Store for cleanup
      app._handleMouseMove = handleMouseMove
    }

    initPixi()

    return () => {
      if (appRef.current) {
        const currentApp = appRef.current
        if (currentApp._handleMouseMove) {
          currentApp.canvas.removeEventListener('mousemove', currentApp._handleMouseMove)
        }
        if (currentApp.canvas && currentApp.canvas.parentNode) {
          currentApp.canvas.parentNode.removeChild(currentApp.canvas)
        }
        currentApp.destroy(true, { children: true, texture: true, baseTexture: true })
        appRef.current = null
      }
      gridRef.current = null
    }
  }, [])

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!appRef.current) return
      if (document.hidden) {
        appRef.current.ticker.stop()
      } else {
        appRef.current.ticker.start()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative"
    >
      {/* PixiJS canvas will be appended here */}
    </div>
  )
}
