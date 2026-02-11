import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA disabled for Netlify
// if (import.meta.env.PROD && 'serviceWorker' in navigator && !import.meta.env.VITE_DISABLE_PWA) {
//   try {
//     const { registerSW } = await import('virtual:pwa-register');
//     registerSW({ immediate: true });
//   } catch (error) {
//     console.log('PWA registration skipped:', error);
//   }
// }

// Ensure DOM is ready
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);
