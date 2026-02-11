import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';

export class TasksService {
  static async getTasks(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapDbTaskToStore) || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  static async createTask(userId: string, task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    try {
      const dbTask = this.mapStoreTaskToDb(task);
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...dbTask,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDbTaskToStore(data);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const dbUpdates = this.mapStoreTaskToDb(updates);
      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      return this.mapDbTaskToStore(data);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  private static mapDbTaskToStore(dbTask: Record<string, unknown>): Task {
    return {
      id: dbTask.id as string,
      title: dbTask.title as string,
      description: (dbTask.description as string) || '',
      status: dbTask.status as 'pending' | 'in-progress' | 'completed' | 'cancelled',
      priority: dbTask.priority as 'urgent' | 'important' | 'can-wait' | 'dispensable',
      aiRecommendation: dbTask.ai_recommendation as 'do-now' | 'schedule' | 'delegate' | 'ignore',
      aiReason: dbTask.ai_reason as string,
      dueDate: dbTask.due_date ? new Date(dbTask.due_date as string) : undefined,
      completedAt: dbTask.completed_at ? new Date(dbTask.completed_at as string) : undefined,
      createdAt: new Date(dbTask.created_at as string),
      estimatedMinutes: dbTask.estimated_duration as number,
      actualMinutes: dbTask.actual_duration as number,
      tags: (dbTask.tags as string[]) || []
    };
  }

  private static mapStoreTaskToDb(task: Partial<Task>): Record<string, unknown> {
    return {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      ai_recommendation: task.aiRecommendation,
      ai_reason: task.aiReason,
      due_date: task.dueDate?.toISOString(),
      completed_at: task.completedAt?.toISOString(),
      estimated_duration: task.estimatedMinutes,
      actual_duration: task.actualMinutes,
      tags: task.tags
    };
  }
}
