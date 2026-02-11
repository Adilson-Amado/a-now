export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
  targetDate?: Date;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt?: Date;
}
