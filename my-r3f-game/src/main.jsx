import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "./styles.css"
import Intro from './intro.jsx'

createRoot(document.getElementById('root')).render(
  <Intro>
    <App />
  </Intro>,
)
