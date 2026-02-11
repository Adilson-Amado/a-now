import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGoalsStore, Goal } from '@/stores/goalsStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Plus, Target, Pause, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { AdvancedGoalForm } from '@/components/goals/AdvancedGoalForm';

export default function Goals() {
  const { goals, updateProgress } = useGoalsStore();
  const [open, setOpen] = useState(false);

  const activeGoals = goals.filter((goal) => !goal.completed && goal.lifecycle !== 'archived');
  const archivedGoals = goals.filter((goal) => goal.lifecycle === 'archived');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-muted-foreground">Progresso mensuravel com protecao contra abandono impulsivo.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova meta
        </Button>
      </div>

      <AdvancedGoalForm open={open} onOpenChange={setOpen} />

      <Section title="Metas ativas" goals={activeGoals} onProgressChange={updateProgress} />
      {archivedGoals.length > 0 && <Section title="Arquivadas" goals={archivedGoals} onProgressChange={updateProgress} />}
    </motion.div>
  );
}

function Section({
  title,
  goals,
  onProgressChange,
}: {
  title: string;
  goals: Goal[];
  onProgressChange: (id: string, progress: number) => void;
}) {
  if (goals.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onProgressChange={onProgressChange} />
        ))}
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  onProgressChange,
}: {
  goal: Goal;
  onProgressChange: (id: string, progress: number) => void;
}) {
  const { deleteGoal, archiveGoal, pauseGoal, reactivateGoal } = useGoalsStore();
  const [deleteStep, setDeleteStep] = useState(0);
  const [cooldown, setCooldown] = useState(4);

  useEffect(() => {
    if (deleteStep < 2 || cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [deleteStep, cooldown]);

  useEffect(() => {
    setDeleteStep(0);
    setCooldown(4);
  }, [goal.id]);

  return (
    <Card className={goal.lifecycle === 'paused' ? 'border-yellow-400/50' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {goal.title}
          </span>
          <span className="text-xs text-muted-foreground">{goal.lifecycle || 'active'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>
        {!goal.completed && goal.lifecycle !== 'archived' && (
          <Slider value={[goal.progress]} onValueChange={([value]) => onProgressChange(goal.id, value)} max={100} step={5} />
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => pauseGoal(goal.id)}>
            <Pause className="mr-1 h-3.5 w-3.5" />
            Pausar
          </Button>
          <Button size="sm" variant="outline" onClick={() => archiveGoal(goal.id)}>
            <Archive className="mr-1 h-3.5 w-3.5" />
            Arquivar
          </Button>
          <Button size="sm" variant="outline" onClick={() => reactivateGoal(goal.id)}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reativar
          </Button>
        </div>

        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs">
          <p className="font-medium text-destructive">Exclusao com friccao</p>
          <p className="text-muted-foreground">Voce tem certeza que quer abandonar esta meta?</p>
          <p className="text-muted-foreground">Esta acao quebra a consistencia do seu progresso.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" onClick={() => setDeleteStep((step) => Math.min(step + 1, 2))}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Confirmacao {deleteStep + 1}/3
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={deleteStep < 2 || cooldown > 0}
              onClick={() => deleteGoal(goal.id)}
            >
              Apagar {cooldown > 0 ? `(${cooldown}s)` : ''}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
