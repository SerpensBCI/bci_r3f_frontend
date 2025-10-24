import { useState, useEffect, useCallback } from 'react'
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
  const [currentDirection, setCurrentDirection] = useState('Rest')
  const [currentTrial, setCurrentTrial] = useState(0)
  const [totalTrials] = useState(10)
  const [feedback, setFeedback] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [accuracyThreshold] = useState(0.7) // 70% accuracy threshold

  // Simulate accuracy (in real BCI, this would come from brain signal analysis)
  const simulateAccuracy = useCallback(() => {
    return Math.random() // Random accuracy between 0 and 1
  }, [])

  // Screen shake animation
  const triggerShake = useCallback(() => {
    setIsShaking(true)
    setTimeout(() => {
      setIsShaking(false)
    }, 300)
  }, [])

  // Handle trial completion
  const handleTrialComplete = useCallback(() => {
    const accuracy = simulateAccuracy()
    
    if (mode === 'training') {
      if (accuracy < accuracyThreshold) {
        setFeedback('Try Again - Adjust Focus')
        triggerShake()
      } else {
        setFeedback('Good! Copy previous pattern.')
      }
    } else {
      setFeedback('Trial recorded')
    }

    // Move to next trial or finish
    if (currentTrial < totalTrials) {
      setCurrentTrial(prev => prev + 1)
      // Change direction for next trial
      const nextDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
      setCurrentDirection(nextDirection)
    } else {
      // All trials completed
      if (mode === 'calibration') {
        setMode('training')
        setCurrentTrial(0)
        setFeedback('Calibration complete. Starting training with sensory guidance.')
      } else {
        setIsRunning(false)
        setFeedback('Training complete!')
      }
    }
  }, [mode, currentTrial, totalTrials, accuracyThreshold, simulateAccuracy, triggerShake])

  // Start calibration/training
  const startSession = () => {
    setIsRunning(true)
    setCurrentTrial(1)
    setCurrentDirection(DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)])
    setFeedback('')
  }

  // Reset session
  const resetSession = () => {
    setIsRunning(false)
    setMode('calibration')
    setCurrentTrial(0)
    setCurrentDirection('Rest')
    setFeedback('')
    setIsShaking(false)
  }

  // Auto-advance trials (simulate motor imagery duration)
  useEffect(() => {
    if (isRunning && currentTrial > 0) {
      const timer = setTimeout(() => {
        handleTrialComplete()
      }, 3000) // 3 seconds per trial

      return () => clearTimeout(timer)
    }
  }, [isRunning, currentTrial, handleTrialComplete])

  return (
    <div className={`calibration-page ${isShaking ? 'shaking' : ''}`}>
      <div className="calibration-container">
        {/* Header */}
        <header className="calibration-header">
          <h1 className="calibration-title">BCI Calibration & Training</h1>
          <Link to="/" className="home-link">← Back to Home</Link>
        </header>

        {/* Instructions */}
        <div className="instructions-section">
          {mode === 'calibration' ? (
            <p className="instruction-text">
              Perform motor imagery as indicated. No feedback will be provided.
            </p>
          ) : (
            <p className="instruction-text">
              Now training with sensory guidance. Focus on the indicated direction.
            </p>
          )}
        </div>

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
          {!isRunning ? (
            <button 
              className="start-button" 
              onClick={startSession}
            >
              Start {mode === 'calibration' ? 'Calibration' : 'Training'}
            </button>
          ) : (
            <button 
              className="reset-button" 
              onClick={resetSession}
            >
              Reset Session
            </button>
          )}
        </div>

        {/* Mode Indicator */}
        <div className="mode-indicator">
          <div className={`mode-badge ${mode}`}>
            {mode === 'calibration' ? 'Calibration Mode' : 'Training Mode'}
          </div>
        </div>
      </div>
    </div>
  )
}
