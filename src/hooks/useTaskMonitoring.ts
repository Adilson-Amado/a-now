import { useEffect, useCallback, useRef } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalsStore } from '@/stores/goalsStore';
import { notificationsService } from '@/services/notificationsService';
import { useAuth } from '@/contexts/AuthContext';

const HOURS_WITHOUT_TASK_THRESHOLD = 6;
const TASK_DUE_SOON_MINUTES = 60; // 1 hora antes
const CHECK_INTERVAL_MINUTES = 5; // Verificar a cada 5 minutos

interface TaskDueInfo {
  taskId: string;
  taskTitle: string;
  dueDate: Date;
  minutesRemaining: number;
}

interface GoalDelayedInfo {
  goalId: string;
  goalTitle: string;
  targetDate: Date;
  incompleteMilestonesCount: number;
}

export const useTaskMonitoring = () => {
  const { user } = useAuth();
  const tasks = useTaskStore((state) => state.tasks);
  const goals = useGoalsStore((state) => state.goals);
  const lastTaskCreatedRef = useRef<Date | null>(null);
  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const notifiedGoalsRef = useRef<Set<string>>(new Set());

  // Verificar tarefas com data de entrega próxima
  const checkTasksDueSoon = useCallback(async () => {
    if (!user) return;

    const now = new Date();

    tasks.forEach((task) => {
      if (task.status === 'completed' || !task.dueDate) return;

      const dueDate = new Date(task.dueDate);
      const minutesRemaining = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60));

      // Se a tarefa está a chegar (entre 55-65 minutos) e ainda não foi notificada
      if (minutesRemaining > 0 && minutesRemaining <= TASK_DUE_SOON_MINUTES) {
        if (minutesRemaining >= TASK_DUE_SOON_MINUTES - 10 && !notifiedTasksRef.current.has(task.id)) {
          notificationsService.notifyTaskDueSoon(
            user.id,
            task.title,
            `A tarefa "${task.title}" vence em ${minutesRemaining} minutos`
          );
          notifiedTasksRef.current.add(task.id);
        }
      }

      // Notificar quando faltam 30 minutos
      if (minutesRemaining <= 30 && minutesRemaining > 25 && !notifiedTasksRef.current.has(`${task.id}-30min`)) {
        notificationsService.notifyTaskDue30Min(
          user.id,
          task.title,
          `Faltam apenas 30 minutos para o prazo da tarefa "${task.title}"`
        );
        notifiedTasksRef.current.add(`${task.id}-30min`);
      }

      // Notificar quando faltam 15 minutos
      if (minutesRemaining <= 15 && minutesRemaining > 10 && !notifiedTasksRef.current.has(`${task.id}-15min`)) {
        notificationsService.notifyTaskDue30Min(
          user.id,
          task.title,
          `URGENTE: Faltam apenas 15 minutos para o prazo da tarefa "${task.title}"`
        );
        notifiedTasksRef.current.add(`${task.id}-15min`);
      }
    });
  }, [tasks, user]);

  // Verificar metas atrasadas
  const checkGoalsDelayed = useCallback(async () => {
    if (!user) return;

    const now = new Date();

    goals.forEach((goal) => {
      if (goal.completed || !goal.targetDate) return;

      const targetDate = new Date(goal.targetDate);
      const incompleteMilestones = goal.milestones.filter((m) => !m.completed).length;

      // Se a meta está atrasada e tem etapas incompletas
      if (targetDate < now && incompleteMilestones > 0) {
        if (!notifiedGoalsRef.current.has(goal.id)) {
          notificationsService.notifyGoalDelayed(
            user.id,
            goal.title,
            `A meta "${goal.title}" está atrasada e tem ${incompleteMilestones} etapas por concluir`
          );
          notifiedGoalsRef.current.add(goal.id);
        }
      }
    });
  }, [goals, user]);

  // Verificar se passou muito tempo sem criar tarefas
  const checkNoTasksCreated = useCallback(async () => {
    if (!user || !lastTaskCreatedRef.current) return;

    const now = new Date();
    const hoursSinceLastTask = (now.getTime() - lastTaskCreatedRef.current.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastTask >= HOURS_WITHOUT_TASK_THRESHOLD) {
      notificationsService.notifyNoTasksCreated(
        user.id,
        `Já passaram ${HOURS_WITHOUT_TASK_THRESHOLD} horas desde a última tarefa criada. Que tal adicionar novas tarefas para manter o foco?`
      );
      // Resetar para não notificar repetidamente
      lastTaskCreatedRef.current = now;
    }
  }, [user]);

  // Atualizar timestamp quando uma nova tarefa é criada
  const updateLastTaskCreated = useCallback(() => {
    lastTaskCreatedRef.current = new Date();
    // Limpar notificações de tarefas antigas
    notifiedTasksRef.current.clear();
  }, []);

  // Verificação periódica
  useEffect(() => {
    if (!user) return;

    // Inicializar lastTaskCreatedRef com a última tarefa do store
    if (tasks.length > 0) {
      const sortedTasks = [...tasks].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      lastTaskCreatedRef.current = new Date(sortedTasks[0].createdAt);
    }

    // Verificar imediatamente
    checkTasksDueSoon();
    checkGoalsDelayed();

    // Configurar intervalo de verificação
    const intervalId = setInterval(() => {
      checkTasksDueSoon();
      checkGoalsDelayed();
      checkNoTasksCreated();
    }, CHECK_INTERVAL_MINUTES * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      notifiedTasksRef.current.clear();
      notifiedGoalsRef.current.clear();
    };
  }, [user, tasks, goals, checkTasksDueSoon, checkGoalsDelayed, checkNoTasksCreated]);

  return {
    updateLastTaskCreated,
    checkTasksDueSoon,
    checkGoalsDelayed,
  };
};
