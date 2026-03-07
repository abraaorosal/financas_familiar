import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/shared/components/AppLayout';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { TransactionsPage } from '@/features/transactions/pages/TransactionsPage';
import { CardsPage } from '@/features/cards/pages/CardsPage';
import { AccountsPage } from '@/features/accounts/pages/AccountsPage';
import { CategoriesPage } from '@/features/categories/pages/CategoriesPage';
import { InsightsPage } from '@/features/insights/pages/InsightsPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { useCloudAuth } from '@/sync/CloudAuthContext';

const FullscreenStatus = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-xl2 border border-slate-200 bg-white p-6 text-center shadow-card">
        <p className="font-display text-lg font-semibold text-primary-700">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
};

const RequireCloudSession = () => {
  const { isConfigured, user, status } = useCloudAuth();

  if (!isConfigured) {
    return <Outlet />;
  }

  if (status === 'loading') {
    return <FullscreenStatus title="Carregando" description="Verificando autenticação em nuvem." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const LoginEntry = () => {
  const { isConfigured, user, status } = useCloudAuth();

  if (!isConfigured) {
    return <Navigate to="/" replace />;
  }

  if (status === 'loading') {
    return <FullscreenStatus title="Carregando" description="Verificando autenticação em nuvem." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
};

const AppEntryRedirect = () => {
  const { isConfigured, user, status } = useCloudAuth();

  if (isConfigured && status === 'loading') {
    return <FullscreenStatus title="Carregando" description="Verificando autenticação em nuvem." />;
  }

  if (isConfigured && !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/" replace />;
};

export const AppRouter = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginEntry />} />

        <Route element={<RequireCloudSession />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/lancamentos" element={<TransactionsPage />} />
            <Route path="/cartoes" element={<CardsPage />} />
            <Route path="/contas" element={<AccountsPage />} />
            <Route path="/categorias" element={<CategoriesPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<AppEntryRedirect />} />
      </Routes>
    </HashRouter>
  );
};
