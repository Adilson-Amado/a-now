import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePWA } from '@/hooks/usePWA';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  Monitor,
  Clock,
  Calendar,
  Target,
  CheckCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  Zap,
  Settings,
  TestTube,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { PWAInstallBanner } from './PWAInstallBanner';

export function NotificationSettings() {
  const { t } = useTranslation();
  const {
    notifications,
    dailyReminder,
    soundEffects,
    setNotifications,
    setDailyReminder,
    setSoundEffects,
  } = useSettingsStore();

  const {
    notificationsSupported,
    notificationsPermission,
    requestNotificationPermission,
    subscribeToNotifications,
  } = usePWA();

  const { showNotification } = useDesktopNotifications();

  // Advanced notification settings
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [goalNotifications, setGoalNotifications] = useState(true);
  const [pomodoroNotifications, setPomodoroNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [achievementNotifications, setAchievementNotifications] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [summaryTime, setSummaryTime] = useState('18:00');
  const [notificationVolume, setNotificationVolume] = useState([70]);
  const [notificationDuration, setNotificationDuration] = useState([5]);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success('Permissão concedida! Agora receberás notificações.');
      await subscribeToNotifications();
    } else {
      toast.error('Permissão negada. Verifica as definições do teu navegador.');
    }
  };

  const handleTestMobileNotification = async () => {
    if (!notificationsSupported) {
      toast.error('Notificações não são suportadas neste navegador');
      return;
    }
    
    if (notificationsPermission !== 'granted') {
      toast.warning('Permissão de notificações não concedida. Ative primeiro!');
      return;
    }

    try {
      // Testar notificação nativa do sistema (funciona no telefone)
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // Mostrar notificação local usando o service worker
        await registration.showNotification('Teste Mobile 📱', {
          body: 'Esta é uma notificação de teste para o teu telemóvel!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'mobile-test',
          requireInteraction: true,
          actions: [
            {
              action: 'open',
              title: 'Abrir App'
            }
          ]
        } as any);
        
        toast.success('Notificação mobile enviada! Verifica o teu telemóvel.');
      } else {
        // Fallback para notificação normal
        showNotification(
          'Teste Mobile 📱',
          'Notificação de teste para dispositivo móvel!',
          {
            type: 'info',
            duration: 5000,
          }
        );
      }
    } catch (error) {
      console.error('Erro ao testar notificação mobile:', error);
      toast.error('Erro ao enviar notificação. Verifica as permissões do navegador.');
    }
  };

  const handleTestNotification = () => {
    showNotification(
      'Teste de Notificação 🔔',
      'Isto é um teste para verificar se as notificações estão funcionando corretamente!',
      {
        type: 'info',
        duration: 4000,
        action: {
          label: 'Funciona!',
          onClick: () => toast.success('Perfeito! As notificações estão ativas.'),
        },
      }
    );
  };

  const handleTestTaskNotification = () => {
    showNotification(
      'Tarefa Concluída! 🎉',
      'Parabéns! Concluíste a tarefa "Revisar projeto".',
      {
        type: 'success',
        action: {
          label: 'Ver Tarefas',
          onClick: () => window.location.href = '/tasks',
        },
      }
    );
  };

  const handleTestPomodoroNotification = () => {
    showNotification(
      'Pomodoro Concluído! 🍅',
      'Hora de fazer uma pausa de 5 minutos.',
      {
        type: 'pomodoro',
        action: {
          label: 'Iniciar Pausa',
          onClick: () => toast.info('Pausa iniciada!'),
        },
      }
    );
  };

  const getPermissionStatus = () => {
    switch (notificationsPermission) {
      case 'granted':
        return { color: 'bg-green-500', text: 'Ativadas', icon: BellRing };
      case 'denied':
        return { color: 'bg-red-500', text: 'Bloqueadas', icon: BellOff };
      default:
        return { color: 'bg-yellow-500', text: 'Pendente', icon: Bell };
    }
  };

  const permissionStatus = getPermissionStatus();
  const StatusIcon = permissionStatus.icon;

  return (
    <>
      <PWAInstallBanner />
      <div className="space-y-6">
        {/* Status Card */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Status das Notificações
          </CardTitle>
          <CardDescription>
            Verifica e gerencia o estado das notificações no teu dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${permissionStatus.color}`} />
              <div>
                <p className="font-medium">Notificações do Sistema</p>
                <p className="text-sm text-muted-foreground">
                  {notificationsSupported ? 'Navegador suporta notificações' : 'Navegador não suporta'}
                </p>
              </div>
            </div>
            <Badge variant={notificationsPermission === 'granted' ? 'default' : 'secondary'}>
              {permissionStatus.text}
            </Badge>
          </div>

          {notificationsPermission !== 'granted' && notificationsSupported && (
            <Button onClick={handleRequestPermission} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Ativar Notificações do Sistema
            </Button>
          )}

          {notificationsPermission === 'granted' && (
            <div className="space-y-3">
              {/* Botões de teste normais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button variant="outline" onClick={handleTestNotification}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Teste Simples
                </Button>
                <Button variant="outline" onClick={handleTestTaskNotification}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Teste Tarefa
                </Button>
                <Button variant="outline" onClick={handleTestPomodoroNotification}>
                  <Clock className="h-4 w-4 mr-2" />
                  Teste Pomodoro
                </Button>
              </div>
              
              {/* Botão específico para mobile */}
              <Button 
                onClick={handleTestMobileNotification} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Testar Notificação no Telemóvel 📱
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                💡 Dica: Se não receberes notificações no telemóvel, verifica se:
                <br/>• O app está instalado (PWA)
                <br/>• As permissões de notificação estão ativas nas definições do sistema
                <br/>• O telemóvel não está em modo "Não Perturbar"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Globais
          </CardTitle>
          <CardDescription>
            Configurações principais que afetam todos os tipos de notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Ativar Notificações</Label>
              <p className="text-sm text-muted-foreground">
                Permite que o aplicativo envie notificações
              </p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
              disabled={!notificationsSupported}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Volume do Som</Label>
              <div className="flex items-center gap-2">
                {notificationVolume[0] > 0 ? (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground w-10">
                  {notificationVolume[0]}%
                </span>
              </div>
            </div>
            <Slider
              value={notificationVolume}
              onValueChange={setNotificationVolume}
              max={100}
              step={10}
              className="w-full"
              disabled={!soundEffects}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Duração da Notificação</Label>
              <span className="text-sm text-muted-foreground">
                {notificationDuration[0]} segundos
              </span>
            </div>
            <Slider
              value={notificationDuration}
              onValueChange={setNotificationDuration}
              min={2}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Vibração</Label>
              <p className="text-sm text-muted-foreground">
                Vibrações em dispositivos móveis
              </p>
            </div>
            <Switch
              checked={vibrationEnabled}
              onCheckedChange={setVibrationEnabled}
              disabled={!notificationsSupported}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Tipos de Notificações
          </CardTitle>
          <CardDescription>
            Escolhe que tipo de notificações queres receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tarefas
              </Label>
              <p className="text-sm text-muted-foreground">
                Ao criar, completar ou atingir prazos de tarefas
              </p>
            </div>
            <Switch
              checked={taskNotifications}
              onCheckedChange={setTaskNotifications}
              disabled={!notifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objetivos
              </Label>
              <p className="text-sm text-muted-foreground">
                Ao alcançar ou atualizar progresso de objetivos
              </p>
            </div>
            <Switch
              checked={goalNotifications}
              onCheckedChange={setGoalNotifications}
              disabled={!notifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pomodoro
              </Label>
              <p className="text-sm text-muted-foreground">
                Início, pausas e conclusão de ciclos Pomodoro
              </p>
            </div>
            <Switch
              checked={pomodoroNotifications}
              onCheckedChange={setPomodoroNotifications}
              disabled={!notifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Lembretes
              </Label>
              <p className="text-sm text-muted-foreground">
                Lembretes de tarefas e prazos
              </p>
            </div>
            <Switch
              checked={reminderNotifications}
              onCheckedChange={setReminderNotifications}
              disabled={!notifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Conquistas
              </Label>
              <p className="text-sm text-muted-foreground">
                Ao atingir metas e conquistas
              </p>
            </div>
            <Switch
              checked={achievementNotifications}
              onCheckedChange={setAchievementNotifications}
              disabled={!notifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Notificações Agendadas
          </CardTitle>
          <CardDescription>
            Configura notificações automáticas em horários específicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Lembrete Diário</Label>
              <p className="text-sm text-muted-foreground">
                Lembra-te de registar as tuas tarefas
              </p>
            </div>
            <Switch
              checked={dailyReminder}
              onCheckedChange={setDailyReminder}
              disabled={!notifications}
            />
          </div>

          {dailyReminder && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Horário do Lembrete</Label>
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Resumo Diário</Label>
              <p className="text-sm text-muted-foreground">
                Resumo das tuas atividades do dia
              </p>
            </div>
            <Switch
              checked={dailySummary}
              onCheckedChange={setDailySummary}
              disabled={!notifications}
            />
          </div>

          {dailySummary && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Horário do Resumo</Label>
              <Input
                type="time"
                value={summaryTime}
                onChange={(e) => setSummaryTime(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Relatório Semanal</Label>
              <p className="text-sm text-muted-foreground">
                Análise da tua produtividade semanal
              </p>
            </div>
            <Switch
              checked={weeklyReport}
              onCheckedChange={setWeeklyReport}
              disabled={!notifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Device Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Configurações por Dispositivo
          </CardTitle>
          <CardDescription>
            Configurações específicas para desktop e mobile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="h-4 w-4" />
                <span className="font-medium">Desktop</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Notificações pop-up no canto da tela
              </p>
              <Badge variant={notificationsPermission === 'granted' ? 'default' : 'secondary'}>
                {permissionStatus.text}
              </Badge>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4" />
                <span className="font-medium">Mobile</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Notificações push e vibração
              </p>
              <Badge variant="outline">
                {vibrationEnabled ? 'Vibração Ativa' : 'Vibração Inativa'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
