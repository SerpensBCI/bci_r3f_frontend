// Game configuration file - centralized management of all game parameters
export const GAME_CONFIG = {
  // Physics settings
  PHYSICS: {
    // Gravity settings (x, y, z)
    GRAVITY: {
      EASY: [0, -60, 0],
      MEDIUM: [0, -80, 0], 
      HARD: [0, -40, 0]
    },
    
    // Time step
    TIME_STEP: "vary",
    
    // Ball physics properties
    BALL: {
      // Angular damping
      ANGULAR_DAMPING: 0.8,
      // Restitution coefficient
      RESTITUTION: 1,
      // Whether to allow sleep
      CAN_SLEEP: false,
      // Whether to enable continuous collision detection
      CCD: true,
      // Ball radius
      RADIUS: 0.5,
      // Ball geometry segments
      GEOMETRY_SEGMENTS: 64
    },
    
    // Paddle physics properties
    PADDLE: {
      // Cylinder collider parameters [height, radius]
      CYLINDER_COLLIDER: [0.15, 1.75],
      // Whether to enable continuous collision detection
      CCD: true,
      // Whether to allow sleep
      CAN_SLEEP: false
    },
    
    // Boundary colliders
    BOUNDARIES: {
      // Boundary thickness
      THICKNESS: 2,
      // Boundary size
      SIZE: 1000,
      // Boundary restitution coefficient
      RESTITUTION: 2.1
    }
  },
  
  // Gameplay settings
  GAMEPLAY: {
    // Difficulty settings
    DIFFICULTY: {
      EASY: {
        gravity: [0, -60, 0],
        ballSpeed: 5,
        paddleSensitivity: 0.5,
        horizontalOnly: true,
        showScore: false,
        gameMode: 'keep_ball_on_paddle'
      },
      MEDIUM: {
        gravity: [0, -80, 0],
        ballSpeed: 8,
        paddleSensitivity: 1.0,
        horizontalOnly: false,
        showScore: false,
        gameMode: 'keep_ball_on_paddle'
      },
      HARD: {
        gravity: [0, -40, 0],
        ballSpeed: 8,
        paddleSensitivity: 1.0,
        horizontalOnly: false,
        showScore: true,
        gameMode: 'pong_with_score'
      }
    },
    
    // Paddle movement settings
    PADDLE_MOVEMENT: {
      // Camera follow speed
      CAMERA_FOLLOW_SPEED: 0.3,
      // Paddle position easing speed
      PADDLE_EASING_SPEED: 0.2,
      // Paddle rotation factor
      ROTATION_FACTOR: Math.PI / 10,
      // Camera position offset
      CAMERA_OFFSET: {
        X_MULTIPLIER: 4,
        Y_BASE: 2.5,
        Y_MULTIPLIER: 4,
        Z: 12
      }
    },
    
    // Audio settings
    AUDIO: {
      // Audio volume range
      VOLUME_RANGE: {
        MIN: 0,
        MAX: 1,
        VELOCITY_DIVISOR: 20
      },
      // Score threshold
      SCORE_THRESHOLD: 10
    }
  },
  
  // Rendering settings
  RENDERING: {
    // Camera settings
    CAMERA: {
      POSITION: [0, 5, 12],
      FOV: 45
    },
    
    // Lighting settings
    LIGHTING: {
      // Ambient light intensity
      AMBIENT_INTENSITY: 0.5 * Math.PI,
      // Spotlight settings
      SPOTLIGHT: {
        DECAY: 0,
        POSITION: [-10, 15, -5],
        ANGLE: 1,
        PENUMBRA: 1,
        INTENSITY: 2,
        SHADOW_MAP_SIZE: 1024,
        SHADOW_BIAS: -0.0001
      }
    },
    
    // Post-processing effects settings
    POSTPROCESSING: {
      N8AO: {
        AO_RADIUS: 0.5,
        INTENSITY: 2
      },
      TILT_SHIFT: {
        BLUR: 0.2
      }
    },
    
    // Background settings
    BACKGROUND: {
      COLOR: "#f0f0f0",
      SCALE: 100,
      ROTATION: [0, Math.PI / 1.25, 0]
    }
  },
  
  // UI settings
  UI: {
    // Pause menu
    PAUSE_MENU: {
      TITLE: "Game Paused",
      BUTTONS: {
        CONTINUE: "Continue Game",
        RESTART: "Restart Game", 
        HOME: "Return to Home"
      }
    },
    
    // Score display
    SCORE: {
      FONT_SIZE: 10,
      POSITION: [0, 1, 0],
      ROTATION: [-Math.PI / 2, 0, 0]
    }
  },
  
  // Control settings
  CONTROLS: {
    // Keyboard shortcuts
    KEYBOARD: {
      PAUSE_KEY: 'Escape'
    },
    
    // Mouse settings
    MOUSE: {
      // Hide mouse during game
      HIDE_DURING_GAME: true,
      // Show mouse when paused
      SHOW_WHEN_PAUSED: true
    }
  }
}

// Helper function to get difficulty settings
export const getDifficultySettings = (difficulty = 'medium') => {
  return GAME_CONFIG.GAMEPLAY.DIFFICULTY[difficulty.toUpperCase()] || GAME_CONFIG.GAMEPLAY.DIFFICULTY.MEDIUM
}

// Helper function to get physics settings
export const getPhysicsSettings = (difficulty = 'medium') => {
  const difficultySettings = getDifficultySettings(difficulty)
  return {
    gravity: difficultySettings.gravity,
    timeStep: GAME_CONFIG.PHYSICS.TIME_STEP,
    ball: GAME_CONFIG.PHYSICS.BALL,
    paddle: GAME_CONFIG.PHYSICS.PADDLE,
    boundaries: GAME_CONFIG.PHYSICS.BOUNDARIES
  }
}

// Helper function to get rendering settings
export const getRenderingSettings = () => {
  return GAME_CONFIG.RENDERING
}

// Helper function to get UI settings
export const getUISettings = () => {
  return GAME_CONFIG.UI
}

// Helper function to get control settings
export const getControlSettings = () => {
  return GAME_CONFIG.CONTROLS
}
