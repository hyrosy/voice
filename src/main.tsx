import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n'; // <-- Add this import
import React from 'react';
import ReactDOM from 'react-dom';

// --- ADD THIS LOGIC ---
// This logic ensures the theme is applied before React renders
// and sets the border color directly to fix the mobile bug.
const root = window.document.documentElement;
const isDark = localStorage.getItem('theme') !== 'light';

if (isDark) {
  root.classList.add('dark');
  // This is the new line that fixes the border
  document.body.style.borderColor = 'hsl(217 33% 27%)'; // Your dark border color
} else {
  root.classList.remove('dark');
  // This sets the light border color
  document.body.style.borderColor = 'hsl(214.3 31.8% 91.4%)'; // Your light border color
}
// --- END OF NEW LOGIC ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
