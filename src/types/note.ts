export interface Note {
  id: string;
  title: string;
  content?: string;
  category: 'personal' | 'work' | 'ideas' | 'todo' | 'learning' | 'other';
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}
