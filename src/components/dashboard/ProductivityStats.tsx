import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useTaskStore } from '@/stores/taskStore';
import { CheckCircle2, Circle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductivityStats() {
  const { getPendingTasks, getCompletedToday } = useTaskStore();
  const pending = getPendingTasks();
  const completed = getCompletedToday();
  const critical = pending.filter((task) => task.priority === 'urgent').length;

  const stats = [
    { label: 'Concluidas hoje', value: completed.length, icon: CheckCircle2, color: 'text-productive' },
    { label: 'Pendentes', value: pending.length, icon: Circle, color: 'text-muted-foreground' },
    { label: 'Criticas', value: critical, icon: Zap, color: 'text-urgent' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-xl border bg-card p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Icon className={cn('h-4 w-4', stat.color)} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export function ProductivityIndicator() {
  const { getProductivityState, getCompletedToday } = useTaskStore();
  const state = getProductivityState();
  const completed = getCompletedToday();

  const stateConfig = {
    productive: { label: 'Produtivo', description: 'Ritmo forte de execucao', className: 'state-productive', textColor: 'text-productive' },
    partial: { label: 'Parcial', description: 'Progresso constante', className: 'state-partial', textColor: 'text-partial' },
    unproductive: { label: 'A iniciar', description: 'Hora de entrar em fluxo', className: 'state-unproductive', textColor: 'text-muted-foreground' },
  };

  const config = stateConfig[state];
  const progress = Math.min(completed.length * 20, 100);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', config.className)} />
            <span className={cn('text-sm font-medium', config.textColor)}>{config.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{completed.length}</p>
          <p className="text-xs text-muted-foreground">tarefas hoje</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>Progresso diario</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={cn('h-full rounded-full', config.className)} />
        </div>
      </div>
    </motion.div>
  );
}

export function DayHeader() {
  const today = new Date();
  const formatted = format(today, "EEEE, d 'de' MMMM", { locale: pt });
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div>
      <p className="mb-1 text-sm text-muted-foreground">{formatted}</p>
      <h1 className="text-3xl font-bold">{greeting}</h1>
    </div>
  );
}
