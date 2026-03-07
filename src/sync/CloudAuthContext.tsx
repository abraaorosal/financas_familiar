import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { cloudAuthService } from './cloudSyncService';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

type CloudAuthStatus = 'loading' | 'ready';

interface CloudAuthContextValue {
  isConfigured: boolean;
  user: User | null;
  status: CloudAuthStatus;
  errorMessage: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CloudAuthContext = createContext<CloudAuthContextValue | undefined>(undefined);

interface CloudAuthProviderProps {
  children: ReactNode;
}

export const CloudAuthProvider = ({ children }: CloudAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<CloudAuthStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('ready');
      return;
    }

    const client = getSupabaseClient();
    let active = true;

    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setErrorMessage(error.message);
          setUser(null);
        } else {
          setErrorMessage('');
          setUser(data.session?.user ?? null);
        }

        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;

        setErrorMessage(error instanceof Error ? error.message : 'Falha ao verificar sessão em nuvem.');
        setUser(null);
        setStatus('ready');
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setStatus('ready');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refresh = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setStatus('ready');
      return;
    }

    setStatus('loading');
    try {
      const currentUser = await cloudAuthService.getCurrentUser();
      setUser(currentUser);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao atualizar sessão em nuvem.');
      setUser(null);
    } finally {
      setStatus('ready');
    }
  };

  const signIn = async (email: string, password: string) => {
    await cloudAuthService.signIn(email, password);
    await refresh();
  };

  const signUp = async (email: string, password: string) => {
    await cloudAuthService.signUp(email, password);
    await refresh();
  };

  const signOut = async () => {
    await cloudAuthService.signOut();
    await refresh();
  };

  const value: CloudAuthContextValue = {
    isConfigured: isSupabaseConfigured,
    user,
    status,
    errorMessage,
    signIn,
    signUp,
    signOut,
    refresh,
  };

  return <CloudAuthContext.Provider value={value}>{children}</CloudAuthContext.Provider>;
};

export const useCloudAuth = (): CloudAuthContextValue => {
  const context = useContext(CloudAuthContext);

  if (!context) {
    throw new Error('useCloudAuth deve ser usado dentro de CloudAuthProvider.');
  }

  return context;
};
