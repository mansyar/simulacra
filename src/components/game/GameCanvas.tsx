'use client'

import { useEffect, useRef } from 'react'
import { Engine, Scene, Actor, Color, Vector, BoundingBox } from 'excalibur'
import type { ExcaliburGraphicsContext } from 'excalibur'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { IsometricGrid } from './IsometricGrid'
import { CameraController } from './Camera'
import { AgentSprite } from './AgentSprite'
import type { AgentData } from './AgentSprite'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const agentsMapRef = useRef<Map<string, AgentSprite>>(new Map())
  const gridActorRef = useRef<Actor | null>(null)
  const isVisibleRef = useRef(true)

  const agentsData = useQuery(api.functions.agents.getAll)

  // Sync agents from database
  useEffect(() => {
    if (!sceneRef.current || !agentsData) return

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
  }, [agentsData])

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    const container = containerRef.current
    const canvas = canvasRef.current

    // Get actual container dimensions
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Create Excalibur engine with exact dimensions
    const engine = new Engine({
      canvasElement: canvas,
      viewport: { width: rect.width, height: rect.height },
      backgroundColor: Color.fromHex('#0f172a'),
      antialiasing: false, // Disable antialiasing to prevent memory issues
      pixelRatio: 1, // Force pixel ratio to prevent high-DPI memory issues
      maxFps: 60, // Limit frame rate
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

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      grid.setMousePosition(x, y)
    }
    canvas.addEventListener('mousemove', handleMouseMove)

    // Pause when tab is not visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false
        engine.stop()
      } else {
        isVisibleRef.current = true
        engine.start()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    engine.start()

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Properly clean up all actors
      const currentAgentsMap = agentsMapRef.current
      for (const sprite of currentAgentsMap.values()) {
        if (scene.world.entityManager.getById(sprite.id)) {
          scene.remove(sprite)
        }
      }
      currentAgentsMap.clear()
      
      // Remove grid actor
      if (gridActorRef.current) {
        scene.remove(gridActorRef.current)
        gridActorRef.current = null
      }
      
      // Stop engine and clear reference
      if (engineRef.current) {
        engineRef.current.stop()
        engineRef.current = null
      }
    }
  }, [])

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
