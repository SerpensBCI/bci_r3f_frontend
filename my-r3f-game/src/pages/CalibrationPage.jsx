import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import './CalibrationPage.css'

const NO_KEY_TOKEN = '__NO_KEY__'

const DIRECTIONS = ['↑', '↓', '←', '→', 'Rest']
const DIRECTION_LABELS = {
  '↑': 'Up',
  '↓': 'Down', 
  '←': 'Left',
  '→': 'Right',
  'Rest': 'Rest'
}

export default function CalibrationPage() {
  const [mode, setMode] = useState('calibration') // 'calibration' or 'training'
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentDirection, setCurrentDirection] = useState('Rest')
  const [currentTrialDirection, setCurrentTrialDirection] = useState('Rest') // Store the direction for current trial
  const [currentTrial, setCurrentTrial] = useState(0)
  const [totalTrials] = useState(10)
  const [feedback, setFeedback] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [accuracyThreshold] = useState(0.7) // 70% accuracy threshold
  const [calibrationResults, setCalibrationResults] = useState([]) // Store calibration trial results
  const shakeTimeoutRef = useRef(null)
  const userInputRef = useRef(null)
  const calibrationKeyCountsRef = useRef({}) // { [direction]: { [keyOrNoKey]: count } }
  const [learnedDirToKey, setLearnedDirToKey] = useState({}) // direction -> key (or NO_KEY_TOKEN)
  const [learnedKeyToDir, setLearnedKeyToDir] = useState({}) // key -> direction
  const [mappingReady, setMappingReady] = useState(false)
  const [mappingConflicts, setMappingConflicts] = useState(null)

  // Simulate accuracy (in real BCI, this would come from brain signal analysis)
  const simulateAccuracy = useCallback(() => {
    return Math.random() // Random accuracy between 0 and 1
  }, [])

  // Simulate user direction response (in real BCI, this would come from brain signal analysis)
  const simulateUserDirection = useCallback((requiredDirection) => {
    // Simulate user response - 70% chance of correct response
    const isCorrect = Math.random() < 0.7
    if (isCorrect) {
      return requiredDirection
    } else {
      // Return a random incorrect direction
      const incorrectDirections = DIRECTIONS.filter(dir => dir !== requiredDirection)
      return incorrectDirections[Math.floor(Math.random() * incorrectDirections.length)]
    }
  }, [])


  // Screen shake animation
  const triggerShake = useCallback(() => {
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current)
    }
    setIsShaking(true)
    shakeTimeoutRef.current = setTimeout(() => {
      setIsShaking(false)
      setFeedback('') // Clear feedback after shake ends
      shakeTimeoutRef.current = null
    }, 300)
  }, [])

  // Analyze calibration results - report key frequencies and press rate
  const analyzeCalibrationResults = useCallback((results) => {
    console.log('=== CALIBRATION ANALYSIS: USER KEY PATTERNS ===')
    console.log(`Total Trials: ${results.length}`)
    
    // Aggregate counts per required direction
    const perDirCounts = { '↑': {}, '↓': {}, '←': {}, '→': {}, 'Rest': {} }
    let pressedCount = 0
    results.forEach(r => {
      const key = r.keyPressed ?? NO_KEY_TOKEN
      perDirCounts[r.requiredDirection][key] = (perDirCounts[r.requiredDirection][key] || 0) + 1
      if (key !== NO_KEY_TOKEN) pressedCount++
    })
    
    Object.keys(perDirCounts).forEach(dir => {
      const map = perDirCounts[dir]
      const total = Object.values(map).reduce((a,b) => a+b, 0)
      if (total === 0) return
      console.log(`\nWhen required ${dir}:`)
      Object.entries(map).sort((a,b)=>b[1]-a[1]).forEach(([key,count]) => {
        const label = key === NO_KEY_TOKEN ? '(no key)' : key
        console.log(`  Key "${label}": ${count}/${total} (${(count/total*100).toFixed(1)}%)`)
      })
    })
    const overallPressRate = (pressedCount / results.length) * 100
    console.log(`\nOverall "some key pressed" rate: ${overallPressRate.toFixed(1)}%`)
    console.log('=== END CALIBRATION ANALYSIS ===')
  }, [])

  // Handle trial completion
  const handleTrialComplete = useCallback(() => {
    const requiredDirection = currentTrialDirection // Use the stored trial direction
    const rawKey = userInputRef.current // could be undefined if user didn’t press any key
    let userDirection = 'Rest'
    if (mode === 'calibration') {
      // During calibration, we only record the raw key (or no key)
      const keyOrNoKey = rawKey ?? NO_KEY_TOKEN
      // update per-direction counts
      const bag = calibrationKeyCountsRef.current[requiredDirection] || (calibrationKeyCountsRef.current[requiredDirection] = {})
      bag[keyOrNoKey] = (bag[keyOrNoKey] || 0) + 1
      // For logging compatibility, set userDirection to 'Rest' when no key, otherwise 'Unknown (learning)'
      userDirection = rawKey ? 'Unknown (learning)' : 'Rest'
    } else {
      // In training, map raw key to learned direction; if none, consider 'Unknown'
      if (rawKey) {
        userDirection = learnedKeyToDir[rawKey] || 'Unknown'
      } else {
        userDirection = 'Rest'
      }
    }
    const isCorrect = userDirection === requiredDirection
    // Store trial result
    const trialResult = {
      trial: currentTrial,
      requiredDirection,
      userDirection,
      keyPressed: rawKey || null,
      isCorrect,
      accuracyScore: isCorrect ? 100 : 0
    }
    // Verify that visual guidance matches required guidance
    const visualGuidance = currentDirection
    const guidanceMatches = visualGuidance === requiredDirection
    console.log(`Guidance Verification:`)
    console.log(`  Visual Guidance (on screen): ${visualGuidance}`)
    console.log(`  Required Guidance (stored): ${requiredDirection}`)
    console.log(`  Guidance Matches: ${guidanceMatches ? 'YES' : 'NO'}`)
    // Console logging for trial results
    console.log(`Trial ${currentTrial} Results:`)
    console.log(`  Required Direction: ${requiredDirection}`)
    console.log(`  User Direction: ${userDirection}`)
    console.log(`  Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`)
    console.log(`  Captured Key: ${rawKey ?? '(no key)'}`)
    if (mode === 'training') {
      if (!isCorrect) {
        setFeedback('Try Again - Adjust Focus')
        triggerShake()
      } else {
        setFeedback('Good! Copy previous pattern.')
      }
    } else {
      setFeedback('Trial recorded')
      // Store calibration result
      setCalibrationResults(prev => [...prev, trialResult])
    }
    // Clear current direction first
    setCurrentDirection('')
    console.log('Trial', currentTrial, 'completed. Direction cleared.')
    // Move to next trial or finish
    if (currentTrial < totalTrials) {
      setCurrentTrial(prev => prev + 1)
      // Set new direction after a brief delay
      setTimeout(() => {
        const nextDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
        userInputRef.current = null
        setCurrentDirection(nextDirection)
        setCurrentTrialDirection(nextDirection) // Store the direction for this trial
        console.log('Trial', currentTrial + 1, '- Current direction:', nextDirection)
        console.log('Guidance set - Visual:', nextDirection, 'Stored:', nextDirection)
      }, 500) // 500ms delay before showing new direction
    } else {
      // All trials completed
      if (mode === 'calibration') {
        // Derive mapping: for each direction, pick the most frequent key (or NO_KEY_TOKEN for Rest if most common)
        const dirToKey = {}
        const dirToKeyCount = {}
        Object.keys(calibrationKeyCountsRef.current).forEach(dir => {
          const entries = Object.entries(calibrationKeyCountsRef.current[dir] || {})
          if (entries.length === 0) return
          entries.sort((a,b) => b[1] - a[1])
          const [bestKey, bestCount] = entries[0]
          dirToKey[dir] = bestKey
          dirToKeyCount[dir] = bestCount
        })
        // Invert: key -> direction (resolve conflicts by keeping the direction with higher count)
        const keyToDir = {}
        const keyBestCount = {}
        Object.entries(dirToKey).forEach(([dir, key]) => {
          const count = dirToKeyCount[dir] || 0
          if (!keyToDir[key] || count > (keyBestCount[key] || 0)) {
            keyToDir[key] = dir
            keyBestCount[key] = count
          } else {
            // conflict: another direction already claimed this key with higher count
            setMappingConflicts(prev => (prev || []))
          }
        })
        setLearnedDirToKey(dirToKey)
        setLearnedKeyToDir(keyToDir)
        setMappingReady(true)
        // Show mapping summary in feedback
        const fmt = (k) => k === NO_KEY_TOKEN ? '(no key)' : `"${k}"`
        const mappingSummary = ['↑','↓','←','→','Rest'].map(d => `${d}→${fmt(dirToKey[d] ?? '?')}`).join('  ')
        setFeedback(`Calibration complete. Learned keys: ${mappingSummary}. Starting training...`)
        // Analyze calibration results before transitioning to training
        const finalResults = [...calibrationResults, trialResult]
        analyzeCalibrationResults(finalResults)
        setMode('training')
        setCurrentTrial(1) // Start training with trial 1, not 0
        // Set first training direction after delay
        setTimeout(() => {
          const nextDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
          userInputRef.current = null
          setCurrentDirection(nextDirection)
          setCurrentTrialDirection(nextDirection) // Store the direction for this trial
          console.log('Training started. Trial 1 - Current direction:', nextDirection)
          console.log('Training Guidance set - Visual:', nextDirection, 'Stored:', nextDirection)
        }, 500)
      } else {
        setIsRunning(false)
        setFeedback('Training complete!')
      }
    }
  }, [mode, currentTrial, totalTrials, accuracyThreshold, simulateAccuracy, simulateUserDirection, triggerShake, currentTrialDirection, currentDirection, calibrationResults, analyzeCalibrationResults, learnedKeyToDir])

  // Start calibration/training
  const startSession = () => {
    // Reset learned mapping and counts
    calibrationKeyCountsRef.current = { '↑': {}, '↓': {}, '←': {}, '→': {}, 'Rest': {} }
    setLearnedDirToKey({})
    setLearnedKeyToDir({})
    setMappingReady(false)
    setMappingConflicts(null)
    userInputRef.current = null
    setIsRunning(true)
    setCurrentTrial(1)
    const initialDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
    setCurrentDirection(initialDirection)
    setCurrentTrialDirection(initialDirection) // Store the direction for this trial
    console.log('Session started. Current direction:', initialDirection)
    setFeedback('')
  }

  // Reset session
  const resetSession = () => {
    setIsRunning(false)
    setIsPaused(false)
    setMode('calibration')
    setCurrentTrial(0)
    setCurrentDirection('Rest')
    setCurrentTrialDirection('Rest')
    setCalibrationResults([]) // Clear calibration results
    setFeedback('')
    setIsShaking(false)
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current)
      shakeTimeoutRef.current = null
    }
  }

  // Return to session (resume)
  const returnToSession = () => {
    setIsPaused(false)
  }

  // ESC key listener for pause menu
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isRunning) {
        setIsPaused(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isRunning])

  // Capture raw keyboard input during a running, unpaused session (no predefined mapping)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isRunning || isPaused) return
      // store first key pressed during the current trial (or overwrite to latest pressed)
      userInputRef.current = e.key
      // prevent default browser actions for common keys
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isRunning, isPaused])

  // Auto-advance trials (simulate motor imagery duration)
  useEffect(() => {
    if (isRunning && !isPaused && currentTrial > 0) {
      const timer = setTimeout(() => {
        handleTrialComplete()
      }, 3000) // 3 seconds per trial

      return () => clearTimeout(timer)
    }
  }, [isRunning, isPaused, currentTrial, handleTrialComplete])

  return (
    <div className={`calibration-page ${isShaking ? 'shaking' : ''}`}>
      <div className={`calibration-container ${isRunning ? 'with-progress' : ''}`}>
        {/* Header - only show when not running */}
        {!isRunning && (
          <header className="calibration-header">
            <h1 className="calibration-title">BCI Calibration & Training</h1>
            <Link to="/" className="home-link">← Back to Home</Link>
          </header>
        )}

        {/* Instructions - only show when not running */}
        {!isRunning && (
          <div className="instructions-section">
            {mode === 'calibration' ? (
              <p className="instruction-text">
                During calibration (first 10 trials), press the keys you prefer for each cue (e.g., WASD, IJKL, etc.). We will learn your mapping automatically. For "Rest", you may press nothing (no key) or any key you want to assign.
              </p>
            ) : (
              <p className="instruction-text">
                Now training with sensory guidance. Use the keys learned in calibration. If you press a key that wasn't learned, it will be treated as unknown.
              </p>
            )}
          </div>
        )}

        {/* Progress Indicator */}
        {isRunning && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentTrial / totalTrials) * 100}%` }}
              />
            </div>
            <p className="progress-text">Trial {currentTrial}/{totalTrials}</p>
          </div>
        )}

        {/* Direction Display - only show when running */}
        {isRunning && (
          <div className="direction-section">
            <div className="direction-cue">
              <div className="direction-arrow">{currentDirection}</div>
              <div className="direction-label">{DIRECTION_LABELS[currentDirection]}</div>
            </div>
          </div>
        )}


        {/* Control Buttons */}
        <div className="controls-section">
          {!isRunning && (
            <button 
              className="start-button" 
              onClick={startSession}
            >
              Start {mode === 'calibration' ? 'Calibration' : 'Training'}
            </button>
          )}
        </div>

        {/* Pause Menu Overlay */}
        {isPaused && (
          <div className="pause-overlay">
            <div className="pause-menu">
              <h2 className="pause-title">Session Paused</h2>
              <div className="pause-buttons">
                <button className="pause-btn return" onClick={returnToSession}>
                  Return to Session
                </button>
                <button className="pause-btn reset" onClick={resetSession}>
                  Reset Session
                </button>
                <Link to="/" className="pause-btn home">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
