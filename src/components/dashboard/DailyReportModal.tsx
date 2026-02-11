import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { useModalScroll } from '@/hooks/useModalScroll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Coffee,
  Moon,
  Sun,
  BarChart3,
  Award,
  AlertCircle,
  X,
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReportData {
  timeOfDay: string;
  timeIcon: React.ReactNode;
  timeLabel: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  urgentTasks: number;
  importantTasks: number;
  totalEstimated: number;
  totalActual: number;
  productivityScore: number;
  timeEfficiency: number;
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    icon: React.ReactNode;
    text: string;
  }>;
}

interface DailyReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyReportModal({ open, onOpenChange }: DailyReportModalProps) {
  const { tasks } = useTaskStore();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dontShowToday, setDontShowToday] = useState(false);

  // Prevenir rolagem quando modal está aberto
  useModalScroll(open);

  // Check if user already dismissed today
  useEffect(() => {
    const today = new Date().toDateString();
    const dismissedToday = localStorage.getItem('daily_report_dismissed');
    if (dismissedToday === today) {
      onOpenChange(false);
    }
  }, [onOpenChange]);

  const generateReport = useCallback(() => {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= startOfToday && taskDate <= endOfToday;
    });

    const completedTasks = todayTasks.filter(task => task.status === 'completed');
    const pendingTasks = todayTasks.filter(task => task.status === 'pending' || task.status === 'in-progress');

    const totalEstimated = todayTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
    const totalActual = completedTasks.reduce((sum, task) => sum + (task.actualMinutes || 0), 0);

    const urgentTasks = pendingTasks.filter(task => task.priority === 'urgent');
    const importantTasks = pendingTasks.filter(task => task.priority === 'important');

    const productivityScore = todayTasks.length > 0 
      ? Math.round((completedTasks.length / todayTasks.length) * 100)
      : 0;

    const timeEfficiency = totalEstimated > 0 
      ? Math.round((totalEstimated / totalActual) * 100)
      : 0;

    const now = new Date();
    const currentHour = now.getHours();
    let timeOfDay = 'morning';
    let timeIcon = <Sun className="h-4 w-4" />;
    let timeLabel = 'Bom dia';

    if (currentHour >= 12 && currentHour < 18) {
      timeOfDay = 'afternoon';
      timeIcon = <Coffee className="h-4 w-4" />;
      timeLabel = 'Boa tarde';
    } else if (currentHour >= 18) {
      timeOfDay = 'evening';
      timeIcon = <Moon className="h-4 w-4" />;
      timeLabel = 'Boa noite';
    }

    const insights = [];
    
    if (urgentTasks.length > 0) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="h-4 w-4" />,
        text: `Tens ${urgentTasks.length} tarefa${urgentTasks.length > 1 ? 's' : ''} urgente${urgentTasks.length > 1 ? 's' : ''} pendente${urgentTasks.length > 1 ? 's' : ''}.`
      });
    }

    if (completedTasks.length >= 3) {
      insights.push({
        type: 'success',
        icon: <Award className="h-4 w-4" />,
        text: 'Excelente produtividade hoje! Continua assim.'
      });
    } else if (completedTasks.length === 0 && todayTasks.length > 0) {
      insights.push({
        type: 'info',
        icon: <Zap className="h-4 w-4" />,
        text: 'Começa o dia com uma tarefa pequena para ganhar momentum.'
      });
    }

    if (timeEfficiency > 100) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="h-4 w-4" />,
        text: 'Estás a ser mais eficiente do que o previsto!'
      });
    } else if (timeEfficiency < 80 && totalActual > 0) {
      insights.push({
        type: 'info',
        icon: <Clock className="h-4 w-4" />,
        text: 'Considera ajustar as estimativas de tempo para o futuro.'
      });
    }

    setReportData({
      timeOfDay,
      timeIcon,
      timeLabel,
      totalTasks: todayTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      urgentTasks: urgentTasks.length,
      importantTasks: importantTasks.length,
      totalEstimated,
      totalActual,
      productivityScore,
      timeEfficiency,
      insights
    });
  }, [tasks]);

  useEffect(() => {
    if (open) {
      generateReport();
    }
  }, [open, generateReport]);

  const handleDontShowToday = () => {
    const today = new Date().toDateString();
    localStorage.setItem('daily_report_dismissed', today);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (dontShowToday) {
      handleDontShowToday();
    } else {
      onOpenChange(false);
    }
  };

  if (!reportData) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-productive';
    if (score >= 50) return 'text-can-wait-foreground';
    return 'text-urgent';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-productive/10';
    if (score >= 50) return 'bg-can-wait/10';
    return 'bg-urgent/10';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              {reportData.timeIcon}
              <span>{reportData.timeLabel}!</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(), "d 'de' MMMM", { locale: pt })}
            </div>
          </DialogTitle>
          <DialogDescription>
            Aqui está o teu resumo diário de produtividade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Score Principal */}
          <Card className={cn(
            'border-2',
            reportData.productivityScore >= 80 ? 'border-productive' :
            reportData.productivityScore >= 50 ? 'border-can-wait-foreground' :
            'border-urgent'
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Score de Produtividade</h3>
                  <p className="text-sm text-muted-foreground">
                    Baseado nas tarefas concluídas hoje
                  </p>
                </div>
                <div className={cn(
                  'text-3xl font-bold',
                  getScoreColor(reportData.productivityScore)
                )}>
                  {reportData.productivityScore}%
                </div>
              </div>
              <Progress 
                value={reportData.productivityScore} 
                className="mt-4 h-2"
              />
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Totais</p>
                    <p className="text-2xl font-bold">{reportData.totalTasks}</p>
                  </div>
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                    <p className="text-2xl font-bold text-productive">{reportData.completedTasks}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-productive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-can-wait-foreground">{reportData.pendingTasks}</p>
                  </div>
                  <Clock className="h-5 w-5 text-can-wait-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Urgentes</p>
                    <p className="text-2xl font-bold text-urgent">{reportData.urgentTasks}</p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-urgent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tempo */}
          {(reportData.totalEstimated > 0 || reportData.totalActual > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Análise de Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Estimado</p>
                    <p className="text-xl font-semibold">
                      {reportData.totalEstimated} min
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Real</p>
                    <p className="text-xl font-semibold">
                      {reportData.totalActual} min
                    </p>
                  </div>
                </div>
                {reportData.totalActual > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Eficiência</span>
                      <span className={cn(
                        'font-medium',
                        reportData.timeEfficiency >= 100 ? 'text-productive' : 'text-can-wait-foreground'
                      )}>
                        {reportData.timeEfficiency}%
                      </span>
                    </div>
                    <Progress value={Math.min(reportData.timeEfficiency, 100)} className="mt-2 h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {reportData.insights.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Insights do Dia
              </h3>
              {reportData.insights.map((insight, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    insight.type === 'success' ? 'bg-productive/10 text-productive' :
                    insight.type === 'warning' ? 'bg-urgent/10 text-urgent' :
                    'bg-can-wait/10 text-can-wait-foreground'
                  )}
                >
                  <div className="mt-0.5">
                    {insight.icon}
                  </div>
                  <p className="text-sm leading-relaxed">
                    {insight.text}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="flex gap-3 pt-4">
            <div className="flex items-center gap-2 flex-1">
              <Checkbox
                id="dont-show-today"
                checked={dontShowToday}
                onCheckedChange={(checked) => setDontShowToday(checked as boolean)}
              />
              <label
                htmlFor="dont-show-today"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Não ver mais hoje
              </label>
            </div>
            <Button 
              variant="outline" 
              onClick={handleClose}
            >
              Ver Dashboard
            </Button>
            {reportData.urgentTasks > 0 && (
              <Button className="flex-1">
                Focar em Urgentes
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
