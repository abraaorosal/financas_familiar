import { BarChart3, CreditCard, FolderKanban, Home, ReceiptText, Settings, Wallet } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/lancamentos', label: 'Lançamentos', icon: ReceiptText },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/contas', label: 'Contas', icon: Wallet },
  { to: '/categorias', label: 'Categorias', icon: FolderKanban },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-primary-100 text-primary-800' : 'text-slate-600 hover:bg-slate-100',
  ].join(' ');

export const AppLayout = () => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] px-3 pb-24 pt-4 md:px-6 md:pb-6">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-xl2 border border-slate-200 bg-white/80 p-4 shadow-card backdrop-blur md:flex md:flex-col">
        <div className="mb-5">
          <p className="font-display text-lg font-bold text-primary-700">Finanças da Casa</p>
          <p className="text-xs text-slate-500">Controle financeiro da família</p>
        </div>

        <nav className="space-y-1" aria-label="Navegação principal">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="w-full px-0 md:px-6">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-2 bottom-2 z-40 flex gap-1 overflow-x-auto rounded-xl2 border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur md:hidden"
        aria-label="Navegação mobile"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex min-w-[88px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] transition-colors',
                  isActive ? 'bg-primary-100 text-primary-700' : 'text-slate-500',
                ].join(' ')
              }
              end={item.to === '/'}
            >
              <Icon size={15} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
