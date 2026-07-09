import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { enableDemoMode, isDemoQuery } from './lib/demoMode'

if (isDemoQuery()) {
  enableDemoMode()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
