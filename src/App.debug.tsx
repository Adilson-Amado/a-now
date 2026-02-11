import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>a-now AI - Debug Mode</h1>
      <p>✅ React está funcionando!</p>
      <p>🌐 Ambiente: {import.meta.env.MODE}</p>
      <p>🔗 URL Base: {window.location.origin}</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Status Check:</h3>
        <p>✅ Componente renderizado</p>
        <p>✅ Estilos aplicados</p>
        <p>✅ Variáveis de ambiente: {import.meta.env.VITE_SUPABASE_URL ? 'OK' : 'Missing'}</p>
      </div>
    </div>
  );
}

export default App;
