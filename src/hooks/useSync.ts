import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTaskStore } from '@/stores/taskStore';
import { useNotesStore } from '@/stores/notesStore';
import { useGoalsStore } from '@/stores/goalsStore';
import { toast } from 'sonner';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
  pendingChanges: number;
  error: string | null;
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    syncInProgress: false,
    pendingChanges: 0,
    error: null,
  });

  const taskStore = useTaskStore();
  const notesStore = useNotesStore();
  const goalsStore = useGoalsStore();
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get current user ID
  const getUserId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }, []);

  // Sync tasks
  const syncTasks = useCallback(async (userId: string) => {
    try {
      // Get remote tasks
      const { data: remoteTasks, error } = await supabase
        .from('sync_tasks')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const localTasks = taskStore.tasks;
      const remoteMap = new Map((remoteTasks || []).map(t => [t.local_id, t]));
      const localMap = new Map(localTasks.map(t => [t.id, t]));

      // Upload new/updated local tasks
      for (const task of localTasks) {
        const remoteTask = remoteMap.get(task.id);
        const localUpdatedAt = new Date(task.updatedAt || task.createdAt).getTime();
        const remoteUpdatedAt = remoteTask?.updated_at ? new Date(remoteTask.updated_at).getTime() : 0;
        
        if (!remoteTask) {
          // New task - upload
          await supabase.from('sync_tasks').insert({
            local_id: task.id,
            user_id: userId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            due_date: task.dueDate?.toISOString(),
            created_at: task.createdAt.toISOString(),
            updated_at: new Date().toISOString(),
            completed_at: task.completedAt?.toISOString(),
            estimated_minutes: task.estimatedMinutes,
            actual_minutes: task.actualMinutes,
            tags: task.tags,
            ai_recommendation: task.aiRecommendation,
            ai_reason: task.aiReason,
          } as any);
        } else if (localUpdatedAt > remoteUpdatedAt) {
          await supabase
            .from('sync_tasks')
            .update({
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: task.status,
              due_date: task.dueDate?.toISOString(),
              updated_at: new Date(localUpdatedAt).toISOString(),
              completed_at: task.completedAt?.toISOString(),
              estimated_minutes: task.estimatedMinutes,
              actual_minutes: task.actualMinutes,
              tags: task.tags,
              ai_recommendation: task.aiRecommendation,
              ai_reason: task.aiReason,
            } as any)
            .eq('user_id', userId)
            .eq('local_id', task.id);
        }
      }

      // Download new/updated remote tasks
      for (const remoteTask of remoteTasks || []) {
        const localTask = localMap.get(remoteTask.local_id);
        const remoteUpdatedAt = remoteTask.updated_at ? new Date(remoteTask.updated_at).getTime() : 0;
        const localUpdatedAt = localTask ? new Date(localTask.updatedAt || localTask.createdAt).getTime() : 0;
        
        if (!localTask || remoteUpdatedAt > localUpdatedAt) {
          // Upsert remote task into local store
          const syncedTask = {
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
          };
          taskStore.upsertTaskFromSync(syncedTask as any);
        }
      }

    } catch (error) {
      console.error('Error syncing tasks:', error);
      throw error;
    }
  }, [taskStore]);

  // Sync notes
  const syncNotes = useCallback(async (userId: string) => {
    try {
      const { data: remoteNotes, error } = await supabase
        .from('sync_notes')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const localNotes = notesStore.notes;
      const remoteMap = new Map((remoteNotes || []).map(n => [n.local_id, n]));
      const localMap = new Map(localNotes.map(n => [n.id, n]));

      // Upload new/updated local notes
      for (const note of localNotes) {
        const remoteNote = remoteMap.get(note.id);
        
        if (!remoteNote) {
          await supabase.from('sync_notes').insert({
            local_id: note.id,
            user_id: userId,
            title: note.title,
            content: note.content,
            category: note.category,
            tags: note.tags,
            created_at: note.createdAt.toISOString(),
            updated_at: note.updatedAt?.toISOString() || note.createdAt.toISOString(),
          } as any);
        }
      }

      // Download new/updated remote notes
      for (const remoteNote of remoteNotes || []) {
        const localNote = localMap.get(remoteNote.local_id);
        
        if (!localNote) {
          const newNote = {
            id: remoteNote.local_id,
            title: remoteNote.title,
            content: remoteNote.content,
            category: remoteNote.category,
            tags: remoteNote.tags,
            createdAt: new Date(remoteNote.created_at),
            updatedAt: remoteNote.updated_at ? new Date(remoteNote.updated_at) : new Date(remoteNote.created_at),
          };
          notesStore.addNote(newNote);
        }
      }

    } catch (error) {
      console.error('Error syncing notes:', error);
      throw error;
    }
  }, [notesStore]);

  // Sync goals
  const syncGoals = useCallback(async (userId: string) => {
    try {
      const { data: remoteGoals, error } = await supabase
        .from('sync_goals')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const localGoals = goalsStore.goals;
      const remoteMap = new Map((remoteGoals || []).map(g => [g.local_id, g]));
      const localMap = new Map(localGoals.map(g => [g.id, g]));

      // Upload new/updated local goals
      for (const goal of localGoals) {
        const remoteGoal = remoteMap.get(goal.id);
        
        if (!remoteGoal) {
          await supabase.from('sync_goals').insert({
            local_id: goal.id,
            user_id: userId,
            title: goal.title,
            description: goal.description,
            category: goal.category,
            target_date: goal.targetDate?.toISOString(),
            progress: goal.progress,
            created_at: goal.createdAt.toISOString(),
            updated_at: goal.updatedAt?.toISOString() || goal.createdAt.toISOString(),
          } as any);
        }
      }

      // Download new/updated remote goals
      for (const remoteGoal of remoteGoals || []) {
        const localGoal = localMap.get(remoteGoal.local_id);
        
        if (!localGoal) {
          const newGoal = {
            id: remoteGoal.local_id,
            title: remoteGoal.title,
            description: remoteGoal.description,
            category: remoteGoal.category,
            targetDate: remoteGoal.target_date ? new Date(remoteGoal.target_date) : undefined,
            progress: remoteGoal.progress,
            createdAt: new Date(remoteGoal.created_at),
            updatedAt: remoteGoal.updated_at ? new Date(remoteGoal.updated_at) : new Date(remoteGoal.created_at),
          };
          goalsStore.addGoal(newGoal);
        }
      }

    } catch (error) {
      console.error('Error syncing goals:', error);
      throw error;
    }
  }, [goalsStore]);

  // Main sync function
  const syncAll = useCallback(async () => {
    if (!statusRef.current.isOnline || statusRef.current.syncInProgress) return;

    const userId = await getUserId();
    if (!userId) {
      setStatus(prev => ({ ...prev, error: 'Usuário não autenticado' }));
      return;
    }

    setStatus(prev => ({ ...prev, syncInProgress: true, error: null }));

    try {
      await Promise.all([
        syncTasks(userId),
        syncNotes(userId),
        syncGoals(userId),
      ]);

      setStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date(),
        pendingChanges: 0,
        error: null,
      }));

    } catch (error) {
      console.error('Sync error:', error);
      setStatus(prev => ({
        ...prev,
        syncInProgress: false,
        error: error instanceof Error ? error.message : 'Erro na sincronização',
      }));
      toast.error('Erro ao sincronizar dados');
    }
  }, [getUserId, syncTasks, syncNotes, syncGoals]);

  // Auto-sync on mount, focus and periodically
  useEffect(() => {
    if (status.isOnline) {
      syncAll();
    }

    const interval = setInterval(() => {
      if (statusRef.current.isOnline && !statusRef.current.syncInProgress) {
        syncAll();
      }
    }, 60 * 1000);

    const onFocus = () => {
      if (statusRef.current.isOnline && !statusRef.current.syncInProgress) {
        syncAll();
      }
    };

    const onVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        statusRef.current.isOnline &&
        !statusRef.current.syncInProgress
      ) {
        syncAll();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [status.isOnline, syncAll]);

  return {
    status,
    syncAll,
    syncTasks: async () => {
      const userId = await getUserId();
      if (userId) return syncTasks(userId);
    },
    syncNotes: async () => {
      const userId = await getUserId();
      if (userId) return syncNotes(userId);
    },
    syncGoals: async () => {
      const userId = await getUserId();
      if (userId) return syncGoals(userId);
    },
  };
}
