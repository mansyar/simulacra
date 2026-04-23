'use client'

import { useEffect, useRef } from 'react'
import { Engine, Scene, Actor, Color, Vector, BoundingBox } from 'excalibur'
import type { ExcaliburGraphicsContext } from 'excalibur'
import { IsometricGrid } from './IsometricGrid'
import { CameraController } from './Camera'
import { AgentSprite } from './AgentSprite'
import type { PlaceholderAgent } from './AgentSprite'

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const agentsRef = useRef<AgentSprite[]>([])
  const gridActorRef = useRef<Actor | null>(null)
  const isVisibleRef = useRef(true)

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
    // Center camera on the grid
    scene.camera.pos = new Vector((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2)

    const agentColors = ['#8B4513', '#FF69B4', '#9370DB', '#228B22', '#FFA07A']
    const agentNames = ['Builder', 'Socialite', 'Philosopher', 'Explorer', 'Nurturer']

    const agents: AgentSprite[] = []
    for (let i = 0; i < 5; i++) {
      const agentData: PlaceholderAgent = {
        id: `agent_${i}`,
        name: agentNames[i],
        gridX: Math.floor(Math.random() * 64),
        gridY: Math.floor(Math.random() * 64),
        color: agentColors[i],
      }
      const agentSprite = new AgentSprite(agentData)
      agentSprite.updateGridPosition(agentData.gridX, agentData.gridY)
      scene.add(agentSprite)
      agents.push(agentSprite)
    }
    agentsRef.current = agents

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
      agentsRef.current.forEach(agent => {
        if (scene.world.entityManager.getById(agent.id)) {
          scene.remove(agent)
        }
      })
      agentsRef.current = []
      
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
