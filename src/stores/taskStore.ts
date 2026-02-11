import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIInsight, DailyStats, FocusSession, Task, TaskStatus, TimelineEntry } from '@/types/task';

interface TaskState {
  tasks: Task[];
  insights: AIInsight[];
  timeline: TimelineEntry[];
  dailyStats: DailyStats[];
  focusSessions: FocusSession[];
  activeFlowTaskId?: string;

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

const generateId = () => Math.random().toString(36).slice(2, 11);

const createDemoTasks = (): Task[] => {
  const now = new Date();
  return [
    {
      id: generateId(),
      title: 'Revisar proposta do cliente',
      description: 'Analisar e responder proposta comercial',
      priority: 'urgent',
      status: 'pending',
      lifecycle: 'active',
      aiRecommendation: 'do-now',
      aiReason: 'Prazo curto e alto impacto no negocio',
      createdAt: new Date(now.getTime() - 3600000),
      updatedAt: new Date(now.getTime() - 3600000),
      estimatedMinutes: 45,
      category: 'Comercial',
      effortLevel: 'heavy',
      taskType: 'deep-focus',
    },
    {
      id: generateId(),
      title: 'Preparar apresentacao semanal',
      description: 'Slides para reuniao da equipe',
      priority: 'important',
      status: 'in-progress',
      lifecycle: 'active',
      aiRecommendation: 'do-now',
      aiReason: 'Reuniao marcada para amanha',
      createdAt: new Date(now.getTime() - 7200000),
      updatedAt: new Date(now.getTime() - 7200000),
      estimatedMinutes: 60,
      category: 'Projeto Alpha',
      effortLevel: 'medium',
      taskType: 'creative',
    },
  ];
};

const createDemoInsights = (): AIInsight[] => [
  {
    id: generateId(),
    type: 'tip',
    message: 'Seu pico de execucao esta entre 9h e 11h. Priorize tarefas de foco profundo nesse horario.',
    priority: 'medium',
    createdAt: new Date(),
  },
];

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: createDemoTasks(),
      insights: createDemoInsights(),
      timeline: [],
      dailyStats: [],
      focusSessions: [],
      activeFlowTaskId: undefined,

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
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          focusSessions: state.focusSessions.filter((session) => session.taskId !== id),
          activeFlowTaskId: state.activeFlowTaskId === id ? undefined : state.activeFlowTaskId,
        }));
      },

      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: 'completed' as TaskStatus,
                  completedAt: new Date(),
                  lifecycle: 'active',
                  updatedAt: new Date(),
                }
              : task
          ),
        }));
      },

      archiveTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, lifecycle: 'archived', updatedAt: new Date() } : task
          ),
        }));
      },

      pauseTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, lifecycle: 'paused', updatedAt: new Date() } : task
          ),
        }));
      },

      reactivateTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, lifecycle: 'active', updatedAt: new Date() } : task
          ),
        }));
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
