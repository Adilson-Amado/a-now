import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

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

  // Check for existing session on mount
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url
          };
          setUser(userData);
          console.log('Session restored for user:', userData.email);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        // Clear any corrupted session data
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // First check if there's an existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      if (existingSession?.user) {
        // User is already logged in, just update the state
        const userData: User = {
          id: existingSession.user.id,
          email: existingSession.user.email!,
          name: existingSession.user.user_metadata?.full_name || existingSession.user.email?.split('@')[0],
          avatar_url: existingSession.user.user_metadata?.avatar_url
        };
        setUser(userData);
        return { success: true };
      }

      // If no existing session, proceed with login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email ou password incorretos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Por favor, confirma o teu email antes de fazer login' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          avatar_url: data.user.user_metadata?.avatar_url
        };
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: 'Erro desconhecido ao fazer login' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro ao conectar com o servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Register error:', error);
        return { success: false, error: error.message };
      }

      // User created successfully but needs email confirmation
      if (data.user && !data.session) {
        return { 
          success: true, 
          error: 'Conta criada com sucesso! Verifica o teu email para confirmar a conta e faz login.' 
        };
      }

      // User created and confirmed (rare case)
      if (data.user && data.session) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || name,
          avatar_url: data.user.user_metadata?.avatar_url
        };
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: 'Erro desconhecido ao criar conta' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Erro ao conectar com o servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Resend error:', error);
        if (error.message.includes('rate limit')) {
          return { 
            success: false, 
            error: 'Limite de emails atingido. Tenta novamente em alguns minutos ou verifica o teu email/spam.' 
          };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Resend error:', error);
      return { success: false, error: 'Erro ao reenviar email de confirmação' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      resendConfirmationEmail,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}
