'use client'

import { useEffect, useRef, useState } from 'react'
import { Application, Container, Ticker } from 'pixi.js'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { IsometricGrid } from './IsometricGrid'
import { CameraController } from './Camera'
import { AgentSprite } from './AgentSprite'
import { POISprite } from './POISprite'

interface ExtendedApplication extends Application {
  _handleMouseMove?: (e: MouseEvent) => void
  _handleMouseDown?: (e: MouseEvent) => void
  _handleMouseUp?: (e: MouseEvent) => void
  _handleWheel?: (e: WheelEvent) => void
  _tick?: (ticker: Ticker) => void
}

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<ExtendedApplication | null>(null)
  const gridRef = useRef<IsometricGrid | null>(null)
  const cameraRef = useRef<CameraController | null>(null)
  const agentsRef = useRef<Map<Id<'agents'>, AgentSprite>>(new Map())
  const poisRef = useRef<Map<Id<'pois'>, POISprite>>(new Map())
  const agentContainerRef = useRef<Container | null>(null)
  const poiContainerRef = useRef<Container | null>(null)
  const [isReady, setIsReady] = useState(false)

  const agentsData = useQuery(api.functions.agents.getAll)
  const poisData = useQuery(api.functions.world.getPois)

  useEffect(() => {
    if (!containerRef.current) return

    let isMounted = true
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

      if (!isMounted) {
        app.destroy(true, { children: true, texture: true })
        return
      }

      container.appendChild(app.canvas)
      appRef.current = app

      const grid = new IsometricGrid({
        width: 64,
        height: 64,
        tileWidth: 32,
        tileHeight: 16,
      })
      gridRef.current = grid
      const gridContainer = grid.getContainer()
      gridContainer.zIndex = 1
      app.stage.addChild(gridContainer)

      const gridWidth = 64 * 32
      const gridHeight = 64 * 16
      const centerX = gridWidth / 2
      const centerY = 50 + gridHeight / 2

      const poiContainer = new Container({ label: 'poiContainer' })
      poiContainer.zIndex = 10
      app.stage.addChild(poiContainer)
      poiContainerRef.current = poiContainer

      const agentContainer = new Container({ label: 'agentContainer' })
      agentContainer.zIndex = 11
      app.stage.addChild(agentContainer)
      agentContainerRef.current = agentContainer

      const camera = new CameraController(app.stage)
      cameraRef.current = camera
      
      app.stage.sortableChildren = true

      camera.handlePan(-centerX + rect.width / 2, -centerY + rect.height / 2)

      // Add event listeners here after init
      let isDragging = false
      let lastPos = { x: 0, y: 0 }

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true
        lastPos = { x: e.clientX, y: e.clientY }
      }

      const handleMouseMove = (e: MouseEvent) => {
        const canvasRect = app.canvas.getBoundingClientRect()
        const screenX = e.clientX - canvasRect.left
        const screenY = e.clientY - canvasRect.top
        
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
        const canvasRect = app.canvas.getBoundingClientRect()
        const x = e.clientX - canvasRect.left
        const y = e.clientY - canvasRect.top
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

      // Ticker for smooth updates
      const tick = (ticker: Ticker) => {
        agentsRef.current.forEach(agent => {
          agent.tick(ticker.deltaTime)
        })
        
        // Spec compliance: Viewport Culling
        if (gridRef.current) {
          const stage = app.stage
          const viewportWidth = app.screen.width / stage.scale.x
          const viewportHeight = app.screen.height / stage.scale.y
          const left = -stage.position.x / stage.scale.x
          const top = -stage.position.y / stage.scale.y
          
          gridRef.current.cull({
            left,
            top,
            right: left + viewportWidth,
            bottom: top + viewportHeight
          })
        }
      }
      app.ticker.add(tick)
      app._tick = tick

      setIsReady(true)
    }

    initPixi()

    return () => {
      isMounted = false
      if (appRef.current) {
        const currentApp = appRef.current
        if (currentApp._tick) currentApp.ticker.remove(currentApp._tick)
        if (currentApp._handleMouseDown) currentApp.canvas.removeEventListener('mousedown', currentApp._handleMouseDown)
        if (currentApp._handleMouseMove) currentApp.canvas.removeEventListener('mousemove', currentApp._handleMouseMove)
        if (currentApp._handleMouseUp) window.removeEventListener('mouseup', currentApp._handleMouseUp)
        if (currentApp._handleWheel) currentApp.canvas.removeEventListener('wheel', currentApp._handleWheel)

        if (currentApp.canvas && currentApp.canvas.parentNode) {
          currentApp.canvas.parentNode.removeChild(currentApp.canvas)
        }
        currentApp.destroy(true, { children: true, texture: true })
        appRef.current = null
      }
      
      // Wipe any zombie canvases
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      
      gridRef.current = null
      cameraRef.current = null
      agentsRef.current.clear()
      poisRef.current.clear()
      setIsReady(false)
    }
  }, [])

  // Consolidated Sync Effect
  useEffect(() => {
    if (!isReady || !appRef.current || !agentsData || !poisData) return
    const agentContainer = agentContainerRef.current
    const poiContainer = poiContainerRef.current
    
    if (!agentContainer || !poiContainer) return

    const currentPois = poisRef.current
    const newPoiIds = new Set(poisData.map(p => p._id))
    currentPois.forEach((sprite, id) => {
      if (!newPoiIds.has(id)) {
        poiContainer.removeChild(sprite)
        currentPois.delete(id)
      }
    })
    poisData.forEach(poi => {
      if (!currentPois.has(poi._id)) {
        const sprite = new POISprite(poi)
        poiContainer.addChild(sprite)
        currentPois.set(poi._id, sprite)
      }
    })

    // --- Sync Agents ---
    const currentAgents = agentsRef.current
    const newAgentIds = new Set(agentsData.map(a => a._id))

    currentAgents.forEach((sprite, id) => {
      if (!newAgentIds.has(id)) {
        agentContainer.removeChild(sprite)
        currentAgents.delete(id)
      }
    })
    agentsData.forEach(agent => {
      if (!currentAgents.has(agent._id)) {
        const sprite = new AgentSprite(agent)
        agentContainer.addChild(sprite)
        currentAgents.set(agent._id, sprite)
      } else {
        const sprite = currentAgents.get(agent._id)
        sprite?.updateAgentData(agent)
      }
    })
  }, [agentsData, poisData, isReady])

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
