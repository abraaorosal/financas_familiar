import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LockKeyhole, RefreshCcw } from 'lucide-react';
import { useCloudAuth } from '@/sync/CloudAuthContext';

export const LoginPage = () => {
  const { isConfigured, user, status, signIn, signUp, refresh } = useCloudAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState<'login' | 'signup' | 'refresh' | null>(null);

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl rounded-xl2 border border-amber-200 bg-amber-50 p-6 shadow-card">
          <h1 className="font-display text-2xl font-bold text-amber-900">Configuração pendente</h1>
          <p className="mt-2 text-sm text-amber-800">
            A sincronização em nuvem ainda não foi configurada. Defina <strong>VITE_SUPABASE_URL</strong> e{' '}
            <strong>VITE_SUPABASE_ANON_KEY</strong> para liberar o login.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-xl2 border border-slate-200 bg-white p-6 text-center shadow-card">
          <p className="font-display text-lg font-semibold text-primary-700">Verificando sessão...</p>
          <p className="text-sm text-slate-500">Aguarde um instante.</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const submitLogin = async () => {
    setBusyAction('login');
    setMessage('');

    try {
      await signIn(email, password);
      setMessage('Login realizado com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha no login.');
    } finally {
      setBusyAction(null);
    }
  };

  const submitSignup = async () => {
    setBusyAction('signup');
    setMessage('');

    try {
      await signUp(email, password);
      setMessage('Cadastro concluído. Se o Supabase exigir, confirme o e-mail e entre novamente.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha no cadastro.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <LockKeyhole size={18} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-text">Entrar</h1>
            <p className="text-sm text-slate-600">Finanças da Casa</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">E-mail</span>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-3"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@provedor.com"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Senha</span>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-3"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="******"
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
            onClick={() => {
              void submitLogin();
            }}
            disabled={!email || !password || busyAction !== null}
          >
            {busyAction === 'login' ? 'Entrando...' : 'Entrar'}
          </button>

          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-70"
            onClick={() => {
              void submitSignup();
            }}
            disabled={!email || !password || busyAction !== null}
          >
            {busyAction === 'signup' ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </div>

        <button
          type="button"
          className="mt-2 inline-flex items-center gap-2 rounded-md px-1 py-1 text-xs text-slate-600 disabled:opacity-70"
          disabled={busyAction !== null}
          onClick={() => {
            setBusyAction('refresh');
            void refresh().finally(() => setBusyAction(null));
          }}
        >
          <RefreshCcw size={13} /> Atualizar sessão
        </button>

        {message ? <p className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">{message}</p> : null}
      </div>
    </div>
  );
};
