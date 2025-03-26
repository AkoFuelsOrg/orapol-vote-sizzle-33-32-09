
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

// Handle redirects from 200.html
const redirect = sessionStorage.redirect;
if (redirect && redirect !== window.location.href) {
  sessionStorage.removeItem('redirect');
  window.history.replaceState(null, '', redirect);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
