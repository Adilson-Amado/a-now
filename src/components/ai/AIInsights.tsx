import { motion } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { AIInsight } from '@/types/task';
import { Sparkles, Lightbulb, AlertTriangle, TrendingUp, Award, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const insightConfig: Record<AIInsight['type'], { icon: typeof Lightbulb; className: string }> = {
  tip: { icon: Lightbulb, className: 'bg-accent text-accent-foreground border-primary/20' },
  warning: { icon: AlertTriangle, className: 'bg-can-wait/10 text-can-wait-foreground border-can-wait/20' },
  suggestion: { icon: TrendingUp, className: 'bg-primary/10 text-primary border-primary/20' },
  praise: { icon: Award, className: 'bg-productive/10 text-productive border-productive/30' },
};

function AIInsightCard({ insight }: { insight: AIInsight }) {
  const { dismissInsight } = useTaskStore();
  const config = insightConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className={cn('relative rounded-xl border p-4', config.className)}
    >
      <button className="absolute right-2 top-2 rounded-full p-1 hover:bg-foreground/10" onClick={() => dismissInsight(insight.id)}>
        <X className="h-3 w-3" />
      </button>
      <div className="flex items-start gap-3 pr-5">
        <div className="rounded-lg bg-background/50 p-2">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm">{insight.message}</p>
      </div>
    </motion.div>
  );
}

export function AIInsightsPanel() {
  const { insights } = useTaskStore();
  const activeInsights = insights.filter((item) => !item.dismissed);

  if (activeInsights.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">Sem insights no momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary" />
        Insights da IA
      </div>
      {activeInsights.map((insight) => (
        <AIInsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

export function AIAssistantBanner() {
  const { getPendingTasks, getCompletedToday } = useTaskStore();
  const pending = getPendingTasks();
  const completed = getCompletedToday();
  const criticalCount = pending.filter((task) => task.priority === 'urgent').length;

  let type: AIInsight['type'] = 'tip';
  let message = 'Avance uma etapa por vez.';

  if (criticalCount > 0) {
    type = 'warning';
    message = `Existem ${criticalCount} tarefa(s) critica(s). Inicie pelo impacto mais alto.`;
  } else if (completed.length >= 3) {
    type = 'praise';
    message = 'Ritmo excelente hoje. Mantenha consistencia no proximo ciclo.';
  } else if (pending.length > 0) {
    type = 'suggestion';
    message = 'Programe um ciclo FlowCore para a proxima tarefa importante.';
  }

  const Icon = insightConfig[type].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-3 rounded-xl border p-4', insightConfig[type].className)}
    >
      <div className="rounded-lg bg-background/50 p-2">
        <Icon className="h-4 w-4" />
      </div>
      <p className="flex-1 text-sm">{message}</p>
      <Sparkles className="h-4 w-4 opacity-50" />
    </motion.div>
  );
}
