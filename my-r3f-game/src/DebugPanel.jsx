import { useControls } from 'leva'
import { useSnapshot } from 'valtio'
import { state } from './App'

export default function DebugPanel({ 
  difficulty, 
  settings, 
  physicsSettings, 
  renderingSettings, 
  uiSettings, 
  controlSettings,
  controlStream,
  fpsData,
  showFPS,
  onSettingsChange,
  onFPSToggle
}) {
  const { count } = useSnapshot(state)

  // Game state controls
  const gameControls = useControls('Game State', {
    difficulty: { 
      value: difficulty, 
      options: ['easy', 'medium', 'hard'],
      onChange: (value) => onSettingsChange?.('difficulty', value)
    }
  })

  // FPS monitoring controls
  const fpsControls = useControls('FPS Monitor', {
    showFPS: { 
      value: showFPS,
      onChange: (value) => onFPSToggle?.(value)
    }
  })

  // Physics parameter controls
  const physicsControls = useControls('Physics', {
    gravity: { 
      value: physicsSettings.gravity[1], 
      min: -20, 
      max: 0, 
      step: 0.1,
      onChange: (value) => onSettingsChange?.('physicsSettings', 'gravity', [0, value, 0])
    },
    ballRestitution: { 
      value: physicsSettings.ball.RESTITUTION, 
      min: 0, 
      max: 2, 
      step: 0.1,
      onChange: (value) => onSettingsChange?.('physicsSettings', 'ball.RESTITUTION', value)
    },
    ballRadius: { 
      value: physicsSettings.ball.RADIUS, 
      min: 0.1, 
      max: 1, 
      step: 0.01,
      onChange: (value) => onSettingsChange?.('physicsSettings', 'ball.RADIUS', value)
    }
  })

  // Rendering parameter controls
  const renderingControls = useControls('Rendering', {
    cameraFov: { 
      value: renderingSettings.CAMERA.FOV, 
      min: 30, 
      max: 120, 
      step: 1,
      onChange: (value) => onSettingsChange?.('renderingSettings', 'CAMERA.FOV', value)
    },
    ambientIntensity: { 
      value: renderingSettings.LIGHTING.AMBIENT_INTENSITY, 
      min: 0, 
      max: 2, 
      step: 0.1,
      onChange: (value) => onSettingsChange?.('renderingSettings', 'LIGHTING.AMBIENT_INTENSITY', value)
    },
    spotlightIntensity: { 
      value: renderingSettings.LIGHTING.SPOTLIGHT.INTENSITY, 
      min: 0, 
      max: 10, 
      step: 0.1,
      onChange: (value) => onSettingsChange?.('renderingSettings', 'LIGHTING.SPOTLIGHT.INTENSITY', value)
    }
  })

  // Post-processing effects controls
  const postProcessingControls = useControls('Post Processing', {
    aoRadius: { 
      value: renderingSettings.POSTPROCESSING.N8AO.AO_RADIUS, 
      min: 0, 
      max: 10, 
      step: 0.1,
      onChange: (value) => onSettingsChange?.('renderingSettings', 'POSTPROCESSING.N8AO.AO_RADIUS', value)
    },
    aoIntensity: { 
      value: renderingSettings.POSTPROCESSING.N8AO.INTENSITY, 
      min: 0, 
      max: 5, 
      step: 0.1,
      onChange: (value) => onSettingsChange?.('renderingSettings', 'POSTPROCESSING.N8AO.INTENSITY', value)
    },
    tiltShiftBlur: { 
      value: renderingSettings.POSTPROCESSING.TILT_SHIFT.BLUR, 
      min: 0, 
      max: 1, 
      step: 0.01,
      onChange: (value) => onSettingsChange?.('renderingSettings', 'POSTPROCESSING.TILT_SHIFT.BLUR', value)
    }
  })

  // Gameplay controls
  const gameplayControls = useControls('Gameplay', {
    paddleSensitivity: { 
      value: settings.paddleSensitivity, 
      min: 0.1, 
      max: 5, 
      step: 0.1,
      onChange: (value) => onSettingsChange?.('settings', 'paddleSensitivity', value)
    },
    ballSpeed: { 
      value: settings.ballSpeed, 
      min: 1, 
      max: 20, 
      step: 0.5,
      onChange: (value) => onSettingsChange?.('settings', 'ballSpeed', value)
    },
    horizontalOnly: { 
      value: settings.horizontalOnly,
      onChange: (value) => onSettingsChange?.('settings', 'horizontalOnly', value)
    },
    showScore: { 
      value: settings.showScore,
      onChange: (value) => onSettingsChange?.('settings', 'showScore', value)
    }
  })


  // Control Stream debugging
  const controlStreamControls = useControls('Control Stream', {
    enabled: { 
      value: controlStream?.isEnabled || false,
      onChange: (value) => {
        if (value && controlStream?.enable) {
          controlStream.enable();
        } else if (!value && controlStream?.disable) {
          controlStream.disable();
        }
      }
    },
    connectionStatus: { 
      value: controlStream?.state?.connection || 'unknown', 
      disabled: true 
    },
    lastControlX: { 
      value: controlStream?.state?.lastControlX || 0, 
      min: -1, 
      max: 1, 
      step: 0.01, 
      disabled: true 
    },
    smoothedControlX: { 
      value: controlStream?.state?.smoothedControlX || 0, 
      min: -1, 
      max: 1, 
      step: 0.01, 
      disabled: true 
    },
    receivedFrames: { 
      value: controlStream?.state?.receivedFrames || 0, 
      min: 0, 
      max: 10000, 
      step: 1, 
      disabled: true 
    },
    reconnectAttempts: { 
      value: controlStream?.state?.reconnectAttempts || 0, 
      min: 0, 
      max: 10, 
      step: 1, 
      disabled: true 
    },
    statusMessage: { 
      value: controlStream?.state?.statusMessage || 'No status', 
      disabled: true 
    },
    retryConnection: {
      value: false,
      onChange: (value) => {
        if (value && controlStream?.retry) {
          controlStream.retry()
        }
      }
    }
  })

  return null // Leva controls are rendered automatically
}
