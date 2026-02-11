import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Task } from '@/types/task';
import { useTaskStore } from '@/stores/taskStore';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Clock3, Pause, Archive, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskDetailsModal } from './TaskDetailsModal';

interface TaskCardProps {
  task: Task;
  compact?: boolean;
}

const statusLabel: Record<Task['status'], string> = {
  pending: 'Pendente',
  'in-progress': 'Em execucao',
  completed: 'Concluida',
  cancelled: 'Cancelada',
};

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const { completeTask, updateTask, pauseTask, archiveTask, reactivateTask } = useTaskStore();
  const [open, setOpen] = useState(false);
  const isCompleted = task.status === 'completed';

  const dueText = useMemo(() => {
    if (!task.dueDate) return 'Sem prazo';
    return formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: pt });
  }, [task.dueDate]);

  const handleComplete = () => {
    if (isCompleted) {
      updateTask(task.id, { status: 'pending', completedAt: undefined });
      return;
    }
    completeTask(task.id);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={cn(
          'rounded-xl border bg-card px-3 py-2.5 transition-colors',
          'hover:border-primary/30',
          isCompleted && 'opacity-70'
        )}
      >
        <div className="flex items-start gap-2.5">
          <Checkbox checked={isCompleted} onCheckedChange={handleComplete} className="mt-0.5 h-4 w-4" />

          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => setOpen(true)}
          >
            <h3 className={cn('truncate text-sm font-semibold', isCompleted && 'line-through text-muted-foreground')}>
              {task.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock3 className="h-3 w-3" />
              <span>{dueText}</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              <span>{statusLabel[task.status]}</span>
            </div>
          </button>

          <div className="flex items-center gap-1">
            {task.lifecycle === 'paused' ? (
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reactivateTask(task.id)}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => pauseTask(task.id)}>
                <Pause className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => archiveTask(task.id)}>
              <Archive className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {!compact && (
          <div className="mt-2 flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {task.category && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {task.category}
              </span>
            )}
            {task.taskType && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {task.taskType}
              </span>
            )}
          </div>
        )}
      </motion.div>

      <TaskDetailsModal task={task} open={open} onOpenChange={setOpen} />
    </>
  );
}

interface TaskListProps {
  tasks: Task[];
  emptyMessage?: string;
  compact?: boolean;
}

export function TaskList({ tasks, emptyMessage = 'Nenhuma tarefa', compact = false }: TaskListProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {tasks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </motion.div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} compact={compact} />)
        )}
      </AnimatePresence>
    </div>
  );
}
