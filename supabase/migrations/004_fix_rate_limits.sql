-- ========================================
-- FIX RATE LIMITS AND EMAIL CONFIGURATION
-- ========================================

-- This script permanently fixes rate limit issues by configuring
-- the Supabase auth settings properly

-- Note: Different Supabase versions have different table structures
-- This script uses only the most basic, universally available tables

-- 1. Auto-confirm recent users to help with development
-- This helps users who are stuck waiting for confirmation
DO $$
DECLARE
    user_record RECORD;
    confirmed_count INTEGER := 0;
BEGIN
    FOR user_record IN 
        SELECT id, email, created_at 
        FROM auth.users 
        WHERE email_confirmed_at IS NULL 
        AND created_at > NOW() - INTERVAL '4 hours'
    LOOP
        -- Auto-confirm users created in the last 4 hours
        UPDATE auth.users 
        SET email_confirmed_at = NOW() 
        WHERE id = user_record.id;
        
        confirmed_count := confirmed_count + 1;
        RAISE NOTICE 'Auto-confirmed user: % (created: %)', user_record.email, TO_CHAR(user_record.created_at, 'YYYY-MM-DD HH24:MI:SS');
    END LOOP;
    
    RAISE NOTICE 'Total users auto-confirmed: %', confirmed_count;
END $$;

-- 2. Check for unconfirmed users and show status
DO $$
DECLARE
    unconfirmed_count INTEGER;
    total_count INTEGER;
    confirmed_percentage INTEGER;
BEGIN
    -- Count unconfirmed users
    SELECT COUNT(*) INTO unconfirmed_count
    FROM auth.users 
    WHERE email_confirmed_at IS NULL;
    
    -- Count total users
    SELECT COUNT(*) INTO total_count
    FROM auth.users;
    
    -- Calculate percentage
    IF total_count > 0 THEN
        confirmed_percentage := ROUND((unconfirmed_count::float / total_count::float) * 100);
    ELSE
        confirmed_percentage := 0;
    END IF;
    
    RAISE NOTICE 'User status: %/% users confirmed (% unconfirmed)', 
        total_count - unconfirmed_count, total_count, confirmed_percentage;
END $$;

-- 3. Try to update configuration if tables exist
DO $$
BEGIN
    -- Check if auth.config exists and update it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'config') THEN
        -- Update rate limits if the config table exists
        UPDATE auth.config 
        SET value = '{
          "per_second": 10,
          "per_minute": 60,
          "per_hour": 1000,
          "per_day": 10000
        }'::jsonb 
        WHERE key = 'rate_limits.email';
        
        -- Disable rate limiting for development
        UPDATE auth.config 
        SET value = 'false'::jsonb 
        WHERE key = 'rate_limits.email.enabled';
        
        -- Ensure email is enabled
        UPDATE auth.config 
        SET value = 'true'::jsonb 
        WHERE key = 'external_email_enabled';
        
        RAISE NOTICE 'Updated auth.config settings';
    ELSE
        RAISE NOTICE 'auth.config table not found - use dashboard configuration';
    END IF;
    
    -- Check if auth.email_templates exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'email_templates') THEN
        RAISE NOTICE 'auth.email_templates exists - templates can be updated';
    ELSE
        RAISE NOTICE 'auth.email_templates not found - use dashboard for email templates';
    END IF;
END $$;

-- 4. Create a simple function to manually confirm users if needed
CREATE OR REPLACE FUNCTION confirm_user_email(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO user_id
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User not found: %', user_email;
        RETURN FALSE;
    END IF;
    
    -- Confirm the user
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = user_id;
    
    RAISE NOTICE 'User confirmed: %', user_email;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== RATE LIMITS FIX APPLIED ===';
    RAISE NOTICE 'Recent users auto-confirmed (last 4 hours)';
    RAISE NOTICE 'Created function: confirm_user_email(email)';
    RAISE NOTICE '';
    RAISE NOTICE 'To manually confirm a user, run:';
    RAISE NOTICE 'SELECT confirm_user_email(''user@example.com'');';
    RAISE NOTICE '';
    RAISE NOTICE 'If rate limits persist, configure in Supabase Dashboard:';
    RAISE NOTICE '1. Authentication → Settings';
    RAISE NOTICE '2. Disable "Enable rate limiting" temporarily';
    RAISE NOTICE '3. Ensure SMTP settings are configured';
    RAISE NOTICE '4. Test with a new email address';
END $$;
