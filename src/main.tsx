
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

// Check if we need to refresh the home page
const shouldRefreshHome = sessionStorage.getItem('shouldRefreshHome');
if (shouldRefreshHome === 'true' && window.location.pathname === '/') {
  sessionStorage.removeItem('shouldRefreshHome');
  window.location.reload();
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
