import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Gauge, Rocket, Timer, Trophy, Maximize2 } from 'lucide-react';
import FocusFullscreen from './FocusFullscreen';

type FlowPhase = 'idle' | 'focus' | 'recovery';

const MOTIVATION_LINES = [
  'Missao em curso. Zero distracoes.',
  'Cada minuto de foco compoe sua consistencia.',
  'Respire, execute, finalize.',
  'Seu progresso real acontece neste bloco.',
];

const requestFullscreen = async () => {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };

  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
};

const exitFullscreen = async () => {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  };
  if (doc.exitFullscreen) return doc.exitFullscreen();
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
  if (doc.msExitFullscreen) return doc.msExitFullscreen();
};

export function FlowCorePanel() {
  const {
    tasks,
    activeFlowTaskId,
    setActiveFlowTask,
    startFocusSession,
    endFocusSession,
    addInsight,
    updateTask,
    getTaskFocusSessions,
  } = useTaskStore();
  const notifications = useDesktopNotifications();
  const isMobile = useIsMobile();

  const [phase, setPhase] = useState<FlowPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [cycle, setCycle] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  const selectableTasks = useMemo(
    () =>
      tasks.filter(
        (task) => (task.status === 'pending' || task.status === 'in-progress') && task.lifecycle !== 'archived'
      ),
    [tasks]
  );

  const activeTask = useMemo(
    () => selectableTasks.find((task) => task.id === activeFlowTaskId) || null,
    [selectableTasks, activeFlowTaskId]
  );

  const adaptiveMinutes = useMemo(() => {
    if (!activeTask) return 25;
    const sessions = getTaskFocusSessions(activeTask.id).filter((session) => session.actualMinutes);
    if (sessions.length === 0) {
      return activeTask.effortLevel === 'heavy' ? 35 : activeTask.effortLevel === 'light' ? 20 : 25;
    }
    const avg = Math.round(
      sessions.reduce((sum, session) => sum + (session.actualMinutes || 0), 0) / sessions.length
    );
    return Math.min(50, Math.max(15, avg));
  }, [activeTask, getTaskFocusSessions]);

  useEffect(() => {
    setPlannedMinutes(adaptiveMinutes);
  }, [adaptiveMinutes]);

  useEffect(() => {
    if (phase === 'idle' || secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, secondsLeft]);

  const unlockOrientation = useCallback(async () => {
    try {
      const orientationApi = screen.orientation as ScreenOrientation & { unlock?: () => void };
      if (orientationApi.unlock) orientationApi.unlock();
    } catch {
      // silent
    }
  }, []);

  const stopFlow = useCallback(async () => {
    if (sessionId) endFocusSession(sessionId, 'neutral', 'medium');
    setSessionId(null);
    setPhase('idle');
    setSecondsLeft(0);
    setIsFullscreenMode(false);
    await unlockOrientation();
    await exitFullscreen().catch(() => undefined);
  }, [sessionId, endFocusSession, unlockOrientation]);

  useEffect(() => {
    if (phase !== 'focus' || secondsLeft > 0 || !sessionId || !activeTask) return;

    endFocusSession(sessionId, 'high', activeTask.effortLevel === 'heavy' ? 'heavy' : 'medium');
    setSessionId(null);
    setPhase('recovery');
    setSecondsLeft(5 * 60);
    setCycle((value) => value + 1);
    setIsFullscreenMode(false);

    const endedAt = new Date();
    const dueDate = activeTask.dueDate ? new Date(activeTask.dueDate) : null;
    const delayMinutes = dueDate ? Math.round((endedAt.getTime() - dueDate.getTime()) / 60000) : 0;
    const efficiency = activeTask.estimatedMinutes
      ? Math.round(((activeTask.estimatedMinutes || plannedMinutes) / plannedMinutes) * 100)
      : 100;

    if (delayMinutes > 0) {
      addInsight({
        type: 'warning',
        priority: 'high',
        message: `A tarefa "${activeTask.title}" esta ${delayMinutes} min atrasada. Ajuste escopo e bloco de foco.`,
      });
      notifications.warning('Atraso detectado', `${activeTask.title} passou do prazo.`);
    } else {
      addInsight({
        type: 'praise',
        priority: 'medium',
        message: `Execucao eficiente em "${activeTask.title}". Eficiencia estimada: ${efficiency}%`,
      });
      notifications.taskCompleted(activeTask.title);
    }

    updateTask(activeTask.id, {
      lastFocusEndedAt: endedAt,
      status: 'in-progress',
      aiReason:
        delayMinutes > 0
          ? 'Padrao de atraso detectado. Ajustar janela de foco e carga.'
          : 'Boa aderencia ao bloco de foco.',
    });

    unlockOrientation();
    exitFullscreen().catch(() => undefined);
  }, [
    phase,
    secondsLeft,
    sessionId,
    activeTask,
    endFocusSession,
    addInsight,
    notifications,
    updateTask,
    plannedMinutes,
    unlockOrientation,
  ]);

  useEffect(() => {
    if (phase !== 'recovery' || secondsLeft > 0) return;
    setPhase('idle');
    setSecondsLeft(0);
  }, [phase, secondsLeft]);

  const startFlow = async () => {
    if (!activeTask) return;

    const newSessionId = startFocusSession(activeTask.id, plannedMinutes, cycle, 'neutral');
    setSessionId(newSessionId);
    setPhase('focus');
    setSecondsLeft(plannedMinutes * 60);
    notifications.pomodoroStart(activeTask.title);

    if (!isMobile) return;

    setIsFullscreenMode(true);
    await requestFullscreen().catch(() => undefined);

    try {
      const orientationApi = screen.orientation as ScreenOrientation & {
        lock?: (orientation: OrientationLockType) => Promise<void>;
      };
      if (orientationApi.lock) {
        await orientationApi.lock('landscape');
      }
    } catch {
      // Browser may block orientation lock; fullscreen view still opens.
    }
  };

  const progress =
    phase === 'focus' ? ((plannedMinutes * 60 - secondsLeft) / (plannedMinutes * 60)) * 100 : 0;
  const minuteText = `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60)
    .toString()
    .padStart(2, '0')}`;
  const line = MOTIVATION_LINES[cycle % MOTIVATION_LINES.length];

  return (
    <>
      <FocusFullscreen
        isActive={isFullscreenMode}
        secondsLeft={secondsLeft}
        plannedMinutes={plannedMinutes}
        onExit={() => setIsFullscreenMode(false)}
        onStopMission={stopFlow}
        taskTitle={activeTask?.title}
      />

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4 text-primary" />
            FlowCore
            <Badge variant="outline">foco adaptativo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Tarefa da missao</span>
              <Select value={activeFlowTaskId} onValueChange={setActiveFlowTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tarefa antes de iniciar" />
                </SelectTrigger>
                <SelectContent>
                  {selectableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Ciclo adaptativo</span>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm">{plannedMinutes} minutos</span>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Fase atual</p>
                <p className="text-sm font-medium">
                  {phase === 'focus'
                    ? 'Execucao profunda'
                    : phase === 'recovery'
                    ? 'Recuperacao cognitiva'
                    : 'Pronto'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-2xl font-semibold">
                <Timer className="h-5 w-5 text-primary" />
                {phase === 'idle' ? `${plannedMinutes}:00` : minuteText}
              </div>
            </div>
            <Progress value={progress} className="mt-3 h-2" />
          </div>

          <div className="rounded-md border bg-background/50 p-3 text-sm text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <Brain className="h-4 w-4 text-primary" />
              Feedback cognitivo e emocional
            </div>
            {line}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={!activeTask || phase !== 'idle'} onClick={startFlow}>
              Iniciar missao
            </Button>
            <Button variant="outline" disabled={phase === 'idle'} onClick={stopFlow}>
              Encerrar sessao
            </Button>
            {phase === 'focus' && (
              <Button variant="secondary" onClick={() => setIsFullscreenMode(true)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Tela cheia
              </Button>
            )}
            <Badge variant="secondary" className="ml-auto">
              <Trophy className="mr-1 h-3 w-3" />
              Ciclo {cycle}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
