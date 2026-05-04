'use client'

import { useEffect, useRef, useState, useContext } from 'react'
import { Application, Container, Ticker } from 'pixi.js'
import { useQuery } from 'convex/react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { GameCanvasContext } from '../../lib/game-canvas-context'
import { IsometricGrid } from './IsometricGrid'
import { CameraController } from './Camera'
import { AgentSprite } from './AgentSprite'
import { POISprite } from './POISprite'
import { ConversationLines } from './ConversationLines'
import { MiniMap } from './MiniMap'
import { getCameraUrlParamsFromWindow, buildCameraUrlSearchString } from '../../lib/url-camera'
import type { CameraUrlParams } from '../../lib/url-camera'
import { gridToScreen, screenToGrid } from '../../lib/isometric'
import { getWeatherSpeedMultiplier } from '../../lib/weather'

interface ExtendedApplication extends Application {
  _handleMouseMove?: (e: MouseEvent) => void
  _handleMouseDown?: (e: MouseEvent) => void
  _handleMouseUp?: (e: MouseEvent) => void
  _handleWheel?: (e: WheelEvent) => void
  _tick?: (ticker: Ticker) => void
}

export function GameCanvas() {
  const navigate = useNavigate()
  const routeParams = useParams({ from: '/agent/$id', shouldThrow: false })
  const selectedAgentId = routeParams?.id
  const ctx = useContext(GameCanvasContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<ExtendedApplication | null>(null)
  const gridRef = useRef<IsometricGrid | null>(null)
  // Use shared refs from context when available (for keyboard shortcuts), fallback to local
  const localCameraRef = useRef<CameraController | null>(null)
  const localAgentsRef = useRef<Map<Id<'agents'>, AgentSprite>>(new Map())
  const cameraRef = ctx?.cameraRef ?? localCameraRef
  const agentsRef = ctx?.agentsRef ?? localAgentsRef
  const poisRef = useRef<Map<Id<'pois'>, POISprite>>(new Map())
  const agentContainerRef = useRef<Container | null>(null)
  const poiContainerRef = useRef<Container | null>(null)
  const conversationLinesRef = useRef<ConversationLines | null>(null)
  const cameraStateRef = useRef({
    positionX: 0,
    positionY: 0,
    scaleX: 1,
    viewportWidth: 0,
    viewportHeight: 0,
  })
  const [isReady, setIsReady] = useState(false)
  const [urlParamsApplied, setUrlParamsApplied] = useState(false)
  const urlParamsRef = useRef<CameraUrlParams | null>(null)
  const lastUrlStateRef = useRef({ posX: 0, posY: 0, zoom: 0 })

  // Read URL camera params once on mount
  useEffect(() => {
    urlParamsRef.current = getCameraUrlParamsFromWindow()
  }, [])

  const agentsData = useQuery(api.functions.agents.getAll)
  const poisData = useQuery(api.functions.world.getPois)
  const worldState = useQuery(api.functions.world.getState)

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

      // Add conversation lines container
      const conversationLines = new ConversationLines()
      conversationLinesRef.current = conversationLines
      app.stage.addChild(conversationLines.getContainer())

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
        if (cameraRef.current) {
          cameraRef.current.tick(ticker.deltaTime)
        }

        agentsRef.current.forEach(agent => {
          agent.tick(ticker.deltaTime)
        })

        // Update conversation lines
        if (conversationLinesRef.current) {
          conversationLinesRef.current.update(ticker.deltaTime)
        }
        
        // Update camera state ref for MiniMap
        const stage = app.stage
        cameraStateRef.current = {
          positionX: stage.position.x,
          positionY: stage.position.y,
          scaleX: stage.scale.x,
          viewportWidth: app.screen.width,
          viewportHeight: app.screen.height,
        }

        // Spec compliance: Viewport Culling
        if (gridRef.current) {
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
      if (conversationLinesRef.current) {
        conversationLinesRef.current.clear()
      }
      conversationLinesRef.current = null
      setIsReady(false)
    }
  }, [])

  // Consolidated Sync Effect
  useEffect(() => {
    if (!isReady || !appRef.current || !agentsData || !poisData) return
    const agentContainer = agentContainerRef.current
    const poiContainer = poiContainerRef.current
    
    if (!agentContainer || !poiContainer) return

    const speedMultiplier = getWeatherSpeedMultiplier(worldState?.weather)

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
        const sprite = new AgentSprite(agent, speedMultiplier)
        sprite.on('select', () => {
          navigate({
            to: '/agent/$id',
            params: { id: agent._id }
          })
          if (cameraRef.current && appRef.current) {
            cameraRef.current.lookAt(
              sprite.position.x,
              sprite.position.y,
              appRef.current.screen.width,
              appRef.current.screen.height
            )
          }
        })
        agentContainer.addChild(sprite)
        currentAgents.set(agent._id, sprite)
      } else {
        const sprite = currentAgents.get(agent._id)
        sprite?.updateAgentData(agent)
      }
    })

    // --- Sync Weather Speed Multiplier on all existing sprites ---
    currentAgents.forEach((sprite) => {
      sprite.setSpeedMultiplier(speedMultiplier)
    })

    // --- Sync Conversation Lines (diff-based) ---
    if (conversationLinesRef.current) {
      const conversationLines = conversationLinesRef.current;
      
      // Get all agents with active conversation states
      const agentsInConversation = agentsData.filter(a => a.conversationState);
      
      // Build a lookup: pairKey -> [agent, partner]
      const pairToAgents = new Map<string, [typeof agentsData[0], typeof agentsData[0]]>();
      for (const agent of agentsInConversation) {
        if (!agent.conversationState) continue;
        const partnerId = agent.conversationState.partnerId;
        const partner = agentsData.find(a => a._id === partnerId);
        if (!partner) continue;
        const key = agent._id < partnerId ? `${agent._id}-${partnerId}` : `${partnerId}-${agent._id}`;
        pairToAgents.set(key, [agent, partner]);
      }

      // Update or add current conversations
      for (const [agent, partner] of pairToAgents.values()) {
        const toAgentData = (a: typeof agent) => ({
          id: a._id,
          name: a.name,
          gridX: a.gridX,
          gridY: a.gridY,
          archetype: a.archetype as 'builder' | 'socialite' | 'philosopher' | 'explorer' | 'nurturer',
        });

        if (conversationLines.hasConversation(agent._id, partner._id)) {
          conversationLines.updatePositions(toAgentData(agent), toAgentData(partner));
        } else {
          conversationLines.addConversation(toAgentData(agent), toAgentData(partner));
        }
      }
    }
  }, [agentsData, poisData, worldState, isReady])

  // Sync Selection State
  useEffect(() => {
    if (!isReady) return
    
    agentsRef.current.forEach((sprite, id) => {
      sprite.setSelected(id === selectedAgentId)
    })
  }, [selectedAgentId, isReady])

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

  // Apply URL camera params on mount (once agentsData is ready)
  useEffect(() => {
    if (!isReady || !agentsData || !appRef.current) return
    if (urlParamsApplied) return

    const urlParams = urlParamsRef.current
    if (!urlParams) return

    const camera = cameraRef.current
    if (!camera) return

    const viewportWidth = appRef.current.screen.width
    const viewportHeight = appRef.current.screen.height

    // Priority 1: focus agent
    if (urlParams.focusAgentId) {
      const targetAgent = agentsData.find(a => a._id === urlParams.focusAgentId)
      if (targetAgent) {
        const { x: worldX, y: worldY } = gridToScreen(targetAgent.gridX, targetAgent.gridY)
        const offsetX = (64 * 32) / 2
        const offsetY = 50
        camera.lookAt(worldX + offsetX, worldY + offsetY, viewportWidth, viewportHeight)
      }
    }
    // Priority 2: center grid coords
    else if (urlParams.centerGridX !== undefined && urlParams.centerGridY !== undefined) {
      const { x: worldX, y: worldY } = gridToScreen(urlParams.centerGridX, urlParams.centerGridY)
      const offsetX = (64 * 32) / 2
      const offsetY = 50
      camera.lookAt(worldX + offsetX, worldY + offsetY, viewportWidth, viewportHeight)
    }
    // Priority 3: no params, leave at default center

    // Apply zoom after positioning
    if (urlParams.zoom !== undefined) {
      camera.setZoom(urlParams.zoom)
    }

    setUrlParamsApplied(true)
  }, [isReady, agentsData, urlParamsApplied])

  // Debounced write-back: Write camera state to URL on pan/zoom (500ms debounce)
  useEffect(() => {
    if (!isReady) return

    const OFFSET_X = 1024
    const OFFSET_Y = 50
    const interval = setInterval(() => {
      const state = cameraStateRef.current
      const camera = cameraRef.current
      if (!camera) return

      const pos = camera.getPosition()
      const zoom = camera.getZoom()

      // Check if camera position or zoom changed significantly
      const posChanged = Math.abs(pos.x - lastUrlStateRef.current.posX) > 0.5
        || Math.abs(pos.y - lastUrlStateRef.current.posY) > 0.5
      const zoomChanged = Math.abs(zoom - lastUrlStateRef.current.zoom) > 0.01

      if (!posChanged && !zoomChanged) return

      lastUrlStateRef.current = { posX: pos.x, posY: pos.y, zoom }

      // Compute center grid coordinates from camera position and viewport
      const centerWorldX = (-state.positionX + state.viewportWidth / 2) / state.scaleX
      const centerWorldY = (-state.positionY + state.viewportHeight / 2) / state.scaleX
      const { x: centerGridX, y: centerGridY } = screenToGrid(
        centerWorldX - OFFSET_X,
        centerWorldY - OFFSET_Y
      )

      const searchString = buildCameraUrlSearchString(zoom, centerGridX, centerGridY)
      window.history.replaceState(null, '', '?' + searchString)
    }, 500)

    return () => clearInterval(interval)
  }, [isReady])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative"
    >
      {/* PixiJS canvas will be appended here */}
      {agentsData && poisData && (
        <MiniMap
          agentsData={agentsData}
          poisData={poisData}
          cameraStateRef={cameraStateRef}
          cameraRef={cameraRef}
        />
      )}
    </div>
  )
}
