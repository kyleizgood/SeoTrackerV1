import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register';

// Register the service worker and show a notification if a new version is available
const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm('A new version is available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // Optionally notify the user that the app is ready to work offline
    console.log('App is ready to work offline');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
    <App />
    </Router>
  </StrictMode>,
)
