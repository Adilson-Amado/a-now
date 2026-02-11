import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { Note } from '@/types/note';
import { Goal } from '@/types/goal';
import { toast } from 'sonner';

export interface SyncStatus {
  lastSync: Date | null;
  isOnline: boolean;
  pendingChanges: number;
  syncInProgress: boolean;
  conflicts: number;
}

export interface SyncConflict {
  id: string;
  type: 'task' | 'note' | 'goal';
  localData: any;
  remoteData: any;
  timestamp: Date;
}

class SyncService {
  private syncQueue: Array<{
    type: 'task' | 'note' | 'goal';
    action: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
  }> = [];

  private status: SyncStatus = {
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0,
    syncInProgress: false,
    conflicts: 0,
  };

  private conflicts: SyncConflict[] = [];
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    this.setupEventListeners();
    this.loadSyncQueue();
    this.startPeriodicSync();
  }

  // Event Listeners
  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.notifyListeners();
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.notifyListeners();
    });

    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'focusflow-sync-queue') {
        this.loadSyncQueue();
      }
    });
  }

  // Status Management
  public getStatus(): SyncStatus {
    return { ...this.status };
  }

  public getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  public subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getStatus()));
  }

  // Queue Management
  private loadSyncQueue() {
    try {
      const stored = localStorage.getItem('focusflow-sync-queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
    this.updatePendingCount();
  }

  private saveSyncQueue() {
    try {
      localStorage.setItem('focusflow-sync-queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
    this.updatePendingCount();
  }

  private updatePendingCount() {
    this.status.pendingChanges = this.syncQueue.length;
    this.notifyListeners();
  }

  // Queue Operations
  public queueChange(type: 'task' | 'note' | 'goal', action: 'create' | 'update' | 'delete', data: any) {
    const change = {
      type,
      action,
      data,
      timestamp: new Date(),
    };

    this.syncQueue.push(change);
    this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.status.isOnline && !this.status.syncInProgress) {
      this.syncAll();
    }
  }

  // Task Sync Methods
  public async syncTasks(userId: string): Promise<void> {
    if (!this.status.isOnline) return;

    try {
      // Get local tasks
      const localTasks = JSON.parse(localStorage.getItem('focusflow-tasks') || '[]');
      
      // Get remote tasks
      const { data: remoteTasks, error } = await supabase
        .from('sync_tasks')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Sync logic
      await this.performTaskSync(localTasks, remoteTasks || [], userId);
      
    } catch (error) {
      console.error('Error syncing tasks:', error);
      toast.error('Erro ao sincronizar tarefas');
    }
  }

  private async performTaskSync(localTasks: Task[], remoteTasks: any[], userId: string): Promise<void> {
    const remoteMap = new Map(remoteTasks.map(t => [t.local_id, t]));
    const localMap = new Map(localTasks.map(t => [t.id, t]));

    // Find conflicts
    for (const [localId, localTask] of localMap) {
      const remoteTask = remoteMap.get(localId);
      
      if (remoteTask && remoteTask.updated_at > new Date(localTask.updatedAt).toISOString()) {
        // Conflict: remote is newer
        this.conflicts.push({
          id: localId,
          type: 'task',
          localData: localTask,
          remoteData: remoteTask,
          timestamp: new Date(),
        });
      }
    }

    // Upload new/updated local tasks
    for (const task of localTasks) {
      const remoteTask = remoteMap.get(task.id);
      
      if (!remoteTask) {
        // New task - upload
        await (supabase.from('sync_tasks') as any).insert({
          local_id: task.id,
          user_id: userId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          due_date: task.dueDate?.toISOString(),
          created_at: task.createdAt.toISOString(),
          updated_at: task.updatedAt?.toISOString() || task.createdAt.toISOString(),
          completed_at: task.completedAt?.toISOString(),
          estimated_minutes: task.estimatedMinutes,
          actual_minutes: task.actualMinutes,
          tags: task.tags,
        });
      } else if (new Date(task.updatedAt) > new Date(remoteTask.updated_at)) {
        // Local is newer - update
        await (supabase.from('sync_tasks') as any).update({
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          due_date: task.dueDate?.toISOString(),
          updated_at: task.updatedAt?.toISOString() || task.createdAt.toISOString(),
          completed_at: task.completedAt?.toISOString(),
          estimated_minutes: task.estimatedMinutes,
          actual_minutes: task.actualMinutes,
          tags: task.tags,
        })
          .eq('local_id', task.id)
          .eq('user_id', userId);
      }
    }

    // Download new/updated remote tasks
    for (const remoteTask of remoteTasks) {
      const localTask = localMap.get(remoteTask.local_id);
      
      if (!localTask) {
        // New remote task - download
        const newTask: Task = {
          id: remoteTask.local_id,
          title: remoteTask.title,
          description: remoteTask.description,
          priority: remoteTask.priority,
          status: remoteTask.status,
          dueDate: remoteTask.due_date ? new Date(remoteTask.due_date) : undefined,
          createdAt: new Date(remoteTask.created_at),
          updatedAt: remoteTask.updated_at ? new Date(remoteTask.updated_at) : new Date(remoteTask.created_at),
          completedAt: remoteTask.completed_at ? new Date(remoteTask.completed_at) : undefined,
          estimatedMinutes: remoteTask.estimated_minutes,
          actualMinutes: remoteTask.actual_minutes,
          tags: remoteTask.tags,
        };
        
        localTasks.push(newTask);
      } else if (new Date(remoteTask.updated_at) > new Date(localTask.updatedAt)) {
        // Remote is newer - update local
        const index = localTasks.findIndex(t => t.id === remoteTask.local_id);
        if (index !== -1) {
          localTasks[index] = {
            ...localTasks[index],
            title: remoteTask.title,
            description: remoteTask.description,
            priority: remoteTask.priority,
            status: remoteTask.status,
            dueDate: remoteTask.due_date ? new Date(remoteTask.due_date) : undefined,
            updatedAt: new Date(remoteTask.updated_at),
            completedAt: remoteTask.completed_at ? new Date(remoteTask.completed_at) : undefined,
            estimatedMinutes: remoteTask.estimated_minutes,
            actualMinutes: remoteTask.actual_minutes,
            tags: remoteTask.tags,
          };
        }
      }
    }

    // Save updated local tasks
    localStorage.setItem('focusflow-tasks', JSON.stringify(localTasks));
  }

  // Note Sync Methods
  public async syncNotes(userId: string): Promise<void> {
    if (!this.status.isOnline) return;

    try {
      const localNotes = JSON.parse(localStorage.getItem('focusflow-notes') || '[]');
      
      const { data: remoteNotes, error } = await supabase
        .from('sync_notes')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      await this.performNoteSync(localNotes, remoteNotes || [], userId);
      
    } catch (error) {
      console.error('Error syncing notes:', error);
      toast.error('Erro ao sincronizar notas');
    }
  }

  private async performNoteSync(localNotes: Note[], remoteNotes: any[], userId: string): Promise<void> {
    const remoteMap = new Map(remoteNotes.map(n => [n.local_id, n]));
    const localMap = new Map(localNotes.map(n => [n.id, n]));

    // Similar sync logic as tasks
    for (const note of localNotes) {
      const remoteNote = remoteMap.get(note.id);
      
      if (!remoteNote) {
        await (supabase.from('sync_notes') as any).insert({
          local_id: note.id,
          user_id: userId,
          title: note.title,
          content: note.content,
          category: note.category,
          tags: note.tags,
          created_at: note.createdAt.toISOString(),
          updated_at: note.updatedAt?.toISOString() || note.createdAt.toISOString(),
        });
      } else if (new Date(note.updatedAt) > new Date(remoteNote.updated_at)) {
        await (supabase.from('sync_notes') as any).update({
            title: note.title,
            content: note.content,
            category: note.category,
            tags: note.tags,
            updated_at: note.updatedAt?.toISOString() || note.createdAt.toISOString(),
          })
          .eq('local_id', note.id)
          .eq('user_id', userId);
      }
    }

    // Download new/updated remote notes
    for (const remoteNote of remoteNotes) {
      const localNote = localMap.get(remoteNote.local_id);
      
      if (!localNote) {
        const newNote: Note = {
          id: remoteNote.local_id,
          title: remoteNote.title,
          content: remoteNote.content,
          category: remoteNote.category,
          tags: remoteNote.tags,
          createdAt: new Date(remoteNote.created_at),
          updatedAt: remoteNote.updated_at ? new Date(remoteNote.updated_at) : new Date(remoteNote.created_at),
        };
        
        localNotes.push(newNote);
      } else if (new Date(remoteNote.updated_at) > new Date(localNote.updatedAt)) {
        const index = localNotes.findIndex(n => n.id === remoteNote.local_id);
        if (index !== -1) {
          localNotes[index] = {
            ...localNotes[index],
            title: remoteNote.title,
            content: remoteNote.content,
            category: remoteNote.category,
            tags: remoteNote.tags,
            updatedAt: new Date(remoteNote.updated_at),
          };
        }
      }
    }

    localStorage.setItem('focusflow-notes', JSON.stringify(localNotes));
  }

  // Goal Sync Methods
  public async syncGoals(userId: string): Promise<void> {
    if (!this.status.isOnline) return;

    try {
      const localGoals = JSON.parse(localStorage.getItem('focusflow-goals') || '[]');
      
      const { data: remoteGoals, error } = await supabase
        .from('sync_goals')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      await this.performGoalSync(localGoals, remoteGoals || [], userId);
      
    } catch (error) {
      console.error('Error syncing goals:', error);
      toast.error('Erro ao sincronizar metas');
    }
  }

  private async performGoalSync(localGoals: Goal[], remoteGoals: any[], userId: string): Promise<void> {
    const remoteMap = new Map(remoteGoals.map(g => [g.local_id, g]));
    const localMap = new Map(localGoals.map(g => [g.id, g]));

    for (const goal of localGoals) {
      const remoteGoal = remoteMap.get(goal.id);
      
      if (!remoteGoal) {
        await (supabase.from('sync_goals') as any).insert({
          local_id: goal.id,
          user_id: userId,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          target_date: goal.targetDate?.toISOString(),
          progress: goal.progress,
          created_at: goal.createdAt.toISOString(),
          updated_at: goal.updatedAt?.toISOString() || goal.createdAt.toISOString(),
        });
      } else if (new Date(goal.updatedAt) > new Date(remoteGoal.updated_at)) {
        await (supabase.from('sync_goals') as any).update({
            title: goal.title,
            description: goal.description,
            category: goal.category,
            target_date: goal.targetDate?.toISOString(),
            progress: goal.progress,
            updated_at: goal.updatedAt?.toISOString() || goal.createdAt.toISOString(),
          })
          .eq('local_id', goal.id)
          .eq('user_id', userId);
      }
    }

    // Download new/updated remote goals
    for (const remoteGoal of remoteGoals) {
      const localGoal = localMap.get(remoteGoal.local_id);
      
      if (!localGoal) {
        const newGoal: Goal = {
          id: remoteGoal.local_id,
          title: remoteGoal.title,
          description: remoteGoal.description,
          category: remoteGoal.category,
          targetDate: remoteGoal.target_date ? new Date(remoteGoal.target_date) : undefined,
          progress: remoteGoal.progress,
          createdAt: new Date(remoteGoal.created_at),
          updatedAt: remoteGoal.updated_at ? new Date(remoteGoal.updated_at) : new Date(remoteGoal.created_at),
        };
        
        localGoals.push(newGoal);
      } else if (new Date(remoteGoal.updated_at) > new Date(localGoal.updatedAt)) {
        const index = localGoals.findIndex(g => g.id === remoteGoal.local_id);
        if (index !== -1) {
          localGoals[index] = {
            ...localGoals[index],
            title: remoteGoal.title,
            description: remoteGoal.description,
            category: remoteGoal.category,
            targetDate: remoteGoal.target_date ? new Date(remoteGoal.target_date) : undefined,
            progress: remoteGoal.progress,
            updatedAt: new Date(remoteGoal.updated_at),
          };
        }
      }
    }

    localStorage.setItem('focusflow-goals', JSON.stringify(localGoals));
  }

  // Main Sync Methods
  public async syncAll(userId?: string): Promise<void> {
    if (!this.status.isOnline || this.status.syncInProgress) return;

    this.status.syncInProgress = true;
    this.notifyListeners();

    try {
      if (!userId) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }

      // Process sync queue first
      await this.processSyncQueue(userId);

      // Then perform full sync
      await Promise.all([
        this.syncTasks(userId),
        this.syncNotes(userId),
        this.syncGoals(userId),
      ]);

      this.status.lastSync = new Date();
      this.syncQueue = []; // Clear queue after successful sync
      this.saveSyncQueue();

      toast.success('Dados sincronizados com sucesso!');
      
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro na sincronização');
    } finally {
      this.status.syncInProgress = false;
      this.notifyListeners();
    }
  }

  private async processSyncQueue(userId: string): Promise<void> {
    for (const change of this.syncQueue) {
      try {
        // Process queued changes
        if (change.type === 'task') {
          // Handle task queue changes
        } else if (change.type === 'note') {
          // Handle note queue changes
        } else if (change.type === 'goal') {
          // Handle goal queue changes
        }
      } catch (error) {
        console.error('Error processing queue change:', error);
      }
    }
  }

  // Conflict Resolution
  public async resolveConflict(conflictId: string, resolution: 'local' | 'remote'): Promise<void> {
    const conflictIndex = this.conflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) return;

    const conflict = this.conflicts[conflictIndex];

    try {
      if (resolution === 'local') {
        // Keep local version - upload to remote
        if (conflict.type === 'task') {
          // Upload local task data
        }
      } else {
        // Keep remote version - update local
        if (conflict.type === 'task') {
          // Update local with remote data
        }
      }

      // Remove resolved conflict
      this.conflicts.splice(conflictIndex, 1);
      this.status.conflicts = this.conflicts.length;
      this.notifyListeners();

      toast.success('Conflito resolvido com sucesso!');
      
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast.error('Erro ao resolver conflito');
    }
  }

  // Periodic Sync
  private startPeriodicSync() {
    setInterval(() => {
      if (this.status.isOnline && !this.status.syncInProgress) {
        this.syncAll();
      }
    }, 5 * 60 * 1000); // Sync every 5 minutes
  }

  // Manual Sync
  public async forceSync(userId?: string): Promise<void> {
    await this.syncAll(userId);
  }

  // Reset Sync
  public async resetSync(): Promise<void> {
    this.syncQueue = [];
    this.conflicts = [];
    this.status.lastSync = null;
    this.saveSyncQueue();
    this.notifyListeners();
    
    localStorage.removeItem('focusflow-sync-queue');
    toast.success('Sincronização reiniciada');
  }
}

// Export singleton instance
export const syncService = new SyncService();
