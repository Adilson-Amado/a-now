interface PushNotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationsService {
  private vapidPublicKey: string;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    // VAPID keys should be configured in environment
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      if (!this.isSupported) {
        console.warn('Push notifications not supported');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
      }

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-192x192.png',
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: true,
        silent: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification clicks
      notification.onclick = (event) => {
        event.preventDefault();
        
        if (payload.data?.url) {
          window.open(payload.data.url, '_blank');
        }
        
        notification.close();
      };
    }
  }

  async sendPushNotification(subscription: PushNotificationSubscription, payload: NotificationPayload): Promise<boolean> {
    try {
      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          payload
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  isPermissionGranted(): boolean {
    return Notification.permission === 'granted';
  }

  isPermissionDenied(): boolean {
    return Notification.permission === 'denied';
  }

  async getSubscription(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting push subscription:', error);
      return null;
    }
  }

  // Métodos específicos para o a-now
  async notifyTaskCompleted(taskTitle: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Tarefa Concluída! 🎉',
      body: `Parabéns! Concluíste a tarefa "${taskTitle}".`,
      icon: '/icons/task-complete.png',
      tag: 'task-completed',
      data: { url: '/tasks' },
      actions: [
        {
          action: 'view-tasks',
          title: 'Ver Tarefas'
        }
      ]
    });
  }

  async notifyGoalAchieved(goalTitle: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Objetivo Alcançado! 🏆',
      body: `Incrível! Alcançaste o teu objetivo "${goalTitle}".`,
      icon: '/icons/goal-achieved.png',
      tag: 'goal-achieved',
      data: { url: '/goals' },
      actions: [
        {
          action: 'view-goals',
          title: 'Ver Objetivos'
        }
      ]
    });
  }

  async notifyReminder(title: string, message: string): Promise<void> {
    await this.showLocalNotification({
      title: `⏰ ${title}`,
      body: message,
      icon: '/icons/reminder.png',
      tag: 'reminder',
      data: { url: '/dashboard' },
      requireInteraction: true
    });
  }

  async notifyPomodoroStart(taskTitle: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Pomodoro Iniciado! 🍅',
      body: `Foco na tarefa: "${taskTitle}"`,
      icon: '/icons/pomodoro.png',
      tag: 'pomodoro-start',
      data: { url: '/tasks' }
    });
  }

  async notifyPomodoroBreak(): Promise<void> {
    await this.showLocalNotification({
      title: 'Hora do Pausa! ☕',
      body: 'Bom trabalho! Tira uma pausa de 5 minutos.',
      icon: '/icons/break.png',
      tag: 'pomodoro-break',
      actions: [
        {
          action: 'start-break',
          title: 'Iniciar Pausa'
        },
        {
          action: 'skip-break',
          title: 'Pular Pausa'
        }
      ]
    });
  }

  async notifyPomodoroComplete(): Promise<void> {
    await this.showLocalNotification({
      title: 'Pomodoro Concluído! ✅',
      body: 'Mais um ciclo de foco completo!',
      icon: '/icons/pomodoro-complete.png',
      tag: 'pomodoro-complete',
      data: { url: '/dashboard' }
    });
  }
}

export const pushNotificationsService = new PushNotificationsService();
