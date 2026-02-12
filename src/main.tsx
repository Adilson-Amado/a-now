import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA Service Worker Registration - simplified for VitePWA
async function registerServiceWorker() {
  // Check if we're in production and PWA is enabled
  const isProd = import.meta.env.PROD;
  const pwaDisabled = (import.meta.env.VITE_DISABLE_PWA ?? '').toLowerCase() === 'true';
  
  if ('serviceWorker' in navigator && isProd && !pwaDisabled) {
    try {
      // The SW is registered automatically by vite-plugin-pwa
      // We just need to listen for updates
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('Nova versão do app disponível');
              }
            });
          }
        });
      }
    } catch (error) {
      console.log('PWA registration check skipped:', error);
    }
  }
}

// Register SW on mount
void registerServiceWorker();

// Ensure DOM is ready
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);
