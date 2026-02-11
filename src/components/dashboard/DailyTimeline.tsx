import { motion } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types/task';

interface TimeBlock {
  hour: number;
  label: string;
  tasks: Task[];
}

export function DailyTimeline() {
  const { tasks } = useTaskStore();
  const now = new Date();
  const currentHour = now.getHours();

  // Create time blocks for the day (6 AM to 10 PM)
  const timeBlocks: TimeBlock[] = [];
  for (let hour = 6; hour <= 22; hour += 2) {
    const blockTasks = tasks.filter((task) => {
      const taskDate = task.completedAt || task.createdAt;
      const taskHour = new Date(taskDate).getHours();
      return taskHour >= hour && taskHour < hour + 2;
    });

    timeBlocks.push({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      tasks: blockTasks,
    });
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        Linha do tempo
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-1">
          {timeBlocks.map((block, index) => {
            const isPast = block.hour < currentHour;
            const isCurrent = block.hour <= currentHour && block.hour + 2 > currentHour;
            const completedTasks = block.tasks.filter((t) => t.status === 'completed');

            return (
              <motion.div
                key={block.hour}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'relative flex items-start gap-3 py-2',
                  !isPast && !isCurrent && 'opacity-40'
                )}
              >
                {/* Time indicator */}
                <div
                  className={cn(
                    'relative z-10 w-12 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isPast
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {block.label}
                </div>

                {/* Tasks in this block */}
                <div className="flex-1 min-w-0">
                  {completedTasks.length > 0 ? (
                    <div className="space-y-1">
                      {completedTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-productive flex-shrink-0" />
                          <span className="text-foreground truncate">
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {completedTasks.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{completedTasks.length - 2} mais
                        </span>
                      )}
                    </div>
                  ) : isPast ? (
                    <span className="text-xs text-muted-foreground italic">
                      Sem atividade
                    </span>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
