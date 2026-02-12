import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NETWORK_ERROR_PATTERNS = [
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'network request failed',
  'load failed',
];

function extractErrorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
}

function mapAuthError(error: unknown, fallback: string): string {
  const message = extractErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid login credentials')) {
    return 'Email ou password incorretos';
  }

  if (lowerMessage.includes('email not confirmed') || lowerMessage.includes('email not verified')) {
    return 'Por favor, confirma o teu email antes de fazer login';
  }

  if (lowerMessage.includes('rate limit')) {
    return 'Limite temporario atingido. Tenta novamente em alguns minutos.';
  }

  if (lowerMessage.includes('invalid api key') || lowerMessage.includes('apikey')) {
    return 'Configuracao de autenticacao invalida no deploy. Atualiza as variaveis do Supabase.';
  }

  if (NETWORK_ERROR_PATTERNS.some((pattern) => lowerMessage.includes(pattern))) {
    return 'Falha de conexao com o servidor de autenticacao. Verifica internet e configuracao do Supabase.';
  }

  return message || fallback;
}

function clearSupabaseAuthStorage() {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) continue;

      const isSupabaseTokenKey = key.startsWith('sb-') && key.endsWith('-auth-token');
      if (isSupabaseTokenKey || key === 'supabase.auth.token') {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn('Unable to clear auth storage:', error);
  }
}

function toAppUser(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): User {
  const email = authUser.email || '';
  const metadata = authUser.user_metadata || {};

  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : undefined;
  const avatarUrl = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined;

  return {
    id: authUser.id,
    email,
    name: fullName || email.split('@')[0] || 'utilizador',
    avatar_url: avatarUrl,
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const authInitialized = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!cancelled && session?.user) {
          setUser(toAppUser(session.user));
        }
      } catch (error) {
        console.error('Error getting session:', error);
        clearSupabaseAuthStorage();
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          authInitialized.current = true;
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Só processar se já inicializamos ou é um evento real
      if (authInitialized.current || session?.user) {
        if (!cancelled) {
          setUser(session?.user ? toAppUser(session.user) : null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Configuração em falta. No Vercel: Settings → Environment Variables e defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
      };
    }

    setIsLoading(true);

    try {
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (existingSession?.user) {
          setUser(toAppUser(existingSession.user));
          return { success: true };
        }
      } catch (sessionError) {
        console.warn('Session recovery before login failed:', sessionError);
        clearSupabaseAuthStorage();
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: mapAuthError(error, 'Erro ao fazer login') };
      }

      if (data.user) {
        setUser(toAppUser(data.user));
        return { success: true };
      }

      return { success: false, error: 'Erro desconhecido ao fazer login' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: mapAuthError(error, 'Erro ao conectar com o servidor') };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Configuração em falta. No Vercel: Settings → Environment Variables e defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
      };
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { success: false, error: mapAuthError(error, 'Erro ao criar conta') };
      }

      if (data.user && !data.session) {
        return {
          success: true,
          error: 'Conta criada com sucesso! Verifica o teu email para confirmar a conta e faz login.',
        };
      }

      if (data.user && data.session) {
        setUser(toAppUser(data.user));
        return { success: true };
      }

      return { success: false, error: 'Erro desconhecido ao criar conta' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: mapAuthError(error, 'Erro ao conectar com o servidor') };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearSupabaseAuthStorage();
      setUser(null);
      navigate('/login');
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Configuração em falta. No Vercel: Settings → Environment Variables e defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
      };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { success: false, error: mapAuthError(error, 'Erro ao reenviar email de confirmacao') };
      }

      return { success: true };
    } catch (error) {
      console.error('Resend error:', error);
      return { success: false, error: mapAuthError(error, 'Erro ao reenviar email de confirmacao') };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        resendConfirmationEmail,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
