import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  _migrateNotes: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      
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
      },
      
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
          ),
        }));
      },
      
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },
    }),
    {
      name: 'focus-flow-notes',
    }
  )
);
