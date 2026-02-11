import { useEffect } from 'react';
import { useGoalsStore } from '@/stores/goalsStore';
import { useNotesStore } from '@/stores/notesStore';

export function DataMigration() {
  const goalsStore = useGoalsStore();
  const notesStore = useNotesStore();

  useEffect(() => {
    // Run migrations on app start - only if functions exist
    try {
      if ((goalsStore as any)._migrateGoals) {
        (goalsStore as any)._migrateGoals();
      }
      if ((notesStore as any)._migrateNotes) {
        (notesStore as any)._migrateNotes();
      }
    } catch (error) {
      console.warn('Migration error:', error);
    }
  }, []); // Empty dependency array is fine here

  return null;
}
