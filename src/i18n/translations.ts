export type Language = 'pt' | 'en';

export const translations = {
  pt: {
    // Navigation
    dashboard: 'Dashboard',
    tasks: 'Tarefas',
    reports: 'Relatórios',
    notes: 'Notas',
    goals: 'Metas',
    settings: 'Definições',
    profile: 'Perfil',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Adicionar',
    search: 'Pesquisar',
    loading: 'A carregar...',
    
    // Dashboard
    aiAssistant: 'AI Assistente',
    analyzingPatterns: 'Analisando os teus padrões para sugestões personalizadas',
    nextTasks: 'Próximas tarefas',
    noPendingTasks: 'Nenhuma tarefa pendente',
    newTask: 'Nova tarefa',
    
    // Tasks
    addTask: 'Adicionar tarefa',
    quickAdd: 'Adicionar tarefa rápida...',
    whatToDo: 'O que precisas fazer?',
    describeTask: 'Descreve a tarefa...',
    details: 'Detalhes (opcional)',
    addContext: 'Adiciona contexto ou notas...',
    priority: 'Prioridade',
    estimatedTime: 'Tempo estimado (minutos)',
    dueDate: 'Data de entrega',
    dueTime: 'Hora de entrega',
    generateWithAI: 'Gerar com AI',
    generatingAI: 'A gerar...',
    pending: 'Pendentes',
    completed: 'Concluídas',
    all: 'Todas',
    noPendingGoodWork: 'Nenhuma tarefa pendente. Bom trabalho!',
    noCompletedToday: 'Nenhuma tarefa concluída hoje',
    noTasks: 'Nenhuma tarefa',
    
    // Priorities
    urgent: 'Urgente',
    urgentDesc: 'Precisa ser feito hoje',
    important: 'Importante',
    importantDesc: 'Tem impacto significativo',
    canWait: 'Pode esperar',
    canWaitDesc: 'Sem prazo imediato',
    dispensable: 'Dispensável',
    dispensableDesc: 'Baixa prioridade',
    
    // AI Recommendations
    doNow: 'Faça agora',
    schedule: 'Agende',
    delegate: 'Delegue',
    ignore: 'Ignore',
    
    // Productivity
    productive: 'Produtivo',
    partial: 'Parcial',
    unproductive: 'Improdutivo',
    productivityToday: 'Produtividade de hoje',
    tasksCompleted: 'tarefas concluídas',
    
    // Reports
    thisWeek: 'Esta semana',
    completionRate: 'Taxa de conclusão',
    ofAllTasks: 'de todas as tarefas',
    insights: 'Insights',
    mostProductiveTime: 'O teu horário mais produtivo parece ser entre 9h e 11h da manhã.',
    averageTasks: 'Completas em média 3 tarefas por dia. Mantém o ritmo!',
    
    // Notes
    myNotes: 'As minhas notas',
    addNote: 'Adicionar nota',
    noteTitle: 'Título da nota',
    noteContent: 'Conteúdo...',
    noNotes: 'Nenhuma nota ainda',
    
    // Goals
    myGoals: 'As minhas metas',
    addGoal: 'Adicionar meta',
    goalTitle: 'Título da meta',
    goalDescription: 'Descrição',
    targetDate: 'Data alvo',
    progress: 'Progresso',
    noGoals: 'Nenhuma meta definida',
    
    // Settings
    appearance: 'Aparência',
    language: 'Idioma',
    theme: 'Tema',
    lightTheme: 'Claro',
    darkTheme: 'Escuro',
    systemTheme: 'Sistema',
    dataPrivacy: 'Dados e Privacidade',
    exportData: 'Exportar dados',
    clearData: 'Limpar todos os dados',
    about: 'Sobre',
    version: 'Versão',
    
    // Notifications
    notifications: 'Notificações',
    enableNotifications: 'Ativar notificações',
    dailyReminder: 'Lembrete diário',
    soundEffects: 'Efeitos sonoros',
    notificationSettings: 'Configurações de notificações',
    notificationStatus: 'Status das notificações',
    testNotification: 'Testar notificação',
    notificationVolume: 'Volume das notificações',
    notificationDuration: 'Duração das notificações',
    vibrationEnabled: 'Vibração ativada',
    taskNotifications: 'Notificações de tarefas',
    goalNotifications: 'Notificações de objetivos',
    pomodoroNotifications: 'Notificações Pomodoro',
    reminderNotifications: 'Notificações de lembretes',
    achievementNotifications: 'Notificações de conquistas',
    dailySummary: 'Resumo diário',
    weeklyReport: 'Relatório semanal',
    deviceSettings: 'Configurações do dispositivo',
    
    // Profile
    myProfile: 'O meu perfil',
    displayName: 'Nome de exibição',
    email: 'Email',
    bio: 'Bio',
    joinedOn: 'Membro desde',
    updateProfile: 'Atualizar perfil',
    
    // Day Header
    goodMorning: 'Bom dia',
    goodAfternoon: 'Boa tarde',
    goodEvening: 'Boa noite',
    todayIs: 'Hoje é',
    
    // Timeline
    dailyTimeline: 'Timeline do dia',
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite',
    
    // Chart
    productivityChart: 'Gráfico de produtividade',
    last7Days: 'Últimos 7 dias',
    tasksCreated: 'Tarefas criadas',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    reports: 'Reports',
    notes: 'Notes',
    goals: 'Goals',
    settings: 'Settings',
    profile: 'Profile',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    
    // Dashboard
    aiAssistant: 'AI Assistant',
    analyzingPatterns: 'Analyzing your patterns for personalized suggestions',
    nextTasks: 'Next tasks',
    noPendingTasks: 'No pending tasks',
    newTask: 'New task',
    
    // Tasks
    addTask: 'Add task',
    quickAdd: 'Quick add task...',
    whatToDo: 'What do you need to do?',
    describeTask: 'Describe the task...',
    details: 'Details (optional)',
    addContext: 'Add context or notes...',
    priority: 'Priority',
    estimatedTime: 'Estimated time (minutes)',
    dueDate: 'Due date',
    dueTime: 'Due time',
    generateWithAI: 'Generate with AI',
    generatingAI: 'Generating...',
    pending: 'Pending',
    completed: 'Completed',
    all: 'All',
    noPendingGoodWork: 'No pending tasks. Great work!',
    noCompletedToday: 'No tasks completed today',
    noTasks: 'No tasks',
    
    // Priorities
    urgent: 'Urgent',
    urgentDesc: 'Needs to be done today',
    important: 'Important',
    importantDesc: 'Has significant impact',
    canWait: 'Can wait',
    canWaitDesc: 'No immediate deadline',
    dispensable: 'Dispensable',
    dispensableDesc: 'Low priority',
    
    // AI Recommendations
    doNow: 'Do now',
    schedule: 'Schedule',
    delegate: 'Delegate',
    ignore: 'Ignore',
    
    // Productivity
    productive: 'Productive',
    partial: 'Partial',
    unproductive: 'Unproductive',
    productivityToday: 'Today\'s productivity',
    tasksCompleted: 'tasks completed',
    
    // Reports
    thisWeek: 'This week',
    completionRate: 'Completion rate',
    ofAllTasks: 'of all tasks',
    insights: 'Insights',
    mostProductiveTime: 'Your most productive time seems to be between 9am and 11am.',
    averageTasks: 'You complete an average of 3 tasks per day. Keep it up!',
    
    // Notes
    myNotes: 'My notes',
    addNote: 'Add note',
    noteTitle: 'Note title',
    noteContent: 'Content...',
    noNotes: 'No notes yet',
    
    // Goals
    myGoals: 'My goals',
    addGoal: 'Add goal',
    goalTitle: 'Goal title',
    goalDescription: 'Description',
    targetDate: 'Target date',
    progress: 'Progress',
    noGoals: 'No goals set',
    
    // Settings
    appearance: 'Appearance',
    language: 'Language',
    notifications: 'Notifications',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    systemTheme: 'System',
    enableNotifications: 'Enable notifications',
    dailyReminder: 'Daily reminder',
    soundEffects: 'Sound effects',
    dataPrivacy: 'Data & Privacy',
    exportData: 'Export data',
    clearData: 'Clear all data',
    about: 'About',
    version: 'Version',
    
    // Profile
    myProfile: 'My profile',
    displayName: 'Display name',
    email: 'Email',
    bio: 'Bio',
    joinedOn: 'Member since',
    updateProfile: 'Update profile',
    
    // Day Header
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    todayIs: 'Today is',
    
    // Timeline
    dailyTimeline: 'Daily timeline',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    
    // Chart
    productivityChart: 'Productivity chart',
    last7Days: 'Last 7 days',
    tasksCreated: 'Tasks created',
  },
} as const;

export type TranslationKey = keyof typeof translations.pt;
