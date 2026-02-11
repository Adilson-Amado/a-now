import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/i18n/translations';

type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
  language: Language;
  theme: Theme;
  notifications: boolean;
  dailyReminder: boolean;
  soundEffects: boolean;
  dueSoonMinutes: number;
  inactivityMinutes: number;
  notifyOnDueSoon: boolean;
  notifyOnDueNow: boolean;
  notifyOnLate: boolean;
  notifyOnInactivity: boolean;
  notifyOnAISuggestions: boolean;
  notifyOnMotivation: boolean;
  
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setNotifications: (enabled: boolean) => void;
  setDailyReminder: (enabled: boolean) => void;
  setSoundEffects: (enabled: boolean) => void;
  setDueSoonMinutes: (minutes: number) => void;
  setInactivityMinutes: (minutes: number) => void;
  setNotifyOnDueSoon: (enabled: boolean) => void;
  setNotifyOnDueNow: (enabled: boolean) => void;
  setNotifyOnLate: (enabled: boolean) => void;
  setNotifyOnInactivity: (enabled: boolean) => void;
  setNotifyOnAISuggestions: (enabled: boolean) => void;
  setNotifyOnMotivation: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'pt',
      theme: 'light',
      notifications: true,
      dailyReminder: true,
      soundEffects: false,
      dueSoonMinutes: 30,
      inactivityMinutes: 45,
      notifyOnDueSoon: true,
      notifyOnDueNow: true,
      notifyOnLate: true,
      notifyOnInactivity: true,
      notifyOnAISuggestions: true,
      notifyOnMotivation: true,
      
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setNotifications: (notifications) => set({ notifications }),
      setDailyReminder: (dailyReminder) => set({ dailyReminder }),
      setSoundEffects: (soundEffects) => set({ soundEffects }),
      setDueSoonMinutes: (dueSoonMinutes) => set({ dueSoonMinutes }),
      setInactivityMinutes: (inactivityMinutes) => set({ inactivityMinutes }),
      setNotifyOnDueSoon: (notifyOnDueSoon) => set({ notifyOnDueSoon }),
      setNotifyOnDueNow: (notifyOnDueNow) => set({ notifyOnDueNow }),
      setNotifyOnLate: (notifyOnLate) => set({ notifyOnLate }),
      setNotifyOnInactivity: (notifyOnInactivity) => set({ notifyOnInactivity }),
      setNotifyOnAISuggestions: (notifyOnAISuggestions) => set({ notifyOnAISuggestions }),
      setNotifyOnMotivation: (notifyOnMotivation) => set({ notifyOnMotivation }),
    }),
    {
      name: 'focus-flow-settings',
    }
  )
);
