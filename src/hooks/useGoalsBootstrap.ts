import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGoalsStore } from '@/stores/goalsStore';
import { toast } from 'sonner';

export function useGoalsBootstrap() {
  const { user } = useAuth();
  const { setGoals, clearGoals } = useGoalsStore();

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      clearGoals();
      return () => {
        cancelled = true;
      };
    }

    try {
      const lastUserId = localStorage.getItem('focusflow-user-id');
      if (lastUserId && lastUserId !== user.id) {
        clearGoals();
        localStorage.removeItem('focus-flow-goals');
      }
      localStorage.setItem('focusflow-user-id', user.id);
    } catch (error) {
      console.warn('Unable to manage user marker:', error);
    }

    (async () => {
      const { data, error } = await supabase
        .from('sync_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const goals = (data || []).map((remote) => {
        const progress = typeof remote.progress === 'number' ? remote.progress : 0;
        const completed = progress >= 100;
        return {
          id: remote.local_id,
          title: remote.title,
          description: remote.description || undefined,
          category: remote.category,
          targetDate: remote.target_date ? new Date(remote.target_date) : undefined,
          progress,
          createdAt: remote.created_at ? new Date(remote.created_at) : new Date(),
          updatedAt: remote.updated_at ? new Date(remote.updated_at) : new Date(),
          completed,
          completedAt: completed ? new Date(remote.updated_at || remote.created_at || Date.now()) : undefined,
          milestones: [],
          completedSessions: 0,
          lifecycle: 'active' as const,
        };
      });

      if (!cancelled) setGoals(goals);
    })().catch((error) => {
      console.error('Error loading goals:', error);
      toast.error('Erro ao carregar metas');
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, clearGoals, setGoals]);
}
