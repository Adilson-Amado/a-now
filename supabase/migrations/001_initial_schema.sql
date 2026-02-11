-- ========================================
-- FOCUSFLOW - INITIAL DATABASE SCHEMA
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- AUTHENTICATION & USER MANAGEMENT
-- ========================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'pt',
    theme TEXT DEFAULT 'dark',
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TASKS MANAGEMENT
-- ========================================

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'general' CHECK (category IN ('work', 'personal', 'health', 'learning', 'finance', 'other')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    tags TEXT[] DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT false,
    ai_insights JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task timeline/events for tracking
CREATE TABLE IF NOT EXISTS public.task_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'completed', 'cancelled', 'started', 'paused')),
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- GOALS MANAGEMENT
-- ========================================

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('education', 'fitness', 'financial', 'career', 'personal', 'other')),
    target_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Education specific fields
    total_sessions INTEGER,
    completed_sessions INTEGER DEFAULT 0,
    session_duration INTEGER, -- minutes
    
    -- Fitness specific fields
    workout_type TEXT,
    workout_duration INTEGER, -- minutes
    
    -- Financial specific fields
    target_amount DECIMAL(12,2),
    current_amount DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP', 'BRL')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal milestones
CREATE TABLE IF NOT EXISTS public.goal_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_value DECIMAL(12,2),
    current_value DECIMAL(12,2) DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- NOTES MANAGEMENT
-- ========================================

-- Notes table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'personal' CHECK (category IN ('personal', 'work', 'ideas', 'todo', 'learning', 'other')),
    tags TEXT[] DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT false,
    ai_summary TEXT,
    voice_recording_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- NOTIFICATIONS
-- ========================================

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT NOT NULL CHECK (type IN ('task_reminder', 'goal_milestone', 'daily_report', 'system', 'achievement')),
    data JSONB, -- Additional data for the notification
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    task_reminders BOOLEAN DEFAULT true,
    goal_updates BOOLEAN DEFAULT true,
    daily_reports BOOLEAN DEFAULT true,
    achievements BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- USER PREFERENCES & SETTINGS
-- ========================================

-- User preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    working_hours_start TIME DEFAULT '09:00:00',
    working_hours_end TIME DEFAULT '17:00:00',
    working_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Mon-Fri
    pomodoro_duration INTEGER DEFAULT 25, -- minutes
    short_break_duration INTEGER DEFAULT 5, -- minutes
    long_break_duration INTEGER DEFAULT 15, -- minutes
    auto_start_breaks BOOLEAN DEFAULT false,
    auto_start_pomodoros BOOLEAN DEFAULT false,
    daily_goal_duration INTEGER DEFAULT 480, -- minutes (8 hours)
    weekly_goal_days INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ANALYTICS & STATISTICS
-- ========================================

-- Daily stats
CREATE TABLE IF NOT EXISTS public.daily_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    total_work_time INTEGER DEFAULT 0, -- minutes
    total_break_time INTEGER DEFAULT 0, -- minutes
    pomodoros_completed INTEGER DEFAULT 0,
    goals_progressed INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    productivity_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Weekly stats
CREATE TABLE IF NOT EXISTS public.weekly_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL, -- Monday of the week
    tasks_completed INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    total_work_time INTEGER DEFAULT 0, -- minutes
    pomodoros_completed INTEGER DEFAULT 0,
    goals_achieved INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    productivity_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);

-- Task events indexes
CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON public.task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_task_events_user_id ON public.task_events(user_id);
CREATE INDEX IF NOT EXISTS idx_task_events_created_at ON public.task_events(created_at);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_category ON public.goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON public.goals(completed);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON public.goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON public.goals(created_at);

-- Goal milestones indexes
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON public.goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_user_id ON public.goal_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_completed ON public.goal_milestones(completed);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON public.notes USING GIN(tags);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Stats indexes
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_week ON public.weekly_stats(user_id, week_start);

-- ========================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Task events policies
CREATE POLICY "Users can view own task events" ON public.task_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own task events" ON public.task_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Goal milestones policies
CREATE POLICY "Users can view own goal milestones" ON public.goal_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goal milestones" ON public.goal_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goal milestones" ON public.goal_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goal milestones" ON public.goal_milestones FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notification preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Stats policies
CREATE POLICY "Users can view own daily stats" ON public.daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own daily stats" ON public.daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily stats" ON public.daily_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own weekly stats" ON public.weekly_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own weekly stats" ON public.weekly_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly stats" ON public.weekly_stats FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- TRIGGERS AND FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_goal_milestones_updated_at BEFORE UPDATE ON public.goal_milestones FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_daily_stats_updated_at BEFORE UPDATE ON public.daily_stats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_weekly_stats_updated_at BEFORE UPDATE ON public.weekly_stats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Create default notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);
    
    -- Create default user preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create task event on task creation/update
CREATE OR REPLACE FUNCTION public.create_task_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.task_events (task_id, user_id, event_type, event_data)
        VALUES (NEW.id, NEW.user_id, 'created', row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.task_events (task_id, user_id, event_type, event_data)
            VALUES (NEW.id, NEW.user_id, NEW.status, row_to_json(NEW));
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for task events
CREATE TRIGGER create_task_event_trigger
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.create_task_event();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for user dashboard stats
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
    COUNT(DISTINCT CASE WHEN g.completed = true THEN g.id END) as completed_goals,
    COUNT(DISTINCT CASE WHEN g.completed = false THEN g.id END) as active_goals,
    COUNT(DISTINCT n.id) as total_notes,
    COALESCE(ds.productivity_score, 0) as today_productivity
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.user_id
LEFT JOIN public.goals g ON u.id = g.user_id
LEFT JOIN public.notes n ON u.id = n.user_id
LEFT JOIN public.daily_stats ds ON u.id = ds.user_id AND ds.date = CURRENT_DATE
GROUP BY u.id, ds.productivity_score;

-- View for recent activity
CREATE OR REPLACE VIEW public.user_recent_activity AS
SELECT 
    u.id as user_id,
    'task' as activity_type,
    t.title as title,
    t.status as status,
    t.created_at as activity_date
FROM public.users u
JOIN public.tasks t ON u.id = t.user_id
WHERE t.created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    u.id as user_id,
    'goal' as activity_type,
    g.title as title,
    CASE WHEN g.completed THEN 'completed' ELSE 'active' END as status,
    g.created_at as activity_date
FROM public.users u
JOIN public.goals g ON u.id = g.user_id
WHERE g.created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    u.id as user_id,
    'note' as activity_type,
    n.title as title,
    n.category as status,
    n.created_at as activity_date
FROM public.users u
JOIN public.notes n ON u.id = n.user_id
WHERE n.created_at >= NOW() - INTERVAL '7 days'

ORDER BY activity_date DESC;

-- ========================================
-- SAMPLE DATA (OPTIONAL - FOR DEVELOPMENT)
-- ========================================

-- This section can be uncommented for development/testing
-- Remove or comment out for production

/*
-- Sample user (will be created automatically on first signup)
-- Sample tasks
INSERT INTO public.tasks (user_id, title, description, status, priority, category, due_date)
SELECT 
    u.id,
    'Complete project documentation',
    'Write comprehensive documentation for the FocusFlow app',
    'in_progress',
    'high',
    'work',
    NOW() + INTERVAL '3 days'
FROM public.users u LIMIT 1;

INSERT INTO public.tasks (user_id, title, description, status, priority, category)
SELECT 
    u.id,
    'Study React hooks',
    'Deep dive into useEffect, useState, and custom hooks',
    'pending',
    'medium',
    'learning'
FROM public.users u LIMIT 1;

-- Sample goals
INSERT INTO public.goals (user_id, title, description, category, target_date, target_amount, currency)
SELECT 
    u.id,
    'Save for new laptop',
    'Save €2000 for a new development laptop',
    'financial',
    NOW() + INTERVAL '6 months',
    2000.00,
    'EUR'
FROM public.users u LIMIT 1;

INSERT INTO public.goals (user_id, title, description, category, total_sessions, session_duration)
SELECT 
    u.id,
    'Complete React course',
    'Finish the advanced React course on Udemy',
    'education',
    50,
    60
FROM public.users u LIMIT 1;

-- Sample notes
INSERT INTO public.notes (user_id, title, content, category, tags)
SELECT 
    u.id,
    'React Hooks Best Practices',
    'Key points to remember about React hooks:
1. Always call hooks at the top level
2. Only call hooks from React functions
3. Use custom hooks to share stateful logic
4. Be careful with dependencies in useEffect',
    'learning',
    ARRAY['react', 'hooks', 'javascript']
FROM public.users u LIMIT 1;
*/

-- ========================================
-- COMPLETION
-- ========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Allow read access for public views
GRANT SELECT ON public.user_dashboard_stats TO authenticated;
GRANT SELECT ON public.user_recent_activity TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'FocusFlow database schema created successfully!';
    RAISE NOTICE 'Tables: users, tasks, task_events, goals, goal_milestones, notes, notifications, notification_preferences, user_preferences, daily_stats, weekly_stats';
    RAIse NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Triggers and functions created for automatic timestamp updates and user profile creation';
    RAISE NOTICE 'Views created for dashboard stats and recent activity';
END $$;
