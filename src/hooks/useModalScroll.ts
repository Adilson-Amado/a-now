import { useEffect, useRef } from 'react';

/**
 * Hook para prevenir rolagem do body quando modal está aberto em dispositivos móveis
 */
export function useModalScroll(isOpen: boolean) {
  const scrollPosition = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleModalOpen = () => {
      // Salvar posição atual do scroll
      scrollPosition.current = window.scrollY;
      
      // Prevenir rolagem do body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-modal-open', 'true');
    };

    const handleModalClose = () => {
      // Restaurar rolagem do body
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.body.removeAttribute('data-modal-open');
      
      // Restaurar posição do scroll
      window.scrollTo(0, scrollPosition.current);
    };

    if (isOpen) {
      handleModalOpen();
    } else {
      handleModalClose();
    }

    // Cleanup ao desmontar
    return () => {
      handleModalClose();
    };
  }, [isOpen]);

  // Cleanup automático ao desmontar
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.removeAttribute('data-modal-open');
      }
    };
  }, []);
}
