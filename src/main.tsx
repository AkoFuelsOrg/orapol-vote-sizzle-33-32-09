
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check for user's preferred color scheme or saved preference
const darkModePreference = localStorage.getItem('theme');
if (darkModePreference === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
