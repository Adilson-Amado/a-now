-- ========================================
-- CONFIGURE EMAIL SERVICE FOR CONFIRMATION
-- ========================================

-- This script helps ensure email confirmation is working properly
-- Note: Email templates should be configured in Supabase Dashboard

-- Check current auth configuration
SELECT key, value FROM auth.config WHERE key IN ('enable_email_confirmations', 'external_email_enabled');

-- Enable email confirmations (should be enabled by default)
UPDATE auth.config 
SET value = 'true'::jsonb 
WHERE key = 'enable_email_confirmations';

-- Enable external email service
UPDATE auth.config 
SET value = 'true'::jsonb 
WHERE key = 'external_email_enabled';

-- Set default email templates if not exists
INSERT INTO auth.email_templates (id, name, subject, content, use_template)
VALUES 
  (
    'signup_confirmation',
    'signup_confirmation',
    'Confirma o teu email - FocusFlow',
    'Olá {{user_email}},

Por favor, confirma o teu email para ativar a tua conta FocusFlow.

Clica no link abaixo para confirmar:
{{confirmation_url}}

Se não criaste esta conta, por favor ignora este email.

Obrigado,
Equipa FocusFlow',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Email service configured for confirmation';
    RAISE NOTICE 'Email templates created/updated';
    RAISE NOTICE 'Make sure SMTP settings are configured in Supabase Dashboard';
END $$;
