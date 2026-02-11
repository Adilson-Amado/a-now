import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotesStore } from '@/stores/notesStore';
import { toast } from 'sonner';

export function useNotesBootstrap() {
  const { user } = useAuth();
  const { setNotes, clearNotes } = useNotesStore();

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      clearNotes();
      return () => {
        cancelled = true;
      };
    }

    try {
      const lastUserId = localStorage.getItem('focusflow-user-id');
      if (lastUserId && lastUserId !== user.id) {
        clearNotes();
        localStorage.removeItem('focus-flow-notes');
      }
      localStorage.setItem('focusflow-user-id', user.id);
    } catch (error) {
      console.warn('Unable to manage user marker:', error);
    }

    (async () => {
      const { data, error } = await supabase
        .from('sync_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notes = (data || []).map((remote) => ({
        id: remote.local_id,
        title: remote.title,
        content: remote.content || undefined,
        category: remote.category,
        tags: remote.tags || undefined,
        createdAt: remote.created_at ? new Date(remote.created_at) : new Date(),
        updatedAt: remote.updated_at ? new Date(remote.updated_at) : new Date(),
        saveStatus: 'saved' as const,
      }));

      if (!cancelled) setNotes(notes);
    })().catch((error) => {
      console.error('Error loading notes:', error);
      toast.error('Erro ao carregar notas');
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, clearNotes, setNotes]);
}
