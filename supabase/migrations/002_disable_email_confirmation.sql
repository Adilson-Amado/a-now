-- ========================================
-- DISABLE EMAIL CONFIRMATION FOR DEVELOPMENT
-- ========================================

-- Update auth config to disable email confirmation
-- This allows users to login immediately after signup

-- Note: This should be done in Supabase Dashboard > Authentication > Settings
-- But here's the SQL approach for programmatic setup

-- Disable email confirmation for new users
UPDATE auth.config 
SET value = 'false'::jsonb 
WHERE key = 'enable_email_confirmations';

-- Alternatively, you can set this in the Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Find "Enable email confirmations" 
-- 3. Set to OFF

-- For existing users who haven't confirmed email
-- You can manually confirm them with:
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com'; -- Replace with actual email

-- Or confirm all unconfirmed users (for development)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Email confirmation disabled for development';
    RAISE NOTICE 'Users can now login immediately after signup';
    RAISE NOTICE 'Existing unconfirmed users have been confirmed';
END $$;
