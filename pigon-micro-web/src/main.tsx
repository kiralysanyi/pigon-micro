import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { KeyRingProvider } from './services/KeyRingProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <KeyRingProvider>
    <App />
  </KeyRingProvider>
)
