import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface Note {
  id: string;
  title: string;
  content?: string;
  category: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
  tags?: string[];
  audio?: {
    url: string;
    durationMs: number;
    createdAt: Date;
  };
  saveStatus?: 'saved' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

interface NotesState {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  clearNotes: () => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  _migrateNotes: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const persistNoteCreate = async (note: Note) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('sync_notes').insert({
      local_id: note.id,
      user_id: user.id,
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
      created_at: note.createdAt.toISOString(),
      updated_at: note.updatedAt.toISOString(),
    } as any);
  } catch (error) {
    console.error('Error persisting note create:', error);
  }
};

const persistNoteUpdate = async (noteId: string, updates: Partial<Note>) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('sync_notes')
      .update({
        title: updates.title,
        content: updates.content,
        category: updates.category,
        tags: updates.tags,
        updated_at: updates.updatedAt?.toISOString() || new Date().toISOString(),
      } as any)
      .eq('user_id', user.id)
      .eq('local_id', noteId);
  } catch (error) {
    console.error('Error persisting note update:', error);
  }
};

const persistNoteDelete = async (noteId: string) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('sync_notes').delete().eq('user_id', user.id).eq('local_id', noteId);
  } catch (error) {
    console.error('Error persisting note delete:', error);
  }
};

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      setNotes: (notes) => set({ notes }),
      clearNotes: () => set({ notes: [] }),
      
      // Migration function to handle old data
      _migrateNotes: () => {
        const notes = get().notes;
        const migratedNotes = notes.map(note => ({
          ...note,
          category: note.category || 'personal',
          tags: note.tags || [],
          content: note.content || undefined,
          audio: note.audio || undefined,
          saveStatus: note.saveStatus || 'saved',
        }));
        set({ notes: migratedNotes });
      },
      
      addNote: (note) => {
        const now = new Date();
        const newNote: Note = {
          ...note,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));
        void persistNoteCreate(newNote);
      },
      
      updateNote: (id, updates) => {
        const updatedAt = new Date();
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates, updatedAt } : note
          ),
        }));
        void persistNoteUpdate(id, { ...updates, updatedAt } as Note);
      },
      
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
        void persistNoteDelete(id);
      },
    }),
    {
      name: 'focus-flow-notes',
    }
  )
);
