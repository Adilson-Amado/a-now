import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Globe, Moon, Sun, Bell, Download, Trash2, Info, Cloud } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useNotesStore } from '@/stores/notesStore';
import { useGoalsStore } from '@/stores/goalsStore';
import { NotificationSettings } from '@/components/Notifications/NotificationSettings';
import { SyncStatus } from '@/components/Sync/SyncStatus';
import { toast } from 'sonner';

export default function Settings() {
  const { t } = useTranslation();
  const {
    language,
    theme,
    notifications,
    dailyReminder,
    soundEffects,
    setLanguage,
    setTheme,
    setNotifications,
    setDailyReminder,
    setSoundEffects,
  } = useSettingsStore();

  const taskStore = useTaskStore();
  const notesStore = useNotesStore();
  const goalsStore = useGoalsStore();

  const handleExport = () => {
    const data = {
      tasks: taskStore.tasks,
      notes: notesStore.notes,
      goals: goalsStore.goals,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a-now-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso!');
  };

  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('settings')}</h1>
        <p className="text-muted-foreground">Personaliza a tua experiência</p>
      </div>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('language')}
          </CardTitle>
          <CardDescription>Escolhe o idioma da aplicação</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">🇵🇹 Português</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {t('appearance')}
          </CardTitle>
          <CardDescription>Personaliza o aspeto visual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('theme')}</label>
              <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('lightTheme')}</SelectItem>
                  <SelectItem value="dark">{t('darkTheme')}</SelectItem>
                  <SelectItem value="system">{t('systemTheme')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notifications')}
          </CardTitle>
          <CardDescription>
            Configurações avançadas de notificações para garantir que nada passe despercebido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationSettings />
        </CardContent>
      </Card>

      {/* Data Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Sincronização de Dados
          </CardTitle>
          <CardDescription>
            Mantém seus dados seguros e sincronizados na nuvem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SyncStatus />
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dataPrivacy')}</CardTitle>
          <CardDescription>Gere os teus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            {t('exportData')}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                {t('clearData')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tens a certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá eliminar permanentemente todas as tuas tarefas, notas e metas.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground">
                  {t('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            {t('about')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('version')}</span>
            <span className="font-mono text-sm">1.0.0</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
