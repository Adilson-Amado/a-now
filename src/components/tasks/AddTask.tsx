import { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { TaskPriority } from '@/types/task';
import { directGeminiService } from '@/services/directGeminiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TASK_EFFORT_OPTIONS, TASK_PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/taskMappings';

export function AddTaskButton() {
  const { addTask, tasks, getCompletedToday } = useTaskStore();
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('can-wait');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [category, setCategory] = useState('');
  const [project, setProject] = useState('');
  const [effortLevel, setEffortLevel] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [taskType, setTaskType] = useState<'deep-focus' | 'operational' | 'creative' | 'quick'>('deep-focus');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [aiReason, setAiReason] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('can-wait');
    setDueDate('');
    setDueTime('');
    setCategory('');
    setProject('');
    setEffortLevel('medium');
    setTaskType('deep-focus');
    setEstimatedMinutes('');
    setAiReason('');
  };

  const handleGenerateWithAI = async () => {
    if (!title.trim()) {
      toast.error('Defina um titulo antes de usar IA');
      return;
    }

    setIsGenerating(true);
    try {
      const details = await directGeminiService.generateTaskDetails(
        title.trim(),
        description || undefined,
        priority,
        {
          currentTasks: tasks.slice(0, 5).map((item) => item.title),
          completedToday: getCompletedToday().length,
          timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
          energyLevel: effortLevel === 'heavy' ? 'high' : effortLevel === 'light' ? 'low' : 'medium',
        }
      );

      if (details.description) setDescription(details.description);
      if (details.priority) setPriority(details.priority as TaskPriority);
      if (details.estimatedMinutes) setEstimatedMinutes(String(details.estimatedMinutes));
      if (details.aiReason) setAiReason(details.aiReason);
      toast.success('Sugestoes geradas com IA');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao gerar detalhes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !dueDate || !dueTime || !category.trim()) {
      toast.error('Preencha os campos obrigatorios');
      return;
    }

    const finalDueDate = new Date(`${dueDate}T${dueTime}:00`);

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status: 'pending',
      dueDate: finalDueDate,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      aiRecommendation:
        priority === 'urgent' ? 'do-now' : priority === 'important' ? 'schedule' : 'delegate',
      aiReason: aiReason || 'Priorizacao definida no modal estrategico',
      category: category.trim(),
      project: project.trim() || undefined,
      effortLevel,
      taskType,
      lifecycle: 'active',
    });

    toast.success('Tarefa criada');
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Planejar tarefa estrategica</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Titulo da tarefa *</Label>
            <div className="flex gap-2">
              <Input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: Preparar proposta final"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Descricao detalhada</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Contexto, criterios de sucesso e passos"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Prioridade *</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-category">Categoria *</Label>
              <Input
                id="task-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Ex: Produto, Comercial, Estudos"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Data de entrega *</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-time">Hora exata *</Label>
              <Input
                id="task-due-time"
                type="time"
                value={dueTime}
                onChange={(event) => setDueTime(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-project">Projeto</Label>
              <Input
                id="task-project"
                value={project}
                onChange={(event) => setProject(event.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-estimated">Tempo estimado (min)</Label>
              <Input
                id="task-estimated"
                type="number"
                min={5}
                max={480}
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(event.target.value)}
                placeholder="45"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nivel de esforco</Label>
              <Select value={effortLevel} onValueChange={(value) => setEffortLevel(value as 'light' | 'medium' | 'heavy')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_EFFORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de tarefa</Label>
              <Select value={taskType} onValueChange={(value) => setTaskType(value as 'deep-focus' | 'operational' | 'creative' | 'quick')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {aiReason && (
            <div className="rounded-lg border bg-accent/30 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">IA:</span> {aiReason}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar tarefa</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function QuickAddTask() {
  const { addTask } = useTaskStore();
  const [value, setValue] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;

    addTask({
      title: value.trim(),
      priority: 'can-wait',
      status: 'pending',
      category: 'Inbox',
      effortLevel: 'light',
      taskType: 'quick',
      lifecycle: 'active',
    });

    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Captura rapida de tarefa"
        />
        <Button type="submit" size="sm">
          Adicionar
        </Button>
      </div>
    </form>
  );
}
