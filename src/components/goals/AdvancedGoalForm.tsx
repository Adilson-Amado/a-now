import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoalsStore } from '@/stores/goalsStore';
import { useModalScroll } from '@/hooks/useModalScroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Dumbbell,
  Briefcase,
  User,
  MoreHorizontal,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AdvancedGoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WEEKDAYS = [
  { id: 'monday', label: 'Segunda' },
  { id: 'tuesday', label: 'Terça' },
  { id: 'wednesday', label: 'Quarta' },
  { id: 'thursday', label: 'Quinta' },
  { id: 'friday', label: 'Sexta' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
];

const CATEGORIES = [
  { id: 'education', label: 'Educação', icon: GraduationCap },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'career', label: 'Carreira', icon: Briefcase },
  { id: 'personal', label: 'Pessoal', icon: User },
  { id: 'other', label: 'Outro', icon: MoreHorizontal },
];

export function AdvancedGoalForm({ open, onOpenChange }: AdvancedGoalFormProps) {
  const { addGoal } = useGoalsStore();
  const [isLoading, setIsLoading] = useState(false);

  // Prevenir rolagem quando modal está aberto
  useModalScroll(open);

  // Basic fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'education' | 'fitness' | 'financial' | 'career' | 'personal' | 'other'>('personal');
  const [targetDate, setTargetDate] = useState('');

  // Education fields
  const [totalSessions, setTotalSessions] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [sessionDays, setSessionDays] = useState<string[]>([]);

  // Fitness fields
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);
  const [workoutDuration, setWorkoutDuration] = useState('');

  // Financial fields
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');

  // Milestones
  const [milestones, setMilestones] = useState<Array<{ id: string; title: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      const goalData: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        milestones: milestones.map(m => ({ ...m, completed: false })),
      };

      // Add category-specific data
      if (category === 'education') {
        goalData.totalSessions = totalSessions ? parseInt(totalSessions) : undefined;
        goalData.sessionDuration = sessionDuration ? parseInt(sessionDuration) : undefined;
        goalData.sessionDays = sessionDays.length > 0 ? sessionDays : undefined;
      } else if (category === 'fitness') {
        goalData.workoutType = workoutType || undefined;
        goalData.workoutDays = workoutDays.length > 0 ? workoutDays : undefined;
        goalData.workoutDuration = workoutDuration ? parseInt(workoutDuration) : undefined;
      } else if (category === 'financial') {
        goalData.targetAmount = targetAmount ? parseFloat(targetAmount) : undefined;
        goalData.currentAmount = currentAmount ? parseFloat(currentAmount) : undefined;
        goalData.currency = currency;
      }

      addGoal(goalData);
      toast.success('Meta criada com sucesso!');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao criar meta');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('personal');
    setTargetDate('');
    setTotalSessions('');
    setSessionDuration('');
    setSessionDays([]);
    setWorkoutType('');
    setWorkoutDays([]);
    setWorkoutDuration('');
    setTargetAmount('');
    setCurrentAmount('');
    setCurrency('EUR');
    setMilestones([]);
  };

  const addMilestone = () => {
    const newMilestone = {
      id: Date.now().toString(),
      title: '',
    };
    setMilestones([...milestones, newMilestone]);
  };

  const updateMilestone = (id: string, title: string) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, title } : m));
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const toggleDay = (dayId: string, currentDays: string[], setDays: (days: string[]) => void) => {
    if (currentDays.includes(dayId)) {
      setDays(currentDays.filter(d => d !== dayId));
    } else {
      setDays([...currentDays, dayId]);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.id === category);
  const CategoryIcon = selectedCategory?.icon || MoreHorizontal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5" />
            </div>
            Criar Meta Detalhada
          </DialogTitle>
          <DialogDescription>
            Define uma meta completa com todos os detalhes para melhor acompanhamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CategoryIcon && <CategoryIcon className="h-5 w-5" />}
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Concluir curso de React"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="h-4 w-4" />}
                              {cat.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreve em detalhes o que queres alcançar..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">Data Alvo</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Specific Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CategoryIcon && <CategoryIcon className="h-5 w-5" />}
                Detalhes Específicos
              </CardTitle>
              <CardDescription>
                Informações adicionais baseadas na categoria escolhida
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={category} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1">
                        {Icon && <Icon className="h-4 w-4" />}
                        <span className="hidden sm:inline">{cat.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalSessions">Total de Aulas/Sessões</Label>
                      <Input
                        id="totalSessions"
                        type="number"
                        value={totalSessions}
                        onChange={(e) => setTotalSessions(e.target.value)}
                        placeholder="Ex: 20"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sessionDuration">Duração por Sessão (minutos)</Label>
                      <Input
                        id="sessionDuration"
                        type="number"
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(e.target.value)}
                        placeholder="Ex: 60"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dias das Aulas</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.id}
                            checked={sessionDays.includes(day.id)}
                            onCheckedChange={() => toggleDay(day.id, sessionDays, setSessionDays)}
                          />
                          <Label htmlFor={day.id} className="text-sm">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Fitness Tab */}
                <TabsContent value="fitness" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workoutType">Tipo de Treino</Label>
                      <Input
                        id="workoutType"
                        value={workoutType}
                        onChange={(e) => setWorkoutType(e.target.value)}
                        placeholder="Ex: Musculação, Corrida, Yoga"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workoutDuration">Duração por Sessão (minutos)</Label>
                      <Input
                        id="workoutDuration"
                        type="number"
                        value={workoutDuration}
                        onChange={(e) => setWorkoutDuration(e.target.value)}
                        placeholder="Ex: 45"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dias de Treino</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`fitness-${day.id}`}
                            checked={workoutDays.includes(day.id)}
                            onCheckedChange={() => toggleDay(day.id, workoutDays, setWorkoutDays)}
                          />
                          <Label htmlFor={`fitness-${day.id}`} className="text-sm">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetAmount">Valor Alvo</Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        step="0.01"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="Ex: 1000"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentAmount">Valor Atual (opcional)</Label>
                      <Input
                        id="currentAmount"
                        type="number"
                        step="0.01"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                        placeholder="Ex: 250"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Moeda</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="BRL">BRL (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Other Categories */}
                <TabsContent value="career" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Para metas de carreira, utiliza a descrição e milestones abaixo para detalhar os passos necessários.
                  </p>
                </TabsContent>

                <TabsContent value="personal" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Para metas pessoais, utiliza a descrição e milestones abaixo para detalhar os teus objetivos.
                  </p>
                </TabsContent>

                <TabsContent value="other" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Para outros tipos de metas, utiliza a descrição e milestones abaixo para detalhar o que queres alcançar.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Marcos/Conquistas
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMilestone}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </CardTitle>
              <CardDescription>
                Divide a tua meta em marcos menores para melhor acompanhamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {milestones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Adiciona marcos para acompanhar o progresso</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <Input
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, e.target.value)}
                          placeholder="Ex: Completar módulo básico"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMilestone(milestone.id)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'A criar...' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
