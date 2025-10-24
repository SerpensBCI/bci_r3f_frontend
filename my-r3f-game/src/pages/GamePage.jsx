import { useState } from 'react'
import { Link } from 'react-router-dom'
import App from '../App'
import Intro from '../intro'
import './GamePage.css'

export default function GamePage() {
  const [showHeader, setShowHeader] = useState(true)

  return (
    <div className="game-page">
      {showHeader && (
        <div className="game-header">
          <Link to="/" className="back-button">
            ← Back to Home
          </Link>
          <h1 className="game-title">Ping Pong Game</h1>
        </div>
      )}
      
      <div className="game-container">
        <Intro onGameStart={() => setShowHeader(false)} onGameEnd={() => setShowHeader(true)}>
          <App />
        </Intro>
      </div>
    </div>
  )
}
