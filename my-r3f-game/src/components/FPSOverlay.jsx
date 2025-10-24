import { useRef, useEffect } from 'react'

/**
 * HTML overlay FPS display component
 * Shows FPS information as HTML overlay, not affected by 3D rendering effects
 */
export function FPSOverlay({ enabled = true, updateInterval = 1000, label = 'Ping Pong Game', onFPSUpdate }) {
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const fpsRef = useRef(0)
  const lastUpdateTime = useRef(performance.now())
  const displayFPS = useRef(0)
  const displayAverageFPS = useRef(0)

  useEffect(() => {
    if (!enabled) return

    let animationId
    const updateFPS = () => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime.current
      
      frameCount.current++
      
      // Calculate FPS every frame
      if (deltaTime > 0) {
        fpsRef.current = 1000 / deltaTime
      }
      
      lastTime.current = currentTime
      
      // Update FPS display at specified interval
      if (currentTime - lastUpdateTime.current >= updateInterval) {
        const averageFPS = frameCount.current / ((currentTime - lastUpdateTime.current) / 1000)
        
        // Update display values
        displayFPS.current = fpsRef.current
        displayAverageFPS.current = averageFPS
        
        // Call callback to update parent state
        if (onFPSUpdate) {
          onFPSUpdate({
            current: fpsRef.current,
            average: averageFPS,
            frameCount: frameCount.current
          })
        }
        
        // Reset counters
        frameCount.current = 0
        lastUpdateTime.current = currentTime
      }
      
      animationId = requestAnimationFrame(updateFPS)
    }
    
    animationId = requestAnimationFrame(updateFPS)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [enabled, updateInterval, onFPSUpdate])

  if (!enabled) return null

  return (
    <div 
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '16px',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        zIndex: 1000,
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      <div>{`${label}: ${displayFPS.current.toFixed(1)} FPS`}</div>
      <div>{`Avg: ${displayAverageFPS.current.toFixed(1)}`}</div>
    </div>
  )
}
