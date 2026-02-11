import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useProfileStore } from '@/stores/profileStore';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalsStore } from '@/stores/goalsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Target, Clock3, Bell, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const profile = useProfileStore();
  const { tasks } = useTaskStore();
  const { goals } = useGoalsStore();

  const [name, setName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [bio, setBio] = useState(profile.bio);
  const [objectives, setObjectives] = useState(profile.mainObjectives.join(', '));
  const [productiveHours, setProductiveHours] = useState(profile.productiveHours.join(', '));
  const [focusPreferences, setFocusPreferences] = useState(profile.focusPreferences);
  const [notificationPreferences, setNotificationPreferences] = useState(profile.notificationPreferences);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const onTime = tasks.filter((task) => task.status === 'completed' && task.dueDate && task.completedAt && new Date(task.completedAt) <= new Date(task.dueDate)).length;
    const totalWithDue = tasks.filter((task) => task.dueDate).length;
    const punctuality = totalWithDue ? Math.round((onTime / totalWithDue) * 100) : 100;
    const focusSessions = tasks.reduce((sum, task) => sum + Math.round((task.totalFocusMinutes || 0) / 25), 0);
    const activeGoals = goals.filter((goal) => !goal.completed && goal.lifecycle !== 'archived').length;
    return { completed, punctuality, focusSessions, activeGoals };
  }, [tasks, goals]);

  const handleSave = () => {
    profile.updateProfile({
      displayName: name,
      email,
      bio,
      mainObjectives: objectives.split(',').map((item) => item.trim()).filter(Boolean),
      productiveHours: productiveHours.split(',').map((item) => item.trim()).filter(Boolean),
      focusPreferences,
      notificationPreferences,
      activeGoals: goals.filter((goal) => !goal.completed).map((goal) => goal.title),
    });
    toast.success('Perfil atualizado');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Perfil do usuario</h1>
        <p className="text-muted-foreground">Controle de objetivos, preferencias de foco e desempenho.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={BarChart3} label="Tarefas concluidas" value={stats.completed} />
        <MetricCard icon={Clock3} label="Taxa de pontualidade" value={`${stats.punctuality}%`} />
        <MetricCard icon={Target} label="Sessoes de foco" value={stats.focusSessions} />
        <MetricCard icon={Target} label="Metas ativas" value={stats.activeGoals} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados principais</CardTitle>
          <CardDescription>Edite seu perfil e prioridades operacionais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea rows={3} value={bio} onChange={(event) => setBio(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Objetivos principais</label>
            <Input
              value={objectives}
              onChange={(event) => setObjectives(event.target.value)}
              placeholder="Ex: fechar sprint, estudar ingles, treinar corrida"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Horarios mais produtivos</label>
            <Input value={productiveHours} onChange={(event) => setProductiveHours(event.target.value)} placeholder="Ex: 08:00-11:00, 15:00-17:00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Preferencias de foco</label>
            <Textarea rows={2} value={focusPreferences} onChange={(event) => setFocusPreferences(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Preferencias de notificacao
            </label>
            <Textarea rows={2} value={notificationPreferences} onChange={(event) => setNotificationPreferences(event.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar perfil
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}
