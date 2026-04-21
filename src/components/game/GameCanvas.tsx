import { useEffect, useRef } from 'react'
import { Engine, Scene, Actor, Color, Vector, BoundingBox } from 'excalibur'
import type { ExcaliburGraphicsContext } from 'excalibur'
import { IsometricGrid } from './IsometricGrid'
import { CameraController } from './Camera'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef<IsometricGrid | null>(null)
  const cameraControllerRef = useRef<CameraController | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Create Excalibur engine
    const engine = new Engine({
      canvasElement: canvasRef.current,
      viewport: { width: 800, height: 600 },
      backgroundColor: Color.fromHex('#0f172a'), // dark slate
    })

    // Create a scene for the game
    const scene = new Scene()
    engine.addScene('game', scene)
    engine.goToScene('game')

    // Create isometric grid renderer
    const grid = new IsometricGrid({
      width: 64,
      height: 64,
      tileWidth: 32,
      tileHeight: 16,
    })
    gridRef.current = grid

    // Compute grid bounding box for camera limits
    const bbox = grid.getBoundingBox()
    const bounds = new BoundingBox({
      left: bbox.left,
      right: bbox.right,
      top: bbox.top,
      bottom: bbox.bottom,
    })
    // Create camera controller
    const cameraController = new CameraController(scene.camera, engine.input, engine, bounds)
    cameraControllerRef.current = cameraController

    // Create an actor that draws the grid each frame and updates camera
    const gridActor = new Actor({
      pos: Vector.Zero,
    })
    gridActor.graphics.onPostDraw = (ctx: ExcaliburGraphicsContext) => {
      grid.render(ctx)
    }
    gridActor.onPreUpdate = (_engine, elapsed) => {
      cameraController.update(elapsed)
    }
    scene.add(gridActor)

    // Mouse move handler to update hovered tile (for hover effect)
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const scaleX = canvasRef.current.width / rect.width
      const scaleY = canvasRef.current.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      grid.setMousePosition(x, y)
    }
    canvasRef.current.addEventListener('mousemove', handleMouseMove)

    // Start the engine
    engine.start()

    // Cleanup
    return () => {
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      engine.stop()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}