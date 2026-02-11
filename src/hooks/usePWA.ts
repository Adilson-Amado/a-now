import { useEffect, useState } from 'react';
import { pushNotificationsService } from '@/services/pushNotifications';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [notificationsPermission, setNotificationsPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  if (confirm('Nova versão disponível! Deseja atualizar?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
    };

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check notifications support and permission
    const checkNotifications = () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
      setNotificationsSupported(supported);
      
      if (supported) {
        setNotificationsPermission(Notification.permission);
      }
    };

    checkInstalled();
    registerServiceWorker();
    checkNotifications();

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installPWA = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    if (!notificationsSupported) return false;

    try {
      const permission = await pushNotificationsService.requestPermission();
      setNotificationsPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribeToNotifications = async () => {
    if (!notificationsSupported || notificationsPermission !== 'granted') return null;

    try {
      const subscription = await pushNotificationsService.subscribeToPush();
      return subscription;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return null;
    }
  };

  const showNotification = async (title: string, body: string, options?: {
    icon?: string;
    tag?: string;
    url?: string;
  }) => {
    if (!notificationsSupported || notificationsPermission !== 'granted') return;

    try {
      await pushNotificationsService.showLocalNotification({
        title,
        body,
        icon: options?.icon,
        tag: options?.tag,
        data: { url: options?.url }
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // Specific notification methods
  const notifyTaskCompleted = async (taskTitle: string) => {
    if (notificationsPermission === 'granted') {
      await pushNotificationsService.notifyTaskCompleted(taskTitle);
    }
  };

  const notifyGoalAchieved = async (goalTitle: string) => {
    if (notificationsPermission === 'granted') {
      await pushNotificationsService.notifyGoalAchieved(goalTitle);
    }
  };

  const notifyReminder = async (title: string, message: string) => {
    if (notificationsPermission === 'granted') {
      await pushNotificationsService.notifyReminder(title, message);
    }
  };

  const notifyPomodoroStart = async (taskTitle: string) => {
    if (notificationsPermission === 'granted') {
      await pushNotificationsService.notifyPomodoroStart(taskTitle);
    }
  };

  const notifyPomodoroBreak = async () => {
    if (notificationsPermission === 'granted') {
      await pushNotificationsService.notifyPomodoroBreak();
    }
  };

  const notifyPomodoroComplete = async () => {
    if (notificationsPermission === 'granted') {
      await pushNotificationsService.notifyPomodoroComplete();
    }
  };

  return {
    // PWA state
    isInstalled,
    canInstall: !!installPrompt,
    isOnline,
    
    // Notifications state
    notificationsSupported,
    notificationsPermission,
    
    // PWA actions
    installPWA,
    
    // Notifications actions
    requestNotificationPermission,
    subscribeToNotifications,
    showNotification,
    
    // Specific notifications
    notifyTaskCompleted,
    notifyGoalAchieved,
    notifyReminder,
    notifyPomodoroStart,
    notifyPomodoroBreak,
    notifyPomodoroComplete,
  };
};
