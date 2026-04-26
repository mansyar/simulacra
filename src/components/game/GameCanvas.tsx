'use client'

import { useEffect, useRef } from 'react'
import { Application } from 'pixi.js'
// import { useQuery, useMutation } from 'convex/react'
// import { api } from '../../../convex/_generated/api'
// Temporarily commenting out or stubbing components that still use Excalibur
import { IsometricGrid } from './IsometricGrid'
import { CameraController } from './Camera'
// import { AgentSprite } from './AgentSprite'
// import { POISprite } from './POISprite'
// import { screenToGrid } from '../../lib/isometric'

interface ExtendedApplication extends Application {
  _handleMouseMove?: (e: MouseEvent) => void
  _handleMouseDown?: (e: MouseEvent) => void
  _handleMouseUp?: (e: MouseEvent) => void
  _handleWheel?: (e: WheelEvent) => void
}

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<ExtendedApplication | null>(null)
  const gridRef = useRef<IsometricGrid | null>(null)
  const cameraRef = useRef<CameraController | null>(null)

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

      const camera = new CameraController(app.stage)
      cameraRef.current = camera

      // Add event listeners here after init
      let isDragging = false
      let lastPos = { x: 0, y: 0 }

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true
        lastPos = { x: e.clientX, y: e.clientY }
      }

      const handleMouseMove = (e: MouseEvent) => {
        const rect = app.canvas.getBoundingClientRect()
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top
        
        // Convert screen coordinates to local stage coordinates
        const localX = (screenX - app.stage.position.x) / app.stage.scale.x
        const localY = (screenY - app.stage.position.y) / app.stage.scale.y
        
        grid.updateHover(localX, localY)

        if (isDragging) {
          const dx = e.clientX - lastPos.x
          const dy = e.clientY - lastPos.y
          const pos = camera.getPosition()
          camera.handlePan(pos.x + dx, pos.y + dy)
          lastPos = { x: e.clientX, y: e.clientY }
        }
      }

      const handleMouseUp = () => {
        isDragging = false
      }

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        const rect = app.canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        camera.handleZoom(e.deltaY, x, y)
      }

      app.canvas.addEventListener('mousedown', handleMouseDown)
      app.canvas.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      app.canvas.addEventListener('wheel', handleWheel, { passive: false })

      // Store for cleanup
      app._handleMouseDown = handleMouseDown
      app._handleMouseMove = handleMouseMove
      app._handleMouseUp = handleMouseUp
      app._handleWheel = handleWheel
    }

    initPixi()

    return () => {
      if (appRef.current) {
        const currentApp = appRef.current
        if (currentApp._handleMouseDown) currentApp.canvas.removeEventListener('mousedown', currentApp._handleMouseDown)
        if (currentApp._handleMouseMove) currentApp.canvas.removeEventListener('mousemove', currentApp._handleMouseMove)
        if (currentApp._handleMouseUp) window.removeEventListener('mouseup', currentApp._handleMouseUp)
        if (currentApp._handleWheel) currentApp.canvas.removeEventListener('wheel', currentApp._handleWheel)

        if (currentApp.canvas && currentApp.canvas.parentNode) {
          currentApp.canvas.parentNode.removeChild(currentApp.canvas)
        }
        currentApp.destroy(true, { children: true, texture: true, baseTexture: true })
        appRef.current = null
      }
      gridRef.current = null
      cameraRef.current = null
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
