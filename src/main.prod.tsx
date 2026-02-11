import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA registration only if supported
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  try {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
      });
    }).catch(() => {
      console.log('PWA registration skipped');
    });
  } catch (error) {
    console.log('PWA not available');
  }
}

// Ensure DOM is ready
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);
