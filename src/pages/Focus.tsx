import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { FlowCorePanel } from '@/components/focus/FlowCorePanel';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, ShieldCheck } from 'lucide-react';

export default function Focus() {
  const { tasks } = useTaskStore();
  const pending = tasks.filter((task) => task.status !== 'completed' && task.lifecycle !== 'archived');

  const adaptiveLine = useMemo(() => {
    const critical = pending.filter((task) => task.priority === 'urgent').length;
    if (critical > 0) return 'Modo comando: execute primeiro as tarefas criticas.';
    if (pending.length === 0) return 'Fluxo limpo. Use este momento para planejar a proxima meta.';
    return 'Estado de fluxo: foco profundo, sem alternancia de contexto.';
  }, [pending]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-slate-100">
        <h1 className="text-2xl font-bold tracking-tight">Area de foco</h1>
        <p className="mt-1 text-slate-300">
          Ambiente de execucao sem ruido visual, feedback em tempo real e senso de missao.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-background to-accent/20">
        <CardContent className="flex items-start gap-3 p-4">
          <Flame className="mt-0.5 h-5 w-5 text-orange-500" />
          <div>
            <p className="font-medium">Mensagem adaptativa</p>
            <p className="text-sm text-muted-foreground">{adaptiveLine}</p>
          </div>
        </CardContent>
      </Card>

      <FlowCorePanel />

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Anti-distracao ativa</p>
            <p className="text-sm text-muted-foreground">
              Sugestao: mantenha somente esta aba aberta durante a sessao e execute uma tarefa por ciclo.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
