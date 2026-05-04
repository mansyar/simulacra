import { useEffect, useRef, useState } from 'react'
import { getCameraUrlParamsFromWindow, buildCameraUrlSearchString } from './url-camera'
import type { CameraUrlParams } from './url-camera'
import { gridToScreen, screenToGrid } from './isometric'
import type { CameraController } from '../components/game/Camera'

const OFFSET_X = 1024
const OFFSET_Y = 50

export function useUrlCamera(
  isReady: boolean,
  agentsData: Array<{ _id: string; gridX: number; gridY: number }> | undefined,
  cameraRef: React.MutableRefObject<CameraController | null>,
  cameraStateRef: React.MutableRefObject<{
    positionX: number
    positionY: number
    scaleX: number
    viewportWidth: number
    viewportHeight: number
  }>,
  appScreenRef: React.MutableRefObject<{ width: number; height: number } | null>
) {
  const [urlParamsApplied, setUrlParamsApplied] = useState(false)
  const urlParamsRef = useRef<CameraUrlParams | null>(null)
  const lastUrlStateRef = useRef({ posX: 0, posY: 0, zoom: 0 })

  // Read URL camera params once on mount
  useEffect(() => {
    urlParamsRef.current = getCameraUrlParamsFromWindow()
  }, [])

  // Apply URL camera params on mount (once agentsData is ready)
  useEffect(() => {
    if (!isReady || !agentsData || !appScreenRef.current) return
    if (urlParamsApplied) return

    const urlParams = urlParamsRef.current
    if (!urlParams) return

    const camera = cameraRef.current
    if (!camera) return

    const viewportWidth = appScreenRef.current.width
    const viewportHeight = appScreenRef.current.height

    // Priority 1: focus agent
    if (urlParams.focusAgentId) {
      const targetAgent = agentsData.find(a => a._id === urlParams.focusAgentId)
      if (targetAgent) {
        const { x: worldX, y: worldY } = gridToScreen(targetAgent.gridX, targetAgent.gridY)
        camera.lookAt(worldX + OFFSET_X, worldY + OFFSET_Y, viewportWidth, viewportHeight)
      }
    }
    // Priority 2: center grid coords
    else if (urlParams.centerGridX !== undefined && urlParams.centerGridY !== undefined) {
      const { x: worldX, y: worldY } = gridToScreen(urlParams.centerGridX, urlParams.centerGridY)
      camera.lookAt(worldX + OFFSET_X, worldY + OFFSET_Y, viewportWidth, viewportHeight)
    }

    // Apply zoom after positioning
    if (urlParams.zoom !== undefined) {
      camera.setZoom(urlParams.zoom)
    }

    setUrlParamsApplied(true)
  }, [isReady, agentsData, urlParamsApplied])

  // Debounced write-back: Write camera state to URL on pan/zoom (500ms debounce)
  useEffect(() => {
    if (!isReady) return

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
}
