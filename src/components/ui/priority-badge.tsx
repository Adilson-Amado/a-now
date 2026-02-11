import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TaskPriority, AIRecommendation } from '@/types/task';
import { AlertCircle, Clock, ArrowRight, X } from 'lucide-react';
import { getPriorityLabel } from '@/lib/taskMappings';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

const priorityConfig: Record<TaskPriority, { className: string }> = {
  urgent: { className: 'priority-urgent' },
  important: { className: 'priority-important' },
  'can-wait': { className: 'priority-can-wait' },
  dispensable: { className: 'priority-dispensable' },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        priorityConfig[priority].className,
        className
      )}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}

interface AIRecommendationBadgeProps {
  recommendation: AIRecommendation;
  reason?: string;
  className?: string;
}

const recommendationConfig: Record<
  AIRecommendation,
  { label: string; icon: typeof AlertCircle; className: string }
> = {
  'do-now': { label: 'Execute agora', icon: AlertCircle, className: 'text-urgent bg-urgent/10' },
  schedule: { label: 'Agende', icon: Clock, className: 'text-important bg-important/10' },
  delegate: { label: 'Delegue', icon: ArrowRight, className: 'text-can-wait bg-can-wait/10' },
  ignore: { label: 'Ignore', icon: X, className: 'text-muted-foreground bg-muted' },
};

export function AIRecommendationBadge({ recommendation, reason, className }: AIRecommendationBadgeProps) {
  const config = recommendationConfig[recommendation];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium',
        config.className,
        className
      )}
      title={reason}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </motion.div>
  );
}
