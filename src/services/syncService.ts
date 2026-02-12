import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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

export interface SyncQueueItem {
  id: string;
  type: 'task' | 'note' | 'goal';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

class SyncService {
  private syncQueue: SyncQueueItem[] = [];
  private status: SyncStatus = {
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0,
    syncInProgress: false,
    conflicts: 0,
  };

  private conflicts: SyncConflict[] = [];
  private listeners: Array<(status: SyncStatus) => void> = [];
  private cleanupFns: (() => void)[] = [];

  constructor() {
    this.setupEventListeners();
    this.loadSyncQueue();
  }

  // Event Listeners
  private setupEventListeners() {
    const handleOnline = () => {
      this.status.isOnline = true;
      this.notifyListeners();
      this.processQueue();
    };

    const handleOffline = () => {
      this.status.isOnline = false;
      this.notifyListeners();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'focusflow-sync-queue') {
        this.loadSyncQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorage);

    this.cleanupFns.push(
      () => window.removeEventListener('online', handleOnline),
      () => window.removeEventListener('offline', handleOffline),
      () => window.removeEventListener('storage', handleStorage)
    );
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
        this.syncQueue = JSON.parse(stored, (_key: string, value: unknown) => {
          // Deserialize dates
          if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            return new Date(value);
          }
          return value;
        });
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
    const pendingItems = this.syncQueue.filter(item => item.retryCount < item.maxRetries);
    this.status.pendingChanges = pendingItems.length;
    this.notifyListeners();
  }

  // Queue Operations
  public queueChange(type: 'task' | 'note' | 'goal', action: 'create' | 'update' | 'delete', data: any): string {
    const item: SyncQueueItem = {
      id: uuidv4(),
      type,
      action,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.syncQueue.push(item);
    this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.status.isOnline && !this.status.syncInProgress) {
      this.processQueue();
    }

    return item.id;
  }

  public removeFromQueue(itemId: string) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== itemId);
    this.saveSyncQueue();
  }

  public clearQueue() {
    this.syncQueue = [];
    this.saveSyncQueue();
  }

  // Queue Processing with Retry Logic
  public async processQueue(): Promise<void> {
    if (!this.status.isOnline || this.status.syncInProgress) return;

    this.status.syncInProgress = true;
    this.notifyListeners();

    const pendingItems = this.syncQueue.filter(item => item.retryCount < item.maxRetries);

    for (const item of pendingItems) {
      try {
        await this.processQueueItem(item);
        this.removeFromQueue(item.id);
      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error);
        item.retryCount++;
        this.saveSyncQueue();
      }
    }

    this.status.syncInProgress = false;
    this.status.lastSync = new Date();
    this.notifyListeners();
  }

  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const tableName = `sync_${item.type}s`;
    const localId = item.data.id;

    switch (item.action) {
      case 'create':
        await (supabase.from(tableName) as any).upsert({
          local_id: localId,
          user_id: user.id,
          title: item.data.title,
          description: item.data.description,
          priority: item.data.priority,
          status: item.data.status,
          due_date: item.data.dueDate?.toISOString?.() || item.data.dueDate,
          created_at: item.data.createdAt?.toISOString?.() || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        break;

      case 'update':
        await (supabase.from(tableName) as any).update({
          title: item.data.title,
          description: item.data.description,
          priority: item.data.priority,
          status: item.data.status,
          due_date: item.data.dueDate?.toISOString?.() || item.data.dueDate,
          updated_at: new Date().toISOString(),
        })
          .eq('local_id', localId)
          .eq('user_id', user.id);
        break;

      case 'delete':
        await (supabase.from(tableName) as any)
          .delete()
          .eq('local_id', localId)
          .eq('user_id', user.id);
        break;
    }
  }

  // Cleanup
  public destroy() {
    this.cleanupFns.forEach(fn => fn());
    this.listeners = [];
  }
}

// Singleton instance
export const syncService = new SyncService();
