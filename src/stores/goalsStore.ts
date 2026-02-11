import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      
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
      },
      
      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, ...updates } : goal
          ),
        }));
      },
      
      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
      },

      archiveGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, lifecycle: 'archived', updatedAt: new Date() } : goal
          ),
        }));
      },

      pauseGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, lifecycle: 'paused', updatedAt: new Date() } : goal
          ),
        }));
      },

      reactivateGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, lifecycle: 'active', updatedAt: new Date() } : goal
          ),
        }));
      },
      
      updateProgress: (id, progress) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { 
              ...goal, 
              progress, 
              completed: progress >= 100,
              completedAt: progress >= 100 ? new Date() : undefined,
              updatedAt: new Date()
            } : goal
          ),
        }));
      },
      
      completeSession: (id) => {
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
                updatedAt: new Date()
              };
            }
            return goal;
          }),
        }));
      },
      
      updateMilestone: (id, milestoneId, completed) => {
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
                updatedAt: new Date()
              };
            }
            return goal;
          }),
        }));
      },
      
      updateFinancialProgress: (id, currentAmount) => {
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
                updatedAt: new Date()
              };
            }
            return goal;
          }),
        }));
      },
    }),
    {
      name: 'focus-flow-goals',
    }
  )
);
