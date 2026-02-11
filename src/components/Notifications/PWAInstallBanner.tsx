import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function PWAInstallBanner() {
  const { t } = useTranslation();
  const { canInstall, installPWA } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showDesktopOption, setShowDesktopOption] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't show if dismissed or not installable
  if (dismissed || !canInstall) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await installPWA();
    if (installed) {
      setDismissed(true);
    }
  };

  const handleDesktopDownload = () => {
    // Create download link for desktop
    const link = document.createElement('a');
    link.href = window.location.href;
    link.download = 'a-now-Web-App.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6" />
              <div>
                <p className="font-semibold text-lg">Instale o a-now</p>
                <p className="text-sm opacity-90">
                  Tenha a melhor experiência no seu computador ou telefone
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleInstall}
                  className="bg-white text-blue-600 hover:bg-gray-100 text-sm font-medium"
                  size="sm"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  {isMobile ? 'Instalar App' : 'Adicionar à Tela Inicial'}
                </Button>
                
                {!isMobile && (
                  <Button
                    onClick={() => setShowDesktopOption(!showDesktopOption)}
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 text-sm font-medium"
                    size="sm"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Opções PC
                  </Button>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Desktop Options */}
          <AnimatePresence>
            {showDesktopOption && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/20"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-medium mb-2">📱 Instalar como App</h4>
                    <p className="text-sm opacity-90 mb-3">
                      Instale como aplicativo nativo com notificações e modo offline
                    </p>
                    <Button
                      onClick={handleInstall}
                      className="w-full bg-white text-blue-600 hover:bg-gray-100"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Instalar PWA
                    </Button>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="font-medium mb-2">💻 Baixar Versão Web</h4>
                    <p className="text-sm opacity-90 mb-3">
                      Baixe o arquivo HTML para usar offline no navegador
                    </p>
                    <Button
                      onClick={handleDesktopDownload}
                      variant="outline"
                      className="w-full border-white text-white hover:bg-white/10"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar HTML
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3 text-center">
                  <p className="text-xs opacity-75">
                    💡 Dica: A versão PWA oferece a melhor experiência com notificações e modo offline
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
