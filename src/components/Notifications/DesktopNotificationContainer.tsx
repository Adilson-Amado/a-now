import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DesktopNotification, DesktopNotificationProps } from './DesktopNotification';

interface NotificationItem extends DesktopNotificationProps {
  id: string;
  timestamp: number;
}

export const DesktopNotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationItem = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Expose methods globally for easy access
  React.useEffect(() => {
    (window as any).desktopNotifications = {
      show: addNotification,
      hide: removeNotification,
      clear: clearAllNotifications,
    };
  }, [addNotification, removeNotification, clearAllNotifications]);

  // Limit to 5 notifications max
  const visibleNotifications = notifications.slice(-5);

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {visibleNotifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <DesktopNotification
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};

// Global helper functions
export const showDesktopNotification = (
  title: string,
  message: string,
  options?: {
    type?: DesktopNotificationProps['type'];
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
    onClick?: () => void;
  }
) => {
  const notifications = (window as any).desktopNotifications;
  if (notifications) {
    return notifications.show({
      title,
      message,
      type: options?.type || 'info',
      duration: options?.duration || 5000,
      action: options?.action,
      onClick: options?.onClick,
    });
  }
};

export const hideDesktopNotification = (id: string) => {
  const notifications = (window as any).desktopNotifications;
  if (notifications) {
    notifications.hide(id);
  }
};

export const clearDesktopNotifications = () => {
  const notifications = (window as any).desktopNotifications;
  if (notifications) {
    notifications.clear();
  }
};

// Specific notification helpers
export const notifyTaskCompleted = (taskTitle: string, onViewTasks?: () => void) => {
  return showDesktopNotification(
    'Tarefa Concluída! 🎉',
    `Parabéns! Concluíste a tarefa "${taskTitle}".`,
    {
      type: 'success',
      action: onViewTasks ? {
        label: 'Ver Tarefas',
        onClick: onViewTasks,
      } : undefined,
    }
  );
};

export const notifyGoalAchieved = (goalTitle: string, onViewGoals?: () => void) => {
  return showDesktopNotification(
    'Objetivo Alcançado! 🏆',
    `Incrível! Alcançaste o teu objetivo "${goalTitle}".`,
    {
      type: 'achievement',
      action: onViewGoals ? {
        label: 'Ver Objetivos',
        onClick: onViewGoals,
      } : undefined,
    }
  );
};

export const notifyReminder = (title: string, message: string, onOpen?: () => void) => {
  return showDesktopNotification(
    `⏰ ${title}`,
    message,
    {
      type: 'reminder',
      duration: 0, // Don't auto-close reminders
      action: onOpen ? {
        label: 'Abrir',
        onClick: onOpen,
      } : undefined,
    }
  );
};

export const notifyPomodoroStart = (taskTitle: string) => {
  return showDesktopNotification(
    'Pomodoro Iniciado! 🍅',
    `Foco na tarefa: "${taskTitle}"`,
    {
      type: 'pomodoro',
      duration: 3000,
    }
  );
};

export const notifyPomodoroBreak = (onStartBreak?: () => void, onSkipBreak?: () => void) => {
  return showDesktopNotification(
    'Hora do Pausa! ☕',
    'Bom trabalho! Tira uma pausa de 5 minutos.',
    {
      type: 'pomodoro',
      duration: 0, // Don't auto-close
      action: onStartBreak ? {
        label: 'Iniciar Pausa',
        onClick: onStartBreak,
      } : undefined,
    }
  );
};

export const notifyPomodoroComplete = () => {
  return showDesktopNotification(
    'Pomodoro Concluído! ✅',
    'Mais um ciclo de foco completo!',
    {
      type: 'success',
      duration: 4000,
    }
  );
};

export const notifyError = (title: string, message: string) => {
  return showDesktopNotification(
    title,
    message,
    {
      type: 'error',
      duration: 6000,
    }
  );
};

export const notifyWarning = (title: string, message: string) => {
  return showDesktopNotification(
    title,
    message,
    {
      type: 'warning',
      duration: 5000,
    }
  );
};

export const notifyInfo = (title: string, message: string) => {
  return showDesktopNotification(
    title,
    message,
    {
      type: 'info',
      duration: 4000,
    }
  );
};
