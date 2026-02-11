import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock3, AlertTriangle, Sparkles, Flame } from 'lucide-react';

type NotificationEventType = 'due-soon' | 'due-now' | 'late' | 'inactivity' | 'ai' | 'motivation';

interface NotificationEvent {
  id: string;
  type: NotificationEventType;
  title: string;
  message: string;
  createdAt: Date;
}

const generateId = () => Math.random().toString(36).slice(2, 11);

export default function NotificationsCenter() {
  const { tasks } = useTaskStore();
  const notifications = useDesktopNotifications();
  const {
    dueSoonMinutes,
    inactivityMinutes,
    notifyOnDueSoon,
    notifyOnDueNow,
    notifyOnLate,
    notifyOnInactivity,
    notifyOnAISuggestions,
    notifyOnMotivation,
    setDueSoonMinutes,
    setInactivityMinutes,
    setNotifyOnDueSoon,
    setNotifyOnDueNow,
    setNotifyOnLate,
    setNotifyOnInactivity,
    setNotifyOnAISuggestions,
    setNotifyOnMotivation,
  } = useSettingsStore();

  const [events, setEvents] = useState<NotificationEvent[]>([]);

  const pendingTasks = useMemo(
    () => tasks.filter((task) => (task.status === 'pending' || task.status === 'in-progress') && task.lifecycle !== 'archived'),
    [tasks]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      const nextEvents: NotificationEvent[] = [];

      pendingTasks.forEach((task) => {
        if (!task.dueDate) return;
        const due = new Date(task.dueDate);
        const diff = Math.round((due.getTime() - now.getTime()) / 60000);

        if (notifyOnDueSoon && diff <= dueSoonMinutes && diff > 0) {
          const event = {
            id: generateId(),
            type: 'due-soon' as const,
            title: 'Prazo proximo',
            message: `${task.title} vence em ${diff} minutos.`,
            createdAt: now,
          };
          nextEvents.push(event);
          notifications.reminder('Prazo proximo', event.message);
        }

        if (notifyOnDueNow && diff === 0) {
          const event = {
            id: generateId(),
            type: 'due-now' as const,
            title: 'Momento exato',
            message: `${task.title} vence agora.`,
            createdAt: now,
          };
          nextEvents.push(event);
          notifications.warning('Prazo agora', event.message);
        }

        if (notifyOnLate && diff < 0) {
          const event = {
            id: generateId(),
            type: 'late' as const,
            title: 'Atraso detectado',
            message: `${task.title} esta atrasada ha ${Math.abs(diff)} minutos.`,
            createdAt: now,
          };
          nextEvents.push(event);
          notifications.error('Atraso detectado', event.message);
        }
      });

      if (notifyOnInactivity) {
        const recentTimestamp = tasks
          .map((task) =>
            new Date(task.lastFocusEndedAt || task.updatedAt || task.completedAt || task.createdAt).getTime()
          )
          .sort((a, b) => b - a)[0];
        const inactiveFor = recentTimestamp ? Math.round((Date.now() - recentTimestamp) / 60000) : 999;
        if (inactiveFor >= inactivityMinutes) {
          const event = {
            id: generateId(),
            type: 'inactivity' as const,
            title: 'Inatividade prolongada',
            message: `Sem progresso ha ${inactiveFor} minutos. Inicie um bloco de foco.`,
            createdAt: now,
          };
          nextEvents.push(event);
          notifications.info('Hora de retomar', event.message);
        }
      }

      if (notifyOnAISuggestions && pendingTasks.length > 0) {
        const critical = pendingTasks.filter((task) => task.priority === 'urgent').length;
        if (critical > 0) {
          nextEvents.push({
            id: generateId(),
            type: 'ai',
            title: 'Sugestao de IA',
            message: `Voce tem ${critical} tarefa(s) critica(s). Reserve um ciclo FlowCore agora.`,
            createdAt: now,
          });
        }
      }

      if (notifyOnMotivation) {
        nextEvents.push({
          id: generateId(),
          type: 'motivation',
          title: 'Pulso motivacional',
          message: 'Consistencia vence intensidade. Execute o proximo bloco.',
          createdAt: now,
        });
      }

      setEvents((prev) => [...nextEvents, ...prev].slice(0, 60));
    }, 60000);

    return () => window.clearInterval(timer);
  }, [
    pendingTasks,
    tasks,
    dueSoonMinutes,
    inactivityMinutes,
    notifyOnDueSoon,
    notifyOnDueNow,
    notifyOnLate,
    notifyOnInactivity,
    notifyOnAISuggestions,
    notifyOnMotivation,
    notifications,
  ]);

  const iconByType: Record<NotificationEventType, JSX.Element> = {
    'due-soon': <Clock3 className="h-4 w-4 text-primary" />,
    'due-now': <Bell className="h-4 w-4 text-primary" />,
    late: <AlertTriangle className="h-4 w-4 text-destructive" />,
    inactivity: <Clock3 className="h-4 w-4 text-muted-foreground" />,
    ai: <Sparkles className="h-4 w-4 text-primary" />,
    motivation: <Flame className="h-4 w-4 text-orange-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-2xl font-bold">Centro de notificacoes</h1>
        <p className="text-muted-foreground">
          Nenhuma tarefa esquecida, nenhum prazo perdido. Controle completo de alertas em web, desktop e mobile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras criticas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SettingSwitch label="Antes do prazo" checked={notifyOnDueSoon} onChange={setNotifyOnDueSoon} />
          <SettingSwitch label="No momento exato" checked={notifyOnDueNow} onChange={setNotifyOnDueNow} />
          <SettingSwitch label="Atraso detectado" checked={notifyOnLate} onChange={setNotifyOnLate} />
          <SettingSwitch label="Inatividade prolongada" checked={notifyOnInactivity} onChange={setNotifyOnInactivity} />
          <SettingSwitch label="Sugestoes inteligentes da IA" checked={notifyOnAISuggestions} onChange={setNotifyOnAISuggestions} />
          <SettingSwitch label="Alertas motivacionais" checked={notifyOnMotivation} onChange={setNotifyOnMotivation} />
          <div className="space-y-2">
            <span className="text-sm font-medium">Avisar com antecedencia (min)</span>
            <Input
              type="number"
              min={5}
              max={240}
              value={dueSoonMinutes}
              onChange={(event) => setDueSoonMinutes(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Limiar de inatividade (min)</span>
            <Input
              type="number"
              min={5}
              max={240}
              value={inactivityMinutes}
              onChange={(event) => setInactivityMinutes(Number(event.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Feed de notificacoes
            <Badge variant="secondary">{events.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aguardando eventos.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-md border p-3">
                {iconByType[event.type]}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.message}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEvents((prev) => prev.filter((item) => item.id !== event.id))}>
                  Fechar
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SettingSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
