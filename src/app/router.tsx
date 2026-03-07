import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/shared/components/AppLayout';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { TransactionsPage } from '@/features/transactions/pages/TransactionsPage';
import { CardsPage } from '@/features/cards/pages/CardsPage';
import { AccountsPage } from '@/features/accounts/pages/AccountsPage';
import { CategoriesPage } from '@/features/categories/pages/CategoriesPage';
import { InsightsPage } from '@/features/insights/pages/InsightsPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';

export const AppRouter = () => {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/lancamentos" element={<TransactionsPage />} />
          <Route path="/cartoes" element={<CardsPage />} />
          <Route path="/contas" element={<AccountsPage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};
