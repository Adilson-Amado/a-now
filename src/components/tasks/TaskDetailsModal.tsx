import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Task } from '@/types/task';
import { useTaskStore } from '@/stores/taskStore';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Save, CheckCircle2, Pause, Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface TaskDetailsModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsModal({ task, open, onOpenChange }: TaskDetailsModalProps) {
  const {
    updateTask,
    completeTask,
    deleteTask,
    pauseTask,
    archiveTask,
    reactivateTask,
    getTaskFocusSessions,
  } = useTaskStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteCooldown, setDeleteCooldown] = useState(5);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description || '');
    setIsEditing(false);
    setDeleteStep(0);
    setDeleteCooldown(5);
  }, [task, open]);

  useEffect(() => {
    if (deleteStep === 0 || deleteCooldown <= 0) return;
    const timer = window.setTimeout(() => setDeleteCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [deleteStep, deleteCooldown]);

  const sessions = useMemo(() => (task ? getTaskFocusSessions(task.id) : []), [task, getTaskFocusSessions]);

  if (!task) return null;

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Titulo obrigatorio');
      return;
    }
    updateTask(task.id, { title: title.trim(), description: description.trim() || undefined });
    setIsEditing(false);
    toast.success('Tarefa atualizada');
  };

  const handleDelete = () => {
    if (deleteStep < 2 || deleteCooldown > 0) return;
    deleteTask(task.id);
    toast.success('Tarefa removida');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Criada em {format(new Date(task.createdAt), "dd/MM/yyyy 'as' HH:mm", { locale: pt })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {task.status === 'completed' ? 'Concluida' : task.status === 'in-progress' ? 'Em execucao' : 'Pendente'}
            </span>
            {task.lifecycle && task.lifecycle !== 'active' && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{task.lifecycle}</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="task-edit-title">Titulo</Label>
                <Input id="task-edit-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-edit-description">Descricao</Label>
                <Textarea
                  id="task-edit-description"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Visao completa</h3>
              <p className="text-sm text-muted-foreground">{task.description || 'Sem descricao detalhada.'}</p>
              <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2">
                <span>Prazo: {task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy HH:mm') : 'Sem prazo'}</span>
                <span>Categoria: {task.category || 'Sem categoria'}</span>
                <span>Projeto: {task.project || 'Sem projeto'}</span>
                <span>Esforco: {task.effortLevel || 'Nao definido'}</span>
                <span>Tipo: {task.taskType || 'Nao definido'}</span>
                <span>Foco acumulado: {task.totalFocusMinutes || 0} min</span>
              </div>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Historico de execucao (FlowCore)</h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma sessao registrada para esta tarefa.</p>
            ) : (
              <ScrollArea className="h-36 rounded-md border p-2">
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.id} className="rounded-md border p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Ciclo {session.cycleIndex}</span>
                        <span>{session.actualMinutes || session.plannedMinutes} min</span>
                      </div>
                      <p className="text-muted-foreground">
                        {format(new Date(session.startedAt), 'dd/MM HH:mm')} -{' '}
                        {session.endedAt ? format(new Date(session.endedAt), 'HH:mm') : 'em andamento'}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <h3 className="text-sm font-semibold text-destructive">Zona de risco</h3>
            <p className="text-xs text-muted-foreground">
              Apagar nao deve ser a primeira opcao. Voce pode pausar, arquivar ou reativar mantendo historico.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => pauseTask(task.id)}>
                <Pause className="mr-1 h-3.5 w-3.5" />
                Pausar
              </Button>
              <Button size="sm" variant="outline" onClick={() => archiveTask(task.id)}>
                <Archive className="mr-1 h-3.5 w-3.5" />
                Arquivar
              </Button>
              <Button size="sm" variant="outline" onClick={() => reactivateTask(task.id)}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Reativar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteStep((step) => Math.min(step + 1, 2))}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {deleteStep === 0 && 'Quero apagar'}
                {deleteStep === 1 && 'Tem certeza que quer abandonar esta meta?'}
                {deleteStep === 2 && 'Esta acao quebra a consistencia do seu progresso'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={deleteStep < 2 || deleteCooldown > 0}
                onClick={handleDelete}
              >
                Confirmar exclusao {deleteCooldown > 0 ? `(${deleteCooldown}s)` : ''}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => completeTask(task.id)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Concluir
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
