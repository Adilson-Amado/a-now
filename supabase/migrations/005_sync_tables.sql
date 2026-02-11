-- Migration: Create sync tables for data synchronization
-- This creates tables to store synchronized data from local storage

-- Sync Tasks Table
CREATE TABLE IF NOT EXISTS sync_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    local_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('urgent', 'important', 'can-wait', 'dispensable')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    tags TEXT[],
    ai_recommendation TEXT CHECK (ai_recommendation IN ('do-now', 'schedule', 'delegate', 'ignore')),
    ai_reason TEXT
);

-- Sync Notes Table
CREATE TABLE IF NOT EXISTS sync_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    local_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT NOT NULL CHECK (category IN ('personal', 'work', 'ideas', 'todo', 'learning', 'other')),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sync Goals Table
CREATE TABLE IF NOT EXISTS sync_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    local_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('personal', 'work', 'ideas', 'todo', 'learning', 'other')),
    target_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER NOT NULL CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sync Queue Table (for offline changes)
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'note', 'goal')),
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error TEXT
);

-- Sync Conflicts Table
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'note', 'goal')),
    entity_id TEXT NOT NULL,
    local_data JSONB NOT NULL,
    remote_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution TEXT CHECK (resolution IN ('local', 'remote', 'merge'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_tasks_user_id ON sync_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_tasks_local_id ON sync_tasks(local_id);
CREATE INDEX IF NOT EXISTS idx_sync_tasks_updated_at ON sync_tasks(updated_at);

CREATE INDEX IF NOT EXISTS idx_sync_notes_user_id ON sync_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_notes_local_id ON sync_notes(local_id);
CREATE INDEX IF NOT EXISTS idx_sync_notes_updated_at ON sync_notes(updated_at);

CREATE INDEX IF NOT EXISTS idx_sync_goals_user_id ON sync_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_goals_local_id ON sync_goals(local_id);
CREATE INDEX IF NOT EXISTS idx_sync_goals_updated_at ON sync_goals(updated_at);

CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_processed_at ON sync_queue(processed_at);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user_id ON sync_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_resolved_at ON sync_conflicts(resolved_at);

-- RLS (Row Level Security) Policies
ALTER TABLE sync_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Sync Tasks Policies
CREATE POLICY "Users can view their own sync tasks" ON sync_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync tasks" ON sync_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync tasks" ON sync_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync tasks" ON sync_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Sync Notes Policies
CREATE POLICY "Users can view their own sync notes" ON sync_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync notes" ON sync_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync notes" ON sync_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync notes" ON sync_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Sync Goals Policies
CREATE POLICY "Users can view their own sync goals" ON sync_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync goals" ON sync_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync goals" ON sync_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync goals" ON sync_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Sync Queue Policies
CREATE POLICY "Users can view their own sync queue" ON sync_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync queue" ON sync_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync queue" ON sync_queue
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync queue" ON sync_queue
    FOR DELETE USING (auth.uid() = user_id);

-- Sync Conflicts Policies
CREATE POLICY "Users can view their own sync conflicts" ON sync_conflicts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync conflicts" ON sync_conflicts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync conflicts" ON sync_conflicts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync conflicts" ON sync_conflicts
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_sync_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
CREATE TRIGGER update_sync_tasks_updated_at BEFORE UPDATE ON sync_tasks
    FOR EACH ROW EXECUTE FUNCTION update_sync_updated_at_column();

CREATE TRIGGER update_sync_notes_updated_at BEFORE UPDATE ON sync_notes
    FOR EACH ROW EXECUTE FUNCTION update_sync_updated_at_column();

CREATE TRIGGER update_sync_goals_updated_at BEFORE UPDATE ON sync_goals
    FOR EACH ROW EXECUTE FUNCTION update_sync_updated_at_column();

-- Function to clean old processed queue items
CREATE OR REPLACE FUNCTION cleanup_sync_queue()
RETURNS void AS $$
BEGIN
    DELETE FROM sync_queue 
    WHERE processed_at IS NOT NULL 
    AND processed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get sync statistics
CREATE OR REPLACE FUNCTION get_sync_stats(p_user_id UUID)
RETURNS TABLE(
    total_tasks BIGINT,
    total_notes BIGINT,
    total_goals BIGINT,
    pending_queue_items BIGINT,
    unresolved_conflicts BIGINT,
    last_sync TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM sync_tasks WHERE user_id = p_user_id),
        (SELECT COUNT(*) FROM sync_notes WHERE user_id = p_user_id),
        (SELECT COUNT(*) FROM sync_goals WHERE user_id = p_user_id),
        (SELECT COUNT(*) FROM sync_queue WHERE user_id = p_user_id AND processed_at IS NULL),
        (SELECT COUNT(*) FROM sync_conflicts WHERE user_id = p_user_id AND resolved_at IS NULL),
        (SELECT MAX(updated_at) FROM (
            SELECT MAX(updated_at) as updated_at FROM sync_tasks WHERE user_id = p_user_id
            UNION ALL
            SELECT MAX(updated_at) as updated_at FROM sync_notes WHERE user_id = p_user_id
            UNION ALL
            SELECT MAX(updated_at) as updated_at FROM sync_goals WHERE user_id = p_user_id
        ) as latest_updates)
    ;
END;
$$ LANGUAGE plpgsql;
