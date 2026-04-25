'use client'

import { useEffect, useRef, useState } from 'react'
import { Application, Container } from 'pixi.js'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
// Temporarily commenting out or stubbing components that still use Excalibur
// import { IsometricGrid } from './IsometricGrid'
// import { CameraController } from './Camera'
// import { AgentSprite } from './AgentSprite'
// import { POISprite } from './POISprite'
import { screenToGrid } from '../../lib/isometric'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [isReady, setIsReady] = useState(false)

  const agentsData = useQuery(api.functions.agents.getAll)
  const updatePosition = useMutation(api.functions.agents.updatePosition)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const app = new Application()

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
      setIsReady(true)
    }

    initPixi()

    return () => {
      setIsReady(false)
      if (appRef.current) {
        const currentApp = appRef.current
        if (currentApp.canvas && currentApp.canvas.parentNode) {
          currentApp.canvas.parentNode.removeChild(currentApp.canvas)
        }
        currentApp.destroy(true, { children: true, texture: true, baseTexture: true })
        appRef.current = null
      }
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
