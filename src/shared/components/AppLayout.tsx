import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CreditCard,
  FolderKanban,
  Home,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Wallet,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useCloudAuth } from '@/sync/CloudAuthContext';

const desktopNavigation = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/lancamentos', label: 'Lançamentos', icon: ReceiptText },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/contas', label: 'Contas', icon: Wallet },
  { to: '/categorias', label: 'Categorias', icon: FolderKanban },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

const mobilePrimaryNavigation = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/lancamentos', label: 'Lançar', icon: ReceiptText },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/contas', label: 'Contas', icon: Wallet },
];

const mobileSecondaryNavigation = [
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
  const { isConfigured, user, signOut } = useCloudAuth();
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isMobileMoreActive = useMemo(
    () => mobileSecondaryNavigation.some((item) => item.to === location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    if (!isConfigured) return;

    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-6">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-xl2 border border-slate-200 bg-white/80 p-4 shadow-card backdrop-blur md:flex md:flex-col">
        <div className="mb-5">
          <p className="font-display text-lg font-bold text-primary-700">HenriFinance</p>
          <p className="text-xs text-slate-500">Controle financeiro da família</p>
        </div>

        <nav className="space-y-1" aria-label="Navegação principal">
          {desktopNavigation.map((item) => {
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

      <main className="w-full min-w-0 px-0 md:px-6">
        {isConfigured && user ? (
          <div className="mb-4 flex flex-col gap-2 rounded-xl2 border border-slate-200 bg-white/90 p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-xs text-slate-600">
              Conectado: <span className="break-all font-semibold text-slate-800">{user.email}</span>
            </p>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 sm:w-auto"
              onClick={() => {
                void handleSignOut();
              }}
              disabled={isSigningOut}
            >
              <LogOut size={15} /> {isSigningOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        ) : null}
        <Outlet />
      </main>

      {isMoreOpen ? (
        <div className="fixed inset-x-3 bottom-[82px] z-40 rounded-xl2 border border-slate-200 bg-white p-3 shadow-xl md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Mais opções</p>
            <button
              type="button"
              className="rounded-md border border-slate-200 p-1 text-slate-600"
              aria-label="Fechar menu"
              onClick={() => setIsMoreOpen(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid gap-2">
            {mobileSecondaryNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMoreOpen(false)}
                  className={[
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <Icon size={16} /> {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-2 bottom-2 z-40 grid grid-cols-5 gap-1 rounded-xl2 border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur md:hidden"
        aria-label="Navegação mobile"
      >
        {mobilePrimaryNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] transition-colors',
                  isActive ? 'bg-primary-100 text-primary-700' : 'text-slate-500',
                ].join(' ')
              }
              end={item.to === '/'}
              onClick={() => setIsMoreOpen(false)}
            >
              <Icon size={15} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          className={[
            'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] transition-colors',
            isMoreOpen || isMobileMoreActive ? 'bg-primary-100 text-primary-700' : 'text-slate-500',
          ].join(' ')}
          onClick={() => setIsMoreOpen((prev) => !prev)}
        >
          <Menu size={15} />
          <span className="truncate">Mais</span>
        </button>
      </nav>
    </div>
  );
};
