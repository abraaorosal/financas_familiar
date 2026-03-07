import { useEffect, useState, type ReactNode } from 'react';
import { initializeDatabase } from '@/db/bootstrap';
import { useCloudAutoSync } from '@/sync/useCloudAutoSync';

interface AppBootstrapProps {
  children: ReactNode;
}

export const AppBootstrap = ({ children }: AppBootstrapProps) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  useCloudAutoSync(status === 'ready');

  useEffect(() => {
    initializeDatabase()
      .then(() => setStatus('ready'))
      .catch((error: unknown) => {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Erro ao iniciar banco local.');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl2 border border-slate-200 bg-white p-6 text-center shadow-card">
          <p className="font-display text-lg font-semibold text-primary-700">Carregando dados locais...</p>
          <p className="text-sm text-slate-500">Preparando o ambiente offline.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-xl rounded-xl2 border border-rose-200 bg-rose-50 p-6 shadow-card">
          <h1 className="font-display text-xl font-bold text-rose-800">Falha ao iniciar armazenamento local</h1>
          <p className="mt-2 text-sm text-rose-700">{errorMessage}</p>
          <p className="mt-3 text-sm text-rose-700">
            Verifique se o navegador permite IndexedDB e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
