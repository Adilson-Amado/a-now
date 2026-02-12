import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { AIInsight, DailyStats, FocusSession, Task, TaskStatus, TimelineEntry } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';

interface TaskState {
  tasks: Task[];
  insights: AIInsight[];
  timeline: TimelineEntry[];
  dailyStats: DailyStats[];
  focusSessions: FocusSession[];
  activeFlowTaskId?: string;

  setTasks: (tasks: Task[]) => void;
  clearTasks: () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  upsertTaskFromSync: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  archiveTask: (id: string) => void;
  pauseTask: (id: string) => void;
  reactivateTask: (id: string) => void;

  setActiveFlowTask: (taskId?: string) => void;
  startFocusSession: (taskId: string, plannedMinutes: number, cycleIndex: number, moodBefore?: FocusSession['moodBefore']) => string;
  endFocusSession: (sessionId: string, moodAfter?: FocusSession['moodAfter'], cognitiveLoad?: FocusSession['cognitiveLoad']) => void;
  getTaskFocusSessions: (taskId: string) => FocusSession[];

  addInsight: (insight: Omit<AIInsight, 'id' | 'createdAt'>) => void;
  dismissInsight: (id: string) => void;
  addTimelineEntry: (entry: Omit<TimelineEntry, 'id'>) => void;

  getTodaysTasks: () => Task[];
  getCompletedToday: () => Task[];
  getPendingTasks: () => Task[];
  getProductivityState: () => 'productive' | 'partial' | 'unproductive';
}

const generateId = () => uuidv4();

const persistTaskCreate = async (task: Task) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('sync_tasks').insert({
      local_id: task.id,
      user_id: user.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.dueDate?.toISOString(),
      created_at: task.createdAt.toISOString(),
      updated_at: (task.updatedAt || task.createdAt).toISOString(),
      completed_at: task.completedAt?.toISOString(),
      estimated_minutes: task.estimatedMinutes,
      actual_minutes: task.actualMinutes,
      tags: task.tags,
      ai_recommendation: task.aiRecommendation,
      ai_reason: task.aiReason,
    } as any);
  } catch (error) {
    console.error('Error persisting task create:', error);
  }
};

const persistTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('sync_tasks')
      .update({
        title: updates.title,
        description: updates.description,
        priority: updates.priority,
        status: updates.status,
        due_date: updates.dueDate?.toISOString(),
        updated_at: updates.updatedAt?.toISOString() || new Date().toISOString(),
        completed_at: updates.completedAt?.toISOString(),
        estimated_minutes: updates.estimatedMinutes,
        actual_minutes: updates.actualMinutes,
        tags: updates.tags,
        ai_recommendation: updates.aiRecommendation,
        ai_reason: updates.aiReason,
      } as any)
      .eq('user_id', user.id)
      .eq('local_id', taskId);
  } catch (error) {
    console.error('Error persisting task update:', error);
  }
};

const persistTaskDelete = async (taskId: string) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('sync_tasks').delete().eq('user_id', user.id).eq('local_id', taskId);
  } catch (error) {
    console.error('Error persisting task delete:', error);
  }
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      insights: [],
      timeline: [],
      dailyStats: [],
      focusSessions: [],
      activeFlowTaskId: undefined,

      setTasks: (tasks) => set({ tasks }),
      clearTasks: () =>
        set({
          tasks: [],
          timeline: [],
          dailyStats: [],
          focusSessions: [],
          activeFlowTaskId: undefined,
        }),

      addTask: (task) => {
        const now = new Date();
        const newTask: Task = {
          ...task,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          lifecycle: task.lifecycle || 'active',
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        void persistTaskCreate(newTask);
      },

      upsertTaskFromSync: (task) => {
        set((state) => {
          const exists = state.tasks.some((item) => item.id === task.id);
          if (!exists) {
            return { tasks: [task, ...state.tasks] };
          }
          return {
            tasks: state.tasks.map((item) => (item.id === task.id ? task : item)),
          };
        });
      },

      updateTask: (id, updates) => {
        const updatedAt = new Date();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt } : task
          ),
        }));
        void persistTaskUpdate(id, { ...updates, updatedAt });
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          focusSessions: state.focusSessions.filter((session) => session.taskId !== id),
          activeFlowTaskId: state.activeFlowTaskId === id ? undefined : state.activeFlowTaskId,
        }));
        void persistTaskDelete(id);
      },

      completeTask: (id) => {
        const completedAt = new Date();
        const updatedAt = new Date();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: 'completed' as TaskStatus,
                  completedAt,
                  lifecycle: 'active',
                  updatedAt,
                }
              : task
          ),
        }));
        void persistTaskUpdate(id, {
          status: 'completed',
          completedAt,
          lifecycle: 'active',
          updatedAt,
        });
      },

      archiveTask: (id) => {
        const updatedAt = new Date();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, lifecycle: 'archived', updatedAt } : task
          ),
        }));
        void persistTaskUpdate(id, { lifecycle: 'archived', updatedAt });
      },

      pauseTask: (id) => {
        const updatedAt = new Date();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, lifecycle: 'paused', updatedAt } : task
          ),
        }));
        void persistTaskUpdate(id, { lifecycle: 'paused', updatedAt });
      },

      reactivateTask: (id) => {
        const updatedAt = new Date();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, lifecycle: 'active', updatedAt } : task
          ),
        }));
        void persistTaskUpdate(id, { lifecycle: 'active', updatedAt });
      },

      setActiveFlowTask: (taskId) => set({ activeFlowTaskId: taskId }),

      startFocusSession: (taskId, plannedMinutes, cycleIndex, moodBefore) => {
        const sessionId = generateId();
        const startedAt = new Date();
        const session: FocusSession = {
          id: sessionId,
          taskId,
          startedAt,
          plannedMinutes,
          cycleIndex,
          moodBefore,
        };

        set((state) => ({
          focusSessions: [session, ...state.focusSessions],
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'in-progress',
                  lastFocusStartedAt: startedAt,
                  updatedAt: new Date(),
                }
              : task
          ),
        }));

        return sessionId;
      },

      endFocusSession: (sessionId, moodAfter, cognitiveLoad) => {
        const session = get().focusSessions.find((item) => item.id === sessionId);
        if (!session || session.endedAt) return;

        const endedAt = new Date();
        const actualMinutes = Math.max(
          1,
          Math.round((endedAt.getTime() - new Date(session.startedAt).getTime()) / 60000)
        );

        set((state) => ({
          focusSessions: state.focusSessions.map((item) =>
            item.id === sessionId
              ? { ...item, endedAt, actualMinutes, moodAfter, cognitiveLoad }
              : item
          ),
          tasks: state.tasks.map((task) =>
            task.id === session.taskId
              ? {
                  ...task,
                  lastFocusEndedAt: endedAt,
                  totalFocusMinutes: (task.totalFocusMinutes || 0) + actualMinutes,
                  actualMinutes: (task.actualMinutes || 0) + actualMinutes,
                  updatedAt: new Date(),
                }
              : task
          ),
        }));
      },

      getTaskFocusSessions: (taskId) =>
        get().focusSessions
          .filter((session) => session.taskId === taskId)
          .sort(
            (a, b) =>
              new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
          ),

      addInsight: (insight) => {
        const newInsight: AIInsight = {
          ...insight,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({ insights: [newInsight, ...state.insights] }));
      },

      dismissInsight: (id) => {
        set((state) => ({
          insights: state.insights.map((insight) =>
            insight.id === id ? { ...insight, dismissed: true } : insight
          ),
        }));
      },

      addTimelineEntry: (entry) => {
        const newEntry: TimelineEntry = {
          ...entry,
          id: generateId(),
        };
        set((state) => ({ timeline: [...state.timeline, newEntry] }));
      },

      getTodaysTasks: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().tasks.filter((task) => {
          const taskDate = new Date(task.createdAt);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
      },

      getCompletedToday: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().tasks.filter((task) => {
          if (!task.completedAt) return false;
          const completedDate = new Date(task.completedAt);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        });
      },

      getPendingTasks: () => {
        return get().tasks.filter(
          (task) =>
            (task.status === 'pending' || task.status === 'in-progress') &&
            task.lifecycle !== 'archived'
        );
      },

      getProductivityState: () => {
        const completedToday = get().getCompletedToday();
        if (completedToday.length >= 3) return 'productive';
        if (completedToday.length >= 1) return 'partial';
        return 'unproductive';
      },
    }),
    {
      name: 'focus-flow-tasks',
    }
  )
);
