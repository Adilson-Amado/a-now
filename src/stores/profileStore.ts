import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  displayName: string;
  email: string;
  bio: string;
  avatarUrl?: string;
  joinedAt: Date;
  mainObjectives: string[];
  productiveHours: string[];
  activeGoals: string[];
  focusPreferences: string;
  notificationPreferences: string;
  
  updateProfile: (updates: Partial<Omit<ProfileState, 'joinedAt' | 'updateProfile'>>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      displayName: 'Utilizador',
      email: '',
      bio: '',
      avatarUrl: undefined,
      joinedAt: new Date(),
      mainObjectives: [],
      productiveHours: [],
      activeGoals: [],
      focusPreferences: 'Sessao profunda pela manha e blocos curtos a tarde',
      notificationPreferences: 'Lembrete 30 min antes do prazo e alerta de inatividade',
      
      updateProfile: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    {
      name: 'focus-flow-profile',
    }
  )
);
