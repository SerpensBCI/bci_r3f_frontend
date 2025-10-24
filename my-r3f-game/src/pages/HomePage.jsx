import { Link } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="home-container">
        <header className="home-header">
          <h1 className="home-title">S-Neuro</h1>
        </header>
        
        <main className="home-main">
          <div className="featured-section">
            <div className="project-card">
              <div className="project-info">
                <h3>Ping Pong Game</h3>
                <p>A 3D physics-based ping pong game built with React Three Fiber</p>
                <div className="project-features">
                  <span className="feature-tag">3D Graphics</span>
                  <span className="feature-tag">Physics Engine</span>
                  <span className="feature-tag">Real-time Controls</span>
                </div>
              </div>
              <div className="project-actions">
                <Link to="/pingpong" className="play-button">
                  Play Game
                </Link>
              </div>
            </div>
            
            <div className="project-card">
              <div className="project-info">
                <h3>BCI Calibration & Training</h3>
                <p>Motor imagery brain-computer interface calibration and sensory-guided training system</p>
                <div className="project-features">
                  <span className="feature-tag">BCI Interface</span>
                  <span className="feature-tag">Motor Imagery</span>
                  <span className="feature-tag">Sensory Feedback</span>
                </div>
              </div>
              <div className="project-actions">
                <Link to="/calibration" className="play-button">
                  Start Calibration
                </Link>
              </div>
            </div>
          </div>
          
        </main>
        
        <footer className="home-footer">
          <p>&copy; 2025 This is a footer</p>
        </footer>
      </div>
    </div>
  )
}
