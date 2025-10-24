import { cloneElement, useState, useEffect } from "react"
import { Footer } from "@pmndrs/branding"

export default function Intro({ children, onGameStart, onGameEnd }) {
  const [clicked, setClicked] = useState(false)
  const [difficulty, setDifficulty] = useState(null)
  const [key, setKey] = useState(0) // Key to force re-render of App component
  
  const handleDifficultySelect = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty)
    setClicked(true)
    // Call onGameStart when game actually starts (after difficulty selection and click to continue)
  }
  
  const handleRestart = () => {
    setKey(prev => prev + 1) // Force App component to re-render
    if (onGameEnd) onGameEnd() // Show header when restarting
  }
  
  const handleHome = () => {
    setClicked(false)
    setDifficulty(null)
    setKey(prev => prev + 1)
    if (onGameEnd) onGameEnd() // Show header when going home
  }
  
  const handleContinue = () => {
    setClicked(true)
    if (onGameStart) onGameStart() // Hide header when game actually starts
  }
  
  // Monitor when the game is actually running
  useEffect(() => {
    if (clicked && difficulty) {
      // Game is running, hide header
      if (onGameStart) onGameStart()
    } else if (!clicked && difficulty) {
      // Game is paused/stopped, show header
      if (onGameEnd) onGameEnd()
    }
  }, [clicked, difficulty, onGameStart, onGameEnd])
  
  return (
    <div className="container">
      {cloneElement(children, { 
        key: key,
        ready: clicked, 
        difficulty, 
        onRestart: handleRestart, 
        onHome: handleHome 
      })}
      <div className={`fullscreen bg ready"} ${clicked && "clicked"}`}>
        <div className="stack">
          {!difficulty ? (
            <div className="difficulty-selection">
              <h1 className="game-title">Ping Pong Game</h1>
              <p className="difficulty-subtitle">Choose Difficulty</p>
              <div className="difficulty-buttons">
                <button 
                  className="difficulty-btn easy" 
                  onClick={() => handleDifficultySelect('easy')}
                >
                  <div className="difficulty-title">Easy</div>
                  <div className="difficulty-desc">Horizontal movement to keep ball on paddle</div>
                </button>
                <button 
                  className="difficulty-btn medium" 
                  onClick={() => handleDifficultySelect('medium')}
                >
                  <div className="difficulty-title">Medium</div>
                  <div className="difficulty-desc">Full directional movement to keep ball on paddle</div>
                </button>
                <button 
                  className="difficulty-btn hard" 
                  onClick={() => handleDifficultySelect('hard')}
                >
                  <div className="difficulty-title">Hard</div>
                  <div className="difficulty-desc">Pong with scoring system</div>
                </button>
              </div>
            </div>
          ) : (
            <a href="#" onClick={handleContinue}>
              {"click to continue"}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
