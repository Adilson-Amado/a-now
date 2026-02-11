import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ConfigStatus {
  supabaseUrl: boolean;
  supabaseKey: boolean;
  geminiKey: boolean;
}

export function ConfigCheck() {
  const [config, setConfig] = useState<ConfigStatus>({
    supabaseUrl: false,
    supabaseKey: false,
    geminiKey: false,
  });
  const [show, setShow] = useState(true);

  useEffect(() => {
    const checkConfig = () => {
      const supabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const geminiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

      setConfig({
        supabaseUrl,
        supabaseKey,
        geminiKey,
      });

      // Hide if all configured
      if (supabaseUrl && supabaseKey) {
        setTimeout(() => setShow(false), 5000);
      }
    };

    checkConfig();
  }, []);

  if (!show || (config.supabaseUrl && config.supabaseKey)) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800">Configuração Necessária</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Configure as variáveis de ambiente no Netlify:
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {config.supabaseUrl ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={config.supabaseUrl ? 'text-green-700' : 'text-red-700'}>
                  VITE_SUPABASE_URL
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {config.supabaseKey ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={config.supabaseKey ? 'text-green-700' : 'text-red-700'}>
                  VITE_SUPABASE_PUBLISHABLE_KEY
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {config.geminiKey ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={config.geminiKey ? 'text-green-700' : 'text-red-700'}>
                  VITE_GEMINI_API_KEY (opcional)
                </span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
              <strong>Como configurar:</strong><br />
              1. Vá ao dashboard Netlify<br />
              2. Site settings → Build & deploy → Environment<br />
              3. Adicione as variáveis acima
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
