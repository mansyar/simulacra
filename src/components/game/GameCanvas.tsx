'use client'

import { useEffect, useRef, useState } from 'react'
import { Engine, Scene, Actor, Color, Vector, BoundingBox } from 'excalibur'
import type { ExcaliburGraphicsContext } from 'excalibur'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { IsometricGrid } from './IsometricGrid'
import { CameraController } from './Camera'
import { AgentSprite } from './AgentSprite'
import type { AgentData } from './AgentSprite'
import { screenToGrid } from '../../lib/isometric'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const gridRef = useRef<IsometricGrid | null>(null)
  const [isEngineReady, setIsEngineReady] = useState(false)
  const agentsMapRef = useRef<Map<string, AgentSprite>>(new Map())
  const gridActorRef = useRef<Actor | null>(null)
  const isVisibleRef = useRef(true)

  const agentsData = useQuery(api.functions.agents.getAll)
  const updatePosition = useMutation(api.functions.agents.updatePosition)

  // Sync agents from database
  useEffect(() => {
    if (!isEngineReady || !sceneRef.current || !agentsData) return

    const scene = sceneRef.current
    const currentAgentsMap = agentsMapRef.current
    const dataIds = new Set(agentsData.map((a) => a._id))

    // Remove agents that are no longer in the data
    for (const [id, sprite] of currentAgentsMap.entries()) {
      if (!dataIds.has(id as Id<'agents'>)) {
        scene.remove(sprite)
        currentAgentsMap.delete(id)
      }
    }

    // Add or update agents
    for (const agent of agentsData) {
      const existingSprite = currentAgentsMap.get(agent._id)
      if (existingSprite) {
        existingSprite.updateGridPosition(agent.gridX, agent.gridY)
      } else {
        const agentData: AgentData = {
          id: agent._id,
          name: agent.name,
          gridX: agent.gridX,
          gridY: agent.gridY,
          archetype: agent.archetype,
        }
        const newSprite = new AgentSprite(agentData)
        scene.add(newSprite)
        currentAgentsMap.set(agent._id, newSprite)
      }
    }
  }, [agentsData, isEngineReady])

  // Handle engine initialization
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    const container = containerRef.current
    const canvas = canvasRef.current

    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const engine = new Engine({
      canvasElement: canvas,
      viewport: { width: rect.width, height: rect.height },
      backgroundColor: Color.fromHex('#0f172a'),
      antialiasing: false,
      pixelRatio: 1,
      maxFps: 60,
    })
    engineRef.current = engine

    const scene = new Scene()
    engine.addScene('game', scene)
    engine.goToScene('game')

    const grid = new IsometricGrid({
      width: 64,
      height: 64,
      tileWidth: 32,
      tileHeight: 16,
    })
    gridRef.current = grid

    const bbox = grid.getBoundingBox()
    const bounds = new BoundingBox({
      left: bbox.left,
      right: bbox.right,
      top: bbox.top,
      bottom: bbox.bottom,
    })

    const gridActor = new Actor({ pos: Vector.Zero })
    gridActorRef.current = gridActor
    gridActor.graphics.onPostDraw = (ctx: ExcaliburGraphicsContext) => {
      grid.render(ctx)
    }
    gridActor.onPreUpdate = (_engine, elapsed) => {
      cameraController.update(elapsed)
    }
    scene.add(gridActor)

    const cameraController = new CameraController(scene.camera, engine.input, engine, bounds)
    sceneRef.current = scene
    setIsEngineReady(true)

    engine.start()

    return () => {
      setIsEngineReady(false)
      
      const currentScene = sceneRef.current
      if (currentScene) {
        // Clean up agents
        const currentAgentsMap = agentsMapRef.current
        for (const sprite of currentAgentsMap.values()) {
          currentScene.remove(sprite)
        }
        currentAgentsMap.clear()

        // Clean up grid actor
        if (gridActorRef.current) {
          currentScene.remove(gridActorRef.current)
          gridActorRef.current = null
        }
      }

      if (engineRef.current) {
        engineRef.current.stop()
        engineRef.current = null
      }
      sceneRef.current = null
      gridRef.current = null
    }
  }, [])

  // Handle event listeners separately to avoid engine re-init
  useEffect(() => {
    if (!isEngineReady || !canvasRef.current || !gridRef.current || !engineRef.current) return

    const canvas = canvasRef.current
    const grid = gridRef.current
    const engine = engineRef.current

    const handleMouseMove = () => {
      const worldPos = engine.input.pointers.primary.lastWorldPos
      grid.setMousePosition(worldPos.x, worldPos.y)
    }

    const handleClick = async () => {
      const worldPos = engine.input.pointers.primary.lastWorldPos
      const gridPos = screenToGrid(worldPos.x, worldPos.y)
      
      if (agentsData && agentsData.length > 0) {
        try {
          await updatePosition({
            agentId: agentsData[0]._id,
            targetX: gridPos.x,
            targetY: gridPos.y,
          })
        } catch (err) {
          console.error('updatePosition error:', err)
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false
        engine.stop()
      } else {
        isVisibleRef.current = true
        engine.start()
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isEngineReady, agentsData, updatePosition])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative"
    >
      <canvas 
        ref={canvasRef}
        className="block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
