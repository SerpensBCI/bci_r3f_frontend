import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import "./styles.css"
import HomePage from './pages/HomePage.jsx'
import GamePage from './pages/GamePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pingpong" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
