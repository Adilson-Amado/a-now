import { useCallback } from 'react';
import {
  showDesktopNotification,
  notifyTaskCompleted,
  notifyGoalAchieved,
  notifyReminder,
  notifyPomodoroStart,
  notifyPomodoroBreak,
  notifyPomodoroComplete,
  notifyError,
  notifyWarning,
  notifyInfo,
  clearDesktopNotifications,
} from '@/components/Notifications/DesktopNotificationContainer';

export const useDesktopNotifications = () => {
  const showNotification = useCallback((
    title: string,
    message: string,
    options?: {
      type?: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'reminder' | 'pomodoro';
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
      onClick?: () => void;
    }
  ) => {
    return showDesktopNotification(title, message, options);
  }, []);

  const taskCompleted = useCallback((taskTitle: string, onViewTasks?: () => void) => {
    return notifyTaskCompleted(taskTitle, onViewTasks);
  }, []);

  const goalAchieved = useCallback((goalTitle: string, onViewGoals?: () => void) => {
    return notifyGoalAchieved(goalTitle, onViewGoals);
  }, []);

  const reminder = useCallback((title: string, message: string, onOpen?: () => void) => {
    return notifyReminder(title, message, onOpen);
  }, []);

  const pomodoroStart = useCallback((taskTitle: string) => {
    return notifyPomodoroStart(taskTitle);
  }, []);

  const pomodoroBreak = useCallback((onStartBreak?: () => void, onSkipBreak?: () => void) => {
    return notifyPomodoroBreak(onStartBreak, onSkipBreak);
  }, []);

  const pomodoroComplete = useCallback(() => {
    return notifyPomodoroComplete();
  }, []);

  const error = useCallback((title: string, message: string) => {
    return notifyError(title, message);
  }, []);

  const warning = useCallback((title: string, message: string) => {
    return notifyWarning(title, message);
  }, []);

  const info = useCallback((title: string, message: string) => {
    return notifyInfo(title, message);
  }, []);

  const clearAll = useCallback(() => {
    clearDesktopNotifications();
  }, []);

  return {
    showNotification,
    taskCompleted,
    goalAchieved,
    reminder,
    pomodoroStart,
    pomodoroBreak,
    pomodoroComplete,
    error,
    warning,
    info,
    clearAll,
  };
};
