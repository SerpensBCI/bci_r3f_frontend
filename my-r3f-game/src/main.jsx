import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import "./styles.css"
import HomePage from './pages/HomePage.jsx'
import GamePage from './pages/GamePage.jsx'
import CalibrationPage from './pages/CalibrationPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pingpong" element={<GamePage />} />
        <Route path="/calibration" element={<CalibrationPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
