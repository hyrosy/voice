import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n'; // <-- Add this import
import { ThemeProvider } from 'next-themes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme"> {/* <-- THEME PROVIDER WRAPS APP */}
      <App />
    </ThemeProvider>
  </StrictMode>
);

