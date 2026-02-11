import { TaskPriority } from '@/types/task';

export const TASK_PRIORITY_OPTIONS: Array<{
  value: TaskPriority;
  label: string;
  description: string;
}> = [
  { value: 'dispensable', label: 'Baixa', description: 'Pode esperar sem impacto alto' },
  { value: 'can-wait', label: 'Media', description: 'Importante, mas nao urgente' },
  { value: 'important', label: 'Alta', description: 'Impacto relevante no objetivo' },
  { value: 'urgent', label: 'Critica', description: 'Risco imediato se atrasar' },
];

export const TASK_EFFORT_OPTIONS = [
  { value: 'light', label: 'Leve' },
  { value: 'medium', label: 'Medio' },
  { value: 'heavy', label: 'Pesado' },
] as const;

export const TASK_TYPE_OPTIONS = [
  { value: 'deep-focus', label: 'Foco profundo' },
  { value: 'operational', label: 'Operacional' },
  { value: 'creative', label: 'Criativa' },
  { value: 'quick', label: 'Rapida' },
] as const;

export const getPriorityLabel = (priority: TaskPriority): string =>
  TASK_PRIORITY_OPTIONS.find((item) => item.value === priority)?.label || 'Media';
