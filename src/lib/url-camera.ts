/**
 * URL camera state parsing utilities for shareable camera views.
 *
 * Parses URL search params to derive camera target position and zoom.
 * Used by GameCanvas on mount to restore camera state from the URL.
 */

export interface CameraUrlParams {
  focusAgentId?: string
  zoom?: number
  centerGridX?: number
  centerGridY?: number
}

/**
 * Parse camera-related URL parameters from a URLSearchParams instance.
 * Returns an object with optional focusAgentId, zoom, centerGridX, centerGridY.
 */
export function parseCameraUrlParams(searchParams: URLSearchParams): CameraUrlParams {
  const params: CameraUrlParams = {}

  const focus = searchParams.get('focus')
  if (focus !== null) {
    params.focusAgentId = focus
  }

  const zoom = searchParams.get('zoom')
  if (zoom !== null) {
    const parsed = parseFloat(zoom)
    if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2) {
      params.zoom = parsed
    }
  }

  const cx = searchParams.get('cx')
  const cy = searchParams.get('cy')
  if (cx !== null && cy !== null) {
    const parsedCx = parseInt(cx, 10)
    const parsedCy = parseInt(cy, 10)
    if (!isNaN(parsedCx) && !isNaN(parsedCy)) {
      params.centerGridX = parsedCx
      params.centerGridY = parsedCy
    }
  }

  return params
}

/**
 * Get camera URL params from the current window location.
 */
export function getCameraUrlParamsFromWindow(): CameraUrlParams {
  return parseCameraUrlParams(new URLSearchParams(window.location.search))
}

/**
 * Build a URL search string from camera state (zoom, center grid coords).
 * Clears ?focus if present (manual pan clears focus).
 * Used when writing camera state back to the URL on pan/zoom.
 */
export function buildCameraUrlSearchString(
  zoom: number,
  centerGridX: number,
  centerGridY: number
): string {
  const params = new URLSearchParams(window.location.search)

  // Remove focus param (manual pan/zoom clears agent focus)
  params.delete('focus')

  // Round zoom to 2 decimal places
  params.set('zoom', Math.round(zoom * 100) / 100 + '')

  // Set center grid coordinates
  params.set('cx', Math.round(centerGridX) + '')
  params.set('cy', Math.round(centerGridY) + '')

  return params.toString()
}
