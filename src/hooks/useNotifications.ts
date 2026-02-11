import { toast } from 'sonner';
import { useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useNotifications = () => {
  const showNotification = useCallback((
    type: NotificationType,
    message: string,
    options?: NotificationOptions
  ) => {
    const toastOptions = {
      duration: options?.duration || (type === 'error' ? 5000 : 3000),
      position: options?.position || 'bottom-right',
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      case 'info':
        toast.info(message, toastOptions);
        break;
      default:
        toast(message, toastOptions);
    }
  }, []);

  const success = useCallback((message: string, options?: NotificationOptions) => {
    showNotification('success', message, options);
  }, [showNotification]);

  const error = useCallback((message: string, options?: NotificationOptions) => {
    showNotification('error', message, options);
  }, [showNotification]);

  const warning = useCallback((message: string, options?: NotificationOptions) => {
    showNotification('warning', message, options);
  }, [showNotification]);

  const info = useCallback((message: string, options?: NotificationOptions) => {
    showNotification('info', message, options);
  }, [showNotification]);

  const promise = useCallback((
    promise: Promise<unknown>,
    messages: {
      loading?: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading || 'A processar...',
      success: messages.success,
      error: messages.error,
    });
  }, []);

  return {
    success,
    error,
    warning,
    info,
    promise,
    show: showNotification,
  };
};
