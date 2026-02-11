import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/hooks/useSync';
import { useTaskBootstrap } from '@/hooks/useTaskBootstrap';
import { useNotesBootstrap } from '@/hooks/useNotesBootstrap';
import { useGoalsBootstrap } from '@/hooks/useGoalsBootstrap';
import { DayHeader, ProductivityIndicator, ProductivityStats } from '@/components/dashboard/ProductivityStats';
import { ProductivityChart } from '@/components/dashboard/ProductivityChart';
import { DailyTimeline } from '@/components/dashboard/DailyTimeline';
import { AIInsightsPanel, AIAssistantBanner } from '@/components/ai/AIInsights';
import { TaskList } from '@/components/tasks/TaskCard';
import { AddTaskButton, QuickAddTask } from '@/components/tasks/AddTask';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Target,
  BarChart3,
  User,
  Settings,
  Zap,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import Notes from '@/pages/Notes';
import Goals from '@/pages/Goals';
import SettingsPage from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Focus from '@/pages/Focus';

type View = 'dashboard' | 'tasks' | 'notes' | 'goals' | 'reports' | 'focus' | 'settings' | 'profile';

export default function Dashboard() {
  const { tasks, getPendingTasks, getCompletedToday } = useTaskStore();
  const { logout } = useAuth();
  useTaskBootstrap();
  useNotesBootstrap();
  useGoalsBootstrap();
  useSync();

  const [view, setView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pending = getPendingTasks();
  const completedToday = getCompletedToday();

  const navItems: Array<{ id: View; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'focus', label: 'Foco', icon: Zap },
    { id: 'notes', label: 'Notas', icon: FileText },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'reports', label: 'Relatorios', icon: BarChart3 },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'settings', label: 'Configuracoes', icon: Settings },
  ];

  const primaryMobileItems = navItems.slice(0, 4);
  const extraMobileItems = navItems.slice(4);

  const changeView = (next: View) => {
    setView(next);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
        <div className="flex h-full flex-col p-5">
          <div className="mb-6 flex items-center gap-2">
            <img src="/LOGO_ICONE.svg" alt="a-now" className="h-6 w-6" />
            <span className="font-semibold">a-now</span>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === view;
              return (
                <button
                  key={item.id}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/60'
                  )}
                  onClick={() => changeView(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <Button variant="ghost" className="mt-4 w-full justify-start gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
            <h1 className="truncate text-sm font-medium lg:hidden">
              {navItems.find((item) => item.id === view)?.label || 'a-now'}
            </h1>
            <div className="shrink-0">
              <AddTaskButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl p-4 pb-32 lg:p-8">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                <DayHeader />
                <AIAssistantBanner />
                <ProductivityStats />
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-6 lg:col-span-2">
                    <ProductivityIndicator />
                    <ProductivityChart />
                    <div>
                      <h2 className="mb-3 text-lg font-semibold">Proximas tarefas</h2>
                      <TaskList tasks={pending.slice(0, 4)} emptyMessage="Sem tarefas pendentes" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <DailyTimeline />
                    <AIInsightsPanel />
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'tasks' && (
              <motion.div key="tasks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Tarefas</h1>
                  <p className="text-muted-foreground">Planejamento estrategico e execucao orientada por foco.</p>
                </div>
                <QuickAddTask />
                <Tabs defaultValue="pending">
                  <TabsList>
                    <TabsTrigger value="pending">Pendentes ({pending.length})</TabsTrigger>
                    <TabsTrigger value="completed">Concluidas hoje ({completedToday.length})</TabsTrigger>
                    <TabsTrigger value="all">Todas ({tasks.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending" className="mt-4">
                    <TaskList tasks={pending} emptyMessage="Nenhuma pendente" />
                  </TabsContent>
                  <TabsContent value="completed" className="mt-4">
                    <TaskList tasks={completedToday} emptyMessage="Nenhuma concluida hoje" />
                  </TabsContent>
                  <TabsContent value="all" className="mt-4">
                    <TaskList tasks={tasks} />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {view === 'focus' && <Focus key="focus" />}
            {view === 'notes' && <Notes key="notes" />}
            {view === 'goals' && <Goals key="goals" />}
            {view === 'profile' && <Profile key="profile" />}
            {view === 'settings' && <SettingsPage key="settings" />}

            {view === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                <h1 className="text-2xl font-bold">Relatorios</h1>
                <ProductivityChart />
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard title="Total concluido" value={tasks.filter((task) => task.status === 'completed').length} />
                  <MetricCard
                    title="Taxa de conclusao"
                    value={`${tasks.length ? Math.round((tasks.filter((task) => task.status === 'completed').length / tasks.length) * 100) : 0}%`}
                  />
                  <MetricCard title="Sessoes de foco" value={tasks.reduce((sum, task) => sum + Math.round((task.totalFocusMinutes || 0) / 25), 0)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {mobileMenuOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/25 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fechar menu expandido"
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden">
        {mobileMenuOpen && (
          <div className="absolute bottom-16 left-3 right-3 rounded-xl border bg-card p-2 shadow-xl">
            <div className="grid grid-cols-2 gap-1">
              {extraMobileItems.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => changeView(item.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                      active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={logout}
                className="col-span-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-5 gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {primaryMobileItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => changeView(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px]',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px]',
              mobileMenuOpen ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
            )}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span className="leading-none">Mais</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
