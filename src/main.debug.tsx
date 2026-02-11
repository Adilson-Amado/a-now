import { createRoot } from "react-dom/client";
import AppDebug from "./App.debug.tsx";
import "./index.css";

console.log('🚀 Iniciando a-now Debug Mode');
console.log('📍 Ambiente:', import.meta.env.MODE);
console.log('🌐 URL:', window.location.href);

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ Root element not found');
  throw new Error('Root element not found');
}

console.log('✅ Root element found');

try {
  createRoot(rootElement).render(<AppDebug />);
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Error rendering app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: Arial; color: red;">
      <h1>❌ Erro ao renderizar aplicação</h1>
      <p>Erro: ${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `;
}
