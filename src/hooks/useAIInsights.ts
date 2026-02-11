import { useState, useEffect, useCallback } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { AIInsight } from '@/types/task';
import { Task } from '@/types/task';
import { directGeminiService } from '@/services/directGeminiService';
import { toast } from 'sonner';

export function useAIInsights() {
  const { tasks, insights, addInsight, dismissInsight } = useTaskStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Generate insights based on current tasks and stats
  const generateInsights = useCallback(async (timeFrame: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    if (tasks.length === 0) return;

    // Helper functions
    const isToday = (date?: Date): boolean => {
      if (!date) return false;
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const calculateProductiveMinutes = (): number => {
      return tasks
        .filter((t: Task) => t.status === 'completed' && t.actualMinutes)
        .reduce((total: number, t: Task) => total + (t.actualMinutes || 0), 0);
    };

    const calculateCurrentStreak = (): number => {
      const completedTasks = tasks
        .filter((t: Task) => t.status === 'completed' && t.completedAt)
        .sort((a: Task, b: Task) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));

      if (completedTasks.length === 0) return 0;

      let streak = 1;
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const task of completedTasks) {
        if (!task.completedAt) continue;
        
        const taskDate = new Date(task.completedAt);
        taskDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
        } else {
          break;
        }
      }

      return streak - 1;
    };

    const generateId = (): string => {
      return Math.random().toString(36).substr(2, 9);
    };

    setIsGenerating(true);
    try {
      const stats = {
        completedToday: tasks.filter((t: Task) => t.status === 'completed' && isToday(t.completedAt)).length,
        pendingTasks: tasks.filter((t: Task) => t.status === 'pending').length,
        productiveMinutes: calculateProductiveMinutes(),
        currentStreak: calculateCurrentStreak(),
      };

      // Call Gemini API directly
      const data = await directGeminiService.generateInsights(
        tasks.map((t: Task) => ({
          title: t.title,
          priority: t.priority,
          status: t.status,
          completedAt: t.completedAt?.toISOString(),
          estimatedMinutes: t.estimatedMinutes,
          actualMinutes: t.actualMinutes,
        })),
        stats,
        timeFrame
      );
      
      // Add new insights to the store
      data.insights?.forEach((insight: any) => {
        const newInsight: AIInsight = {
          id: generateId(),
          type: insight.type,
          message: insight.message,
          priority: insight.priority || 'medium',
          createdAt: new Date(),
          dismissed: false,
        };
        addInsight(newInsight);
      });

      // Show recommendations as toasts
      data.recommendations?.forEach((rec: string, index: number) => {
        setTimeout(() => {
          toast.success(`💡 ${rec}`);
        }, index * 1000);
      });

      setLastGenerated(new Date());
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar insights');
    } finally {
      setIsGenerating(false);
    }
  }, [tasks, addInsight]);

  // Auto-generate insights periodically
  useEffect(() => {
    // Generate insights on mount if we have tasks
    if (tasks.length > 0 && !lastGenerated) {
      generateInsights('daily');
    }

    // Generate insights every 30 minutes
    const interval = setInterval(() => {
      if (tasks.length > 0) {
        generateInsights('daily');
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks.length, lastGenerated, generateInsights]);

  return {
    insights: insights.filter(i => !i.dismissed),
    isGenerating,
    lastGenerated,
    generateInsights,
    dismissInsight,
    refreshInsights: () => generateInsights('daily'),
  };
}
