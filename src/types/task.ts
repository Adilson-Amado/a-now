export type TaskPriority = 'urgent' | 'important' | 'can-wait' | 'dispensable';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export type AIRecommendation = 'do-now' | 'schedule' | 'delegate' | 'ignore';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  lifecycle?: 'active' | 'paused' | 'archived';
  aiRecommendation?: AIRecommendation;
  aiReason?: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags?: string[];
  category?: string;
  project?: string;
  effortLevel?: 'light' | 'medium' | 'heavy';
  taskType?: 'deep-focus' | 'operational' | 'creative' | 'quick';
  lastFocusStartedAt?: Date;
  lastFocusEndedAt?: Date;
  totalFocusMinutes?: number;
}

export interface FocusSession {
  id: string;
  taskId: string;
  startedAt: Date;
  endedAt?: Date;
  plannedMinutes: number;
  actualMinutes?: number;
  cycleIndex: number;
  moodBefore?: 'low' | 'neutral' | 'high';
  moodAfter?: 'low' | 'neutral' | 'high';
  cognitiveLoad?: 'light' | 'medium' | 'heavy';
}

export interface DailyStats {
  date: Date;
  tasksCreated: number;
  tasksCompleted: number;
  productiveMinutes: number;
  productivityScore: number; // 0-100
  peakHours: number[];
}

export type ProductivityState = 'productive' | 'partial' | 'unproductive';

export interface TimelineEntry {
  id: string;
  taskId?: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  type: 'task' | 'break' | 'focus-session';
}

export interface AIInsight {
  id: string;
  type: 'tip' | 'warning' | 'suggestion' | 'praise';
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dismissed?: boolean;
}
