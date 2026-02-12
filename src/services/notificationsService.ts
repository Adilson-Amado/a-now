import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action_url?: string;
  action_label?: string;
}

class NotificationsService {
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[] || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async createNotification(notification: CreateNotificationData): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification] as any)
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Métodos para notificações específicas do sistema
  async notifyTaskCompleted(userId: string, taskTitle: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: 'Tarefa Concluída! 🎉',
      message: `Parabéns! Concluíste a tarefa "${taskTitle}".`,
      type: 'success',
      action_url: '/tasks',
      action_label: 'Ver Tarefas'
    });
  }

  async notifyGoalAchieved(userId: string, goalTitle: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: 'Objetivo Alcançado! 🏆',
      message: `Incrível! Alcançaste o teu objetivo "${goalTitle}".`,
      type: 'success',
      action_url: '/goals',
      action_label: 'Ver Objetivos'
    });
  }

  async notifyReminder(userId: string, reminderTitle: string, reminderMessage: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: `⏰ ${reminderTitle}`,
      message: reminderMessage,
      type: 'warning',
    });
  }

  async notifyWelcome(userId: string, userName: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: 'Bem-vindo ao a-now! 👋',
      message: `Olá ${userName}! Estamos felizes em ter-te aqui. Começa a organizar as tuas tarefas e objetivos.`,
      type: 'info',
      action_url: '/dashboard',
      action_label: 'Começar'
    });
  }

  async notifyAchievement(userId: string, achievementTitle: string, achievementDescription: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: `🏅 Conquista Desbloqueada!`,
      message: `${achievementTitle}: ${achievementDescription}`,
      type: 'success',
      action_url: '/profile',
      action_label: 'Ver Conquistas'
    });
  }

  async notifyTaskDueSoon(userId: string, taskTitle: string, message: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: `⏰ Tarefa a Vencer: ${taskTitle}`,
      message: message,
      type: 'warning',
      action_url: '/tasks',
      action_label: 'Ver Tarefa'
    });
  }

  async notifyTaskDue30Min(userId: string, taskTitle: string, message: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: `🚨 URGENTE: ${taskTitle}`,
      message: message,
      type: 'error',
      action_url: '/tasks',
      action_label: 'Ver Tarefa'
    });
  }

  async notifyGoalDelayed(userId: string, goalTitle: string, message: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: `📅 Meta Atrasada: ${goalTitle}`,
      message: message,
      type: 'warning',
      action_url: '/goals',
      action_label: 'Ver Meta'
    });
  }

  async notifyNoTasksCreated(userId: string, message: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: `📝 Tempo sem Atividade`,
      message: message,
      type: 'info',
      action_url: '/tasks',
      action_label: 'Criar Tarefa'
    });
  }
}

export const notificationsService = new NotificationsService();
