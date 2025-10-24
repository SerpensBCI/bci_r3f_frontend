import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import './CalibrationPage.css'

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
  const [lastKeyPressed, setLastKeyPressed] = useState(null)

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

  // Map keyboard keys to direction symbols
  const mapKeyToDirection = useCallback((key) => {
    switch (key) {
      case 'ArrowUp': return '↑'
      case 'ArrowDown': return '↓'
      case 'ArrowLeft': return '←'
      case 'ArrowRight': return '→'
      case ' ': return 'Rest' // Space bar for Rest
      default: return null
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

  // Analyze calibration results - study user-instruction patterns
  const analyzeCalibrationResults = useCallback((results) => {
    console.log('=== CALIBRATION ANALYSIS: USER-INSTRUCTION PATTERNS ===')
    console.log(`Total Trials: ${results.length}`)
    
    // Study user-instruction patterns
    console.log('\n--- USER-INSTRUCTION PATTERN ANALYSIS ---')
    results.forEach((result, index) => {
      console.log(`Trial ${result.trial}: Required=${result.requiredDirection} → User=${result.userDirection} (${result.isCorrect ? 'CORRECT' : 'INCORRECT'})`)
    })
    
    // Analyze user response patterns by required direction
    console.log('\n--- USER RESPONSE PATTERNS BY REQUIRED DIRECTION ---')
    const responsePatterns = {}
    DIRECTIONS.forEach(requiredDir => {
      const trials = results.filter(r => r.requiredDirection === requiredDir)
      if (trials.length > 0) {
        const userResponses = trials.map(t => t.userDirection)
        const responseCounts = {}
        userResponses.forEach(response => {
          responseCounts[response] = (responseCounts[response] || 0) + 1
        })
        
        responsePatterns[requiredDir] = responseCounts
        console.log(`When required ${requiredDir}:`)
        Object.entries(responseCounts).forEach(([response, count]) => {
          const percentage = (count / trials.length) * 100
          console.log(`  User responded ${response}: ${count}/${trials.length} (${percentage.toFixed(1)}%)`)
        })
      }
    })
    
    // Find most common user responses
    console.log('\n--- MOST COMMON USER RESPONSES ---')
    const allUserResponses = results.map(r => r.userDirection)
    const responseCounts = {}
    allUserResponses.forEach(response => {
      responseCounts[response] = (responseCounts[response] || 0) + 1
    })
    
    const sortedResponses = Object.entries(responseCounts)
      .sort(([,a], [,b]) => b - a)
    
    sortedResponses.forEach(([response, count]) => {
      const percentage = (count / results.length) * 100
      console.log(`${response}: ${count}/${results.length} (${percentage.toFixed(1)}%)`)
    })
    
    // Analyze confusion patterns
    console.log('\n--- CONFUSION PATTERNS ---')
    const confusionMatrix = {}
    DIRECTIONS.forEach(required => {
      confusionMatrix[required] = {}
      DIRECTIONS.forEach(userResponse => {
        confusionMatrix[required][userResponse] = 0
      })
    })
    
    results.forEach(result => {
      confusionMatrix[result.requiredDirection][result.userDirection]++
    })
    
    console.log('Confusion Matrix (Required → User):')
    DIRECTIONS.forEach(required => {
      console.log(`  ${required}:`)
      DIRECTIONS.forEach(userResp => {
        const count = confusionMatrix[required][userResp]
        if (count > 0) {
          const percentage = (count / results.filter(r => r.requiredDirection === required).length) * 100
          console.log(`    → ${userResp}: ${count} (${percentage.toFixed(1)}%)`)
        }
      })
    })
    
    // Calculate overall accuracy
    const correctTrials = results.filter(r => r.isCorrect).length
    const overallAccuracy = (correctTrials / results.length) * 100
    console.log(`\nOverall Accuracy: ${overallAccuracy.toFixed(1)}%`)
    
    console.log('=== END CALIBRATION ANALYSIS ===')
  }, [])

  // Handle trial completion
  const handleTrialComplete = useCallback(() => {
    const requiredDirection = currentTrialDirection // Use the stored trial direction
    const userDirection = userInputRef.current ?? 'Rest'
    const isCorrect = userDirection === requiredDirection
    
    // Store trial result
    const trialResult = {
      trial: currentTrial,
      requiredDirection,
      userDirection,
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
    console.log(`  Captured Key (userDirection): ${userDirection}`)
    
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
        // Analyze calibration results before transitioning to training
        const finalResults = [...calibrationResults, trialResult]
        analyzeCalibrationResults(finalResults)
        
        setMode('training')
        setCurrentTrial(1) // Start training with trial 1, not 0
        setFeedback('Calibration complete. Starting training with sensory guidance.')
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
  }, [mode, currentTrial, totalTrials, accuracyThreshold, simulateAccuracy, simulateUserDirection, triggerShake, currentTrialDirection, currentDirection, calibrationResults, analyzeCalibrationResults])

  // Start calibration/training
  const startSession = () => {
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

  // Capture user directional input (arrow keys and space) during a running, unpaused session
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isRunning || isPaused) return
      const mapped = mapKeyToDirection(e.key)
      if (mapped) {
        userInputRef.current = mapped
        setLastKeyPressed(mapped)
        // Prevent the page from scrolling with arrow keys/space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isRunning, isPaused, mapKeyToDirection])

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
      <div className="calibration-container">
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
                Perform motor imagery as indicated. No feedback will be provided. Use arrow keys to respond (Space = Rest).
              </p>
            ) : (
              <p className="instruction-text">
                Now training with sensory guidance. Focus on the indicated direction. Use arrow keys to respond (Space = Rest).
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

        {/* Direction Display */}
        <div className="direction-section">
          <div className="direction-cue">
            <div className="direction-arrow">{currentDirection}</div>
            <div className="direction-label">{DIRECTION_LABELS[currentDirection]}</div>
          </div>
        </div>

        {/* Feedback Display */}
        {feedback && (
          <div className="feedback-section">
            <p className={`feedback-text ${mode === 'training' && feedback.includes('Try Again') ? 'error' : 'success'}`}>
              {feedback}
            </p>
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
