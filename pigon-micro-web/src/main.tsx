import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/mobile.css'
import App from './App.tsx'
import { KeyRingProvider } from './services/KeyRingProvider.tsx'
import { CallServiceProvider } from './services/callservice/CallServiceProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <KeyRingProvider>
    <CallServiceProvider>
      <App />
    </CallServiceProvider>
  </KeyRingProvider>
)
