import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { KeyProvider } from './context/KeyContext' // Import the provider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KeyProvider> 
      <App />
    </KeyProvider>
  </StrictMode>,
)