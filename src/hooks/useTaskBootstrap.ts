import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore } from '@/stores/taskStore';
import { Task } from '@/types/task';
import { toast } from 'sonner';

const mapRemoteTask = (remoteTask: Record<string, any>): Task => ({
  id: remoteTask.local_id,
  title: remoteTask.title,
  description: remoteTask.description || undefined,
  priority: remoteTask.priority,
  status: remoteTask.status,
  lifecycle: remoteTask.lifecycle || 'active',
  dueDate: remoteTask.due_date ? new Date(remoteTask.due_date) : undefined,
  createdAt: remoteTask.created_at ? new Date(remoteTask.created_at) : new Date(),
  updatedAt: remoteTask.updated_at ? new Date(remoteTask.updated_at) : new Date(),
  completedAt: remoteTask.completed_at ? new Date(remoteTask.completed_at) : undefined,
  estimatedMinutes: remoteTask.estimated_minutes || undefined,
  actualMinutes: remoteTask.actual_minutes || undefined,
  tags: remoteTask.tags || undefined,
  aiRecommendation: remoteTask.ai_recommendation || undefined,
  aiReason: remoteTask.ai_reason || undefined,
  category: remoteTask.category || undefined,
  project: remoteTask.project || undefined,
  effortLevel: remoteTask.effort_level || undefined,
  taskType: remoteTask.task_type || undefined,
  lastFocusStartedAt: remoteTask.last_focus_started_at ? new Date(remoteTask.last_focus_started_at) : undefined,
  lastFocusEndedAt: remoteTask.last_focus_ended_at ? new Date(remoteTask.last_focus_ended_at) : undefined,
  totalFocusMinutes: remoteTask.total_focus_minutes || undefined,
});

export function useTaskBootstrap() {
  const { user } = useAuth();
  const { setTasks, clearTasks } = useTaskStore();

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      clearTasks();
      try {
        localStorage.removeItem('focusflow-user-id');
      } catch (error) {
        console.warn('Unable to clear user marker:', error);
      }
      return () => {
        cancelled = true;
      };
    }

    try {
      const lastUserId = localStorage.getItem('focusflow-user-id');
      if (lastUserId && lastUserId !== user.id) {
        clearTasks();
        localStorage.removeItem('focus-flow-tasks');
      }
      localStorage.setItem('focusflow-user-id', user.id);
    } catch (error) {
      console.warn('Unable to manage user marker:', error);
    }

    (async () => {
      const { data, error } = await supabase
        .from('sync_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasks = (data || []).map(mapRemoteTask);
      if (!cancelled) setTasks(tasks);
    })().catch((error) => {
      console.error('Error loading tasks:', error);
      toast.error('Erro ao carregar tarefas');
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, clearTasks, setTasks]);
}
