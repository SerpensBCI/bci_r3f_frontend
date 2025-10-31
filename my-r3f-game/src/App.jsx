import * as THREE from "three"
import { useCallback, useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Text, useGLTF, useTexture } from "@react-three/drei"
import { Physics, RigidBody, CylinderCollider, CuboidCollider, BallCollider } from "@react-three/rapier"
import { EffectComposer, N8AO, TiltShift2, ToneMapping } from "@react-three/postprocessing"
import { proxy, useSnapshot } from "valtio"
import clamp from "lodash-es/clamp"
import { easing } from "maath"
import { useLocation } from "react-router-dom"
import pingSound from "./resources/ping.mp3"
import logo from "./resources/crossp.jpg"
import bg from "./resources/bg.jpg"
import { getDifficultySettings, getPhysicsSettings, getRenderingSettings, getUISettings, getControlSettings } from "./gameConfig"
import DebugPanel from "./DebugPanel"
import { useControlStream } from "./hooks/useControlStream"
import { FPSOverlay } from "./components/FPSOverlay"

const ping = new Audio(pingSound)
export const state = proxy({
  count: 0,
  api: {
    pong(velocity) {
      const audioSettings = getControlSettings().MOUSE
      const volumeRange = { MIN: 0, MAX: 1, VELOCITY_DIVISOR: 20 }
      const scoreThreshold = 10
      
      ping.currentTime = 0
      ping.volume = clamp(velocity / volumeRange.VELOCITY_DIVISOR, volumeRange.MIN, volumeRange.MAX)
      ping.play()
      if (velocity > scoreThreshold) ++state.count
    },
    reset: () => (state.count = 0),
  },
})

export default function App({ ready, difficulty = 'medium', onRestart, onHome }) {
  const location = useLocation()
  const isDebugMode = location.pathname.includes('/debug')
  const [isPaused, setIsPaused] = useState(false)
  const [debugSettings, setDebugSettings] = useState({})
  const [fpsData, setFpsData] = useState({ current: 0, average: 0, frameCount: 0 })
  const [showFPS, setShowFPS] = useState(true)
  const controlStream = useControlStream()
  
  // Use configuration system to get settings
  const baseSettings = ready ? getDifficultySettings(difficulty) : getDifficultySettings('medium')
  const basePhysicsSettings = ready ? getPhysicsSettings(difficulty) : getPhysicsSettings('medium')
  const baseRenderingSettings = getRenderingSettings()
  const baseUISettings = getUISettings()
  const baseControlSettings = getControlSettings()
  
  // Helper function to merge debug settings
  const mergeSettings = (base, debug) => {
    if (!debug) return base
    const result = { ...base }
    
    for (const key in debug) {
      if (typeof debug[key] === 'object' && debug[key] !== null && !Array.isArray(debug[key])) {
        result[key] = mergeSettings(base[key] || {}, debug[key])
      } else {
        result[key] = debug[key]
      }
    }
    
    return result
  }
  
  // Merge debug settings
  const settings = mergeSettings(baseSettings, debugSettings.settings)
  const physicsSettings = mergeSettings(basePhysicsSettings, debugSettings.physicsSettings)
  const renderingSettings = mergeSettings(baseRenderingSettings, debugSettings.renderingSettings)
  const uiSettings = mergeSettings(baseUISettings, debugSettings.uiSettings)
  const controlSettings = mergeSettings(baseControlSettings, debugSettings.controlSettings)
  useEffect(() => {
    if (ready && !isPaused && controlSettings.MOUSE.HIDE_DURING_GAME) {
      // Game is running and not paused - hide cursor
      document.body.style.cursor = 'none'
    } else {
      // Game not ready or paused - show cursor
      document.body.style.cursor = 'auto'
    }
    
    // Cleanup function to restore cursor when component unmounts
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [ready, isPaused, controlSettings.MOUSE.HIDE_DURING_GAME])
  
  // ESC key listener
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === controlSettings.KEYBOARD.PAUSE_KEY && ready) {
        setIsPaused(prev => {
          const newPaused = !prev
          if (newPaused && controlSettings.MOUSE.SHOW_WHEN_PAUSED) {
            // Show mouse when paused
            document.body.style.cursor = 'auto'
          } else if (!newPaused && controlSettings.MOUSE.HIDE_DURING_GAME) {
            // Hide mouse when resuming
            document.body.style.cursor = 'none'
          }
          return newPaused
        })
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [ready, controlSettings.KEYBOARD.PAUSE_KEY, controlSettings.MOUSE.SHOW_WHEN_PAUSED, controlSettings.MOUSE.HIDE_DURING_GAME])

  const handleRestart = () => {
    state.api.reset()
    setIsPaused(false)
    if (onRestart) onRestart()
  }
  
  const handleHome = () => {
    if (onHome) onHome()
  }
  
  const handleContinue = () => {
    setIsPaused(false)
  }
  
  // Handle FPS data updates
  const handleFPSUpdate = (fps) => {
    setFpsData(fps)
  }
  
  // Handle FPS toggle
  const handleFPSToggle = (value) => {
    setShowFPS(value)
  }
  
  // Handle debug settings changes
  const handleDebugSettingsChange = (category, key, value) => {
    setDebugSettings(prev => {
      const newSettings = { ...prev }
      
      if (!newSettings[category]) {
        newSettings[category] = {}
      }
      
      // Handle nested keys (e.g., 'ball.RESTITUTION')
      if (key.includes('.')) {
        const keys = key.split('.')
        let current = newSettings[category]
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {}
          }
          current = current[keys[i]]
        }
        
        current[keys[keys.length - 1]] = value
      } else {
        newSettings[category][key] = value
      }
      
      return newSettings
    })
  }
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    {/* FPS Overlay - HTML overlay not affected by 3D effects - only shown in debug mode */}
    <FPSOverlay 
      enabled={ready && showFPS && isDebugMode} 
      updateInterval={1000} 
      label="Ping Pong Game" 
      onFPSUpdate={handleFPSUpdate}
    />
    
    {/* Debug panel - only shown when game is ready AND URL contains /debug */}
    {ready && isDebugMode && (
      <DebugPanel
        difficulty={difficulty}
        settings={settings}
        physicsSettings={physicsSettings}
        renderingSettings={renderingSettings}
        uiSettings={uiSettings}
        controlSettings={controlSettings}
        controlStream={controlStream}
        fpsData={fpsData}
        showFPS={showFPS}
        onSettingsChange={handleDebugSettingsChange}
        onFPSToggle={handleFPSToggle}
      />
    )}
      
      <Canvas 
        shadows 
        dpr={[1, 1.5]} 
        gl={{ antialias: false }} 
        camera={{ 
          position: renderingSettings.CAMERA.POSITION, 
          fov: renderingSettings.CAMERA.FOV 
        }}
      >
        <color attach="background" args={[renderingSettings.BACKGROUND.COLOR]} />
        <ambientLight intensity={renderingSettings.LIGHTING.AMBIENT_INTENSITY} />
        <spotLight 
          decay={renderingSettings.LIGHTING.SPOTLIGHT.DECAY} 
          position={renderingSettings.LIGHTING.SPOTLIGHT.POSITION} 
          angle={renderingSettings.LIGHTING.SPOTLIGHT.ANGLE} 
          penumbra={renderingSettings.LIGHTING.SPOTLIGHT.PENUMBRA} 
          intensity={renderingSettings.LIGHTING.SPOTLIGHT.INTENSITY} 
          castShadow 
          shadow-mapSize={renderingSettings.LIGHTING.SPOTLIGHT.SHADOW_MAP_SIZE} 
          shadow-bias={renderingSettings.LIGHTING.SPOTLIGHT.SHADOW_BIAS} 
        />
        <Physics 
          gravity={isPaused ? [0, 0, 0] : physicsSettings.gravity} 
          timeStep={physicsSettings.timeStep} 
          paused={isPaused}
        >
          {ready && <Ball position={[0, 5, 0]} difficulty={difficulty} settings={settings} physicsSettings={physicsSettings} />}
          <Paddle difficulty={difficulty} settings={settings} physicsSettings={physicsSettings} controlStream={controlStream} />
        </Physics>
        <EffectComposer disableNormalPass>
          <N8AO 
            aoRadius={renderingSettings.POSTPROCESSING.N8AO.AO_RADIUS} 
            intensity={renderingSettings.POSTPROCESSING.N8AO.INTENSITY} 
          />
          <TiltShift2 blur={renderingSettings.POSTPROCESSING.TILT_SHIFT.BLUR} />
          <ToneMapping />
        </EffectComposer>
        <Bg />
      </Canvas>
      
      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-menu">
            <h2 className="pause-title">{uiSettings.PAUSE_MENU.TITLE}</h2>
            <div className="pause-buttons">
              <button className="pause-btn continue" onClick={handleContinue}>
                {uiSettings.PAUSE_MENU.BUTTONS.CONTINUE}
              </button>
              <button className="pause-btn restart" onClick={handleRestart}>
                {uiSettings.PAUSE_MENU.BUTTONS.RESTART}
              </button>
              <button className="pause-btn home" onClick={handleHome}>
                {uiSettings.PAUSE_MENU.BUTTONS.HOME}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Paddle({ vec = new THREE.Vector3(), dir = new THREE.Vector3(), difficulty, settings, physicsSettings, controlStream }) {
  const api = useRef()
  const model = useRef()
  const { count } = useSnapshot(state)
  const { nodes, materials } = useGLTF("/pingpong.glb")
  const contactForce = useCallback((payload) => {
    // Only show score and play sound in hard mode
    if (settings.gameMode === 'pong_with_score') {
      state.api.pong(payload.totalForceMagnitude / 100)
    }
    model.current.position.y = -payload.totalForceMagnitude / 10000
  }, [settings.gameMode])
  
  useFrame((state, delta) => {
    const paddleMovement = { CAMERA_FOLLOW_SPEED: 0.3, PADDLE_EASING_SPEED: 0.2, ROTATION_FACTOR: Math.PI / 10 }
    const cameraOffset = { X_MULTIPLIER: 4, Y_BASE: 2.5, Y_MULTIPLIER: 4, Z: 12 }
    
    // Use control stream data if available and connected, otherwise fall back to mouse
    const controlX = controlStream?.state?.connection === 'open' ? controlStream.state.smoothedControlX : state.pointer.x
    const controlY = state.pointer.y // Keep Y control from mouse for now
    
    // Calculate paddle position based on difficulty
    if (settings.horizontalOnly) {
      // Easy mode: only horizontal movement
      vec.set(controlX * settings.paddleSensitivity, 0, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      api.current?.setNextKinematicTranslation({ x: vec.x, y: 0, z: 0 })
      api.current?.setNextKinematicRotation({ x: 0, y: 0, z: controlX * paddleMovement.ROTATION_FACTOR, w: 1 })
    } else {
      // Medium and Hard modes: full movement
      vec.set(controlX * settings.paddleSensitivity, controlY * settings.paddleSensitivity, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      api.current?.setNextKinematicTranslation({ x: vec.x, y: vec.y, z: 0 })
      api.current?.setNextKinematicRotation({ x: 0, y: 0, z: controlX * paddleMovement.ROTATION_FACTOR, w: 1 })
    }
    
    easing.damp3(model.current.position, [0, 0, 0], paddleMovement.PADDLE_EASING_SPEED, delta)
    easing.damp3(state.camera.position, [
      -controlX * cameraOffset.X_MULTIPLIER, 
      cameraOffset.Y_BASE + -controlY * cameraOffset.Y_MULTIPLIER, 
      cameraOffset.Z
    ], paddleMovement.CAMERA_FOLLOW_SPEED, delta)
    state.camera.lookAt(0, 0, 0)
  })
  return (
    <RigidBody 
      ccd={physicsSettings.paddle.CCD} 
      canSleep={physicsSettings.paddle.CAN_SLEEP} 
      ref={api} 
      type="kinematicPosition" 
      colliders={false} 
      onContactForce={contactForce}
    >
      <CylinderCollider args={physicsSettings.paddle.CYLINDER_COLLIDER} />
      <group ref={model} position={[0, 2, 0]} scale={0.15}>
        {settings.showScore && (
          <Text 
            anchorX="center" 
            anchorY="middle" 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 1, 0]} 
            fontSize={10} 
            children={count} 
          />
        )}
        <group rotation={[1.88, -0.35, 2.32]} scale={[2.97, 2.97, 2.97]}>
          <primitive object={nodes.Bone} />
          <primitive object={nodes.Bone003} />
          <primitive object={nodes.Bone006} />
          <primitive object={nodes.Bone010} />
          <skinnedMesh castShadow receiveShadow material={materials.glove} material-roughness={1} geometry={nodes.arm.geometry} skeleton={nodes.arm.skeleton} />
        </group>
        <group rotation={[0, -0.04, 0]} scale={141.94}>
          <mesh castShadow receiveShadow material={materials.wood} geometry={nodes.mesh.geometry} />
          <mesh castShadow receiveShadow material={materials.side} geometry={nodes.mesh_1.geometry} />
          <mesh castShadow receiveShadow material={materials.foam} geometry={nodes.mesh_2.geometry} />
          <mesh castShadow receiveShadow material={materials.lower} geometry={nodes.mesh_3.geometry} />
          <mesh castShadow receiveShadow material={materials.upper} geometry={nodes.mesh_4.geometry} />
        </group>
      </group>
    </RigidBody>
  )
}

function Ball(props) {
  const api = useRef()
  const map = useTexture(logo)
  const { viewport } = useThree()
  const { difficulty, settings, physicsSettings } = props
  const onCollisionEnter = useCallback(() => {
    if (settings.gameMode === 'pong_with_score') {
      // Hard mode: traditional pong with scoring
      state.api.reset()
      api.current.setTranslation({ x: 0, y: 5, z: 0 })
      api.current.setLinvel({ x: 0, y: settings.ballSpeed, z: 0 })
    } else {
      // Easy and Medium modes: reset ball position but don't reset score
      api.current.setTranslation({ x: 0, y: 5, z: 0 })
      api.current.setLinvel({ x: 0, y: settings.ballSpeed, z: 0 })
    }
  }, [settings.ballSpeed, settings.gameMode])
  return (
    <group {...props}>
      <RigidBody 
        ccd={physicsSettings.ball.CCD} 
        ref={api} 
        angularDamping={physicsSettings.ball.ANGULAR_DAMPING} 
        restitution={physicsSettings.ball.RESTITUTION} 
        canSleep={physicsSettings.ball.CAN_SLEEP} 
        colliders={false} 
        enabledTranslations={[true, true, false]}
      >
        <BallCollider args={[physicsSettings.ball.RADIUS]} />
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[physicsSettings.ball.RADIUS, physicsSettings.ball.GEOMETRY_SEGMENTS, physicsSettings.ball.GEOMETRY_SEGMENTS]} />
          <meshStandardMaterial map={map} />
        </mesh>
      </RigidBody>
      <RigidBody 
        type="fixed" 
        colliders={false} 
        position={[0, -viewport.height * 2, 0]} 
        restitution={physicsSettings.boundaries.RESTITUTION} 
        onCollisionEnter={onCollisionEnter}
      >
        <CuboidCollider args={[physicsSettings.boundaries.SIZE, physicsSettings.boundaries.THICKNESS, physicsSettings.boundaries.SIZE]} />
      </RigidBody>
      <RigidBody 
        type="fixed" 
        colliders={false} 
        position={[0, viewport.height * 4, 0]} 
        restitution={physicsSettings.boundaries.RESTITUTION} 
        onCollisionEnter={onCollisionEnter}
      >
        <CuboidCollider args={[physicsSettings.boundaries.SIZE, physicsSettings.boundaries.THICKNESS, physicsSettings.boundaries.SIZE]} />
      </RigidBody>
    </group>
  )
}

function Bg() {
  const texture = useTexture(bg)
  const renderingSettings = getRenderingSettings()
  return (
    <mesh rotation={renderingSettings.BACKGROUND.ROTATION} scale={renderingSettings.BACKGROUND.SCALE}>
      <sphereGeometry />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}
