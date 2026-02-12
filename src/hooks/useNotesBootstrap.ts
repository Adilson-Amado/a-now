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

      const remoteNotes = data || [];
      const dedupeMap = new Map<string, (typeof remoteNotes)[number]>();
      const duplicatesToDelete: string[] = [];

      for (const remote of remoteNotes) {
        const signature = JSON.stringify({
          title: remote.title || '',
          content: remote.content || '',
          category: remote.category || 'personal',
          tags: Array.isArray(remote.tags) ? [...remote.tags].sort() : [],
        });

        const existing = dedupeMap.get(signature);
        if (!existing) {
          dedupeMap.set(signature, remote);
          continue;
        }

        const existingUpdatedAt = existing.updated_at
          ? new Date(existing.updated_at).getTime()
          : existing.created_at
          ? new Date(existing.created_at).getTime()
          : 0;
        const currentUpdatedAt = remote.updated_at
          ? new Date(remote.updated_at).getTime()
          : remote.created_at
          ? new Date(remote.created_at).getTime()
          : 0;

        if (currentUpdatedAt > existingUpdatedAt) {
          if (existing.local_id) duplicatesToDelete.push(existing.local_id);
          dedupeMap.set(signature, remote);
        } else if (remote.local_id) {
          duplicatesToDelete.push(remote.local_id);
        }
      }

      if (duplicatesToDelete.length > 0) {
        await supabase
          .from('sync_notes')
          .delete()
          .eq('user_id', user.id)
          .in('local_id', duplicatesToDelete);
      }

      const notes = Array.from(dedupeMap.values()).map((remote) => ({
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
