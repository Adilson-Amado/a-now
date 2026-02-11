import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'education' | 'fitness' | 'financial' | 'career' | 'personal' | 'other';
  targetDate?: Date;
  progress: number; // 0-100
  
  // Education specific
  totalSessions?: number;
  completedSessions?: number;
  sessionDuration?: number; // minutes
  sessionDays?: string[]; // ['monday', 'wednesday', 'friday']
  
  // Fitness specific
  workoutType?: string;
  workoutDays?: string[];
  workoutDuration?: number;
  
  // Financial specific
  targetAmount?: number;
  currentAmount?: number;
  currency?: string;
  
  // General tracking
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
  completed: boolean;
  completedAt?: Date;
  lifecycle?: 'active' | 'paused' | 'archived';
}

interface GoalsState {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  clearGoals: () => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'completed' | 'completedAt' | 'completedSessions'>) => void;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteGoal: (id: string) => void;
  archiveGoal: (id: string) => void;
  pauseGoal: (id: string) => void;
  reactivateGoal: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  completeSession: (id: string) => void;
  updateMilestone: (id: string, milestoneId: string, completed: boolean) => void;
  updateFinancialProgress: (id: string, currentAmount: number) => void;
  _migrateGoals: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const normalizeGoalCategory = (category?: string) => {
  const allowed = new Set(['personal', 'work', 'ideas', 'todo', 'learning', 'other']);
  if (category && allowed.has(category)) return category;
  return 'personal';
};

const persistGoalCreate = async (goal: Goal) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('sync_goals').insert({
      local_id: goal.id,
      user_id: user.id,
      title: goal.title,
      description: goal.description,
      category: normalizeGoalCategory(goal.category),
      target_date: goal.targetDate?.toISOString(),
      progress: goal.progress,
      created_at: goal.createdAt.toISOString(),
      updated_at: goal.updatedAt.toISOString(),
    } as any);
  } catch (error) {
    console.error('Error persisting goal create:', error);
  }
};

const persistGoalUpdate = async (goalId: string, updates: Partial<Goal>) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('sync_goals')
      .update({
        title: updates.title,
        description: updates.description,
        category: updates.category ? normalizeGoalCategory(updates.category) : undefined,
        target_date: updates.targetDate?.toISOString(),
        progress: updates.progress,
        updated_at: updates.updatedAt?.toISOString() || new Date().toISOString(),
      } as any)
      .eq('user_id', user.id)
      .eq('local_id', goalId);
  } catch (error) {
    console.error('Error persisting goal update:', error);
  }
};

const persistGoalDelete = async (goalId: string) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('sync_goals').delete().eq('user_id', user.id).eq('local_id', goalId);
  } catch (error) {
    console.error('Error persisting goal delete:', error);
  }
};

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      setGoals: (goals) => set({ goals }),
      clearGoals: () => set({ goals: [] }),
      
      // Migration function to handle old data
      _migrateGoals: () => {
        const goals = get().goals;
        const migratedGoals = goals.map(goal => ({
          ...goal,
          category: goal.category || 'personal',
          milestones: goal.milestones || [],
          completedSessions: goal.completedSessions || 0,
          updatedAt: goal.updatedAt || new Date(),
          completedAt: goal.completedAt,
          lifecycle: goal.lifecycle || 'active',
        }));
        set({ goals: migratedGoals });
      },
      
      addGoal: (goal) => {
        const newGoal: Goal = {
          ...goal,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          progress: 0,
          completed: false,
          completedSessions: 0,
          milestones: goal.milestones || [],
          lifecycle: 'active',
        };
        set((state) => ({ goals: [newGoal, ...state.goals] }));
        void persistGoalCreate(newGoal);
      },
      
      updateGoal: (id, updates) => {
        const updatedAt = new Date();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, ...updates, updatedAt } : goal
          ),
        }));
        void persistGoalUpdate(id, { ...updates, updatedAt } as Goal);
      },
      
      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
        void persistGoalDelete(id);
      },

      archiveGoal: (id) => {
        const updatedAt = new Date();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, lifecycle: 'archived', updatedAt } : goal
          ),
        }));
        void persistGoalUpdate(id, { lifecycle: 'archived', updatedAt } as Goal);
      },

      pauseGoal: (id) => {
        const updatedAt = new Date();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, lifecycle: 'paused', updatedAt } : goal
          ),
        }));
        void persistGoalUpdate(id, { lifecycle: 'paused', updatedAt } as Goal);
      },

      reactivateGoal: (id) => {
        const updatedAt = new Date();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, lifecycle: 'active', updatedAt } : goal
          ),
        }));
        void persistGoalUpdate(id, { lifecycle: 'active', updatedAt } as Goal);
      },
      
      updateProgress: (id, progress) => {
        const updatedAt = new Date();
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { 
              ...goal, 
              progress, 
              completed: progress >= 100,
              completedAt: progress >= 100 ? new Date() : undefined,
              updatedAt
            } : goal
          ),
        }));
        void persistGoalUpdate(id, {
          progress,
          completed: progress >= 100,
          completedAt: progress >= 100 ? new Date() : undefined,
          updatedAt,
        } as Goal);
      },
      
      completeSession: (id) => {
        const updatedAt = new Date();
        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.id === id && goal.totalSessions) {
              const newCompletedSessions = (goal.completedSessions || 0) + 1;
              const progress = Math.min((newCompletedSessions / goal.totalSessions) * 100, 100);
              return {
                ...goal,
                completedSessions: newCompletedSessions,
                progress,
                completed: progress >= 100,
                completedAt: progress >= 100 ? new Date() : undefined,
                updatedAt
              };
            }
            return goal;
          }),
        }));
        void persistGoalUpdate(id, { updatedAt } as Goal);
      },
      
      updateMilestone: (id, milestoneId, completed) => {
        const updatedAt = new Date();
        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.id === id) {
              const updatedMilestones = goal.milestones.map(milestone =>
                milestone.id === milestoneId
                  ? { ...milestone, completed, completedAt: completed ? new Date() : undefined }
                  : milestone
              );
              const completedMilestones = updatedMilestones.filter(m => m.completed).length;
              const progress = goal.milestones.length > 0 ? (completedMilestones / goal.milestones.length) * 100 : 0;
              return {
                ...goal,
                milestones: updatedMilestones,
                progress,
                completed: progress >= 100,
                completedAt: progress >= 100 ? new Date() : undefined,
                updatedAt
              };
            }
            return goal;
          }),
        }));
        void persistGoalUpdate(id, { updatedAt } as Goal);
      },
      
      updateFinancialProgress: (id, currentAmount) => {
        const updatedAt = new Date();
        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.id === id && goal.targetAmount) {
              const progress = Math.min((currentAmount / goal.targetAmount) * 100, 100);
              return {
                ...goal,
                currentAmount,
                progress,
                completed: progress >= 100,
                completedAt: progress >= 100 ? new Date() : undefined,
                updatedAt
              };
            }
            return goal;
          }),
        }));
        void persistGoalUpdate(id, { updatedAt } as Goal);
      },
    }),
    {
      name: 'focus-flow-goals',
    }
  )
);
