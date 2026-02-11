import { useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { subDays, format, startOfDay, isSameDay } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';
import { useSettingsStore } from '@/stores/settingsStore';

export function ProductivityChart() {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const { tasks } = useTaskStore();

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(date);
      
      const completedTasks = tasks.filter(
        (task) => task.completedAt && isSameDay(new Date(task.completedAt), dayStart)
      );
      
      const createdTasks = tasks.filter(
        (task) => isSameDay(new Date(task.createdAt), dayStart)
      );

      return {
        date: format(date, 'EEE', { locale: language === 'pt' ? pt : enUS }),
        fullDate: format(date, 'dd/MM'),
        completed: completedTasks.length,
        created: createdTasks.length,
      };
    });

    return last7Days;
  }, [tasks, language]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('productivityChart')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('last7Days')}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelFormatter={(_, payload) => payload[0]?.payload?.fullDate}
              />
              <Bar
                dataKey="completed"
                name={t('completed')}
                fill="hsl(var(--productive))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="created"
                name={t('tasksCreated')}
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                opacity={0.5}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
