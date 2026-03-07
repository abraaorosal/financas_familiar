import { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Scale, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { useBudgets, useCategories, usePersons, useTransactions } from '@/shared/hooks/useAppData';
import { toMonthKey } from '@/shared/utils/date';
import { formatCurrencyFromCents } from '@/shared/utils/currency';
import { CategoryPieChart } from '@/shared/charts/CategoryPieChart';
import { DailyBalanceLineChart } from '@/shared/charts/DailyBalanceLineChart';
import { buildDashboardData } from '../selectors/dashboardSelectors';
import { EmptyState } from '@/shared/components/EmptyState';

export const DashboardPage = () => {
  const transactions = useTransactions();
  const categories = useCategories();
  const persons = usePersons();
  const budgets = useBudgets();

  const [month, setMonth] = useState<string>(toMonthKey(new Date()));
  const [personId, setPersonId] = useState<string | 'todas'>('todas');
  const [natureza, setNatureza] = useState<'fixa' | 'variavel' | 'todas'>('todas');
  const [formaPagamento, setFormaPagamento] = useState<
    'dinheiro' | 'debito' | 'pix' | 'boleto' | 'transferencia' | 'cartao_credito' | 'todas'
  >('todas');

  const dashboardData = useMemo(() => {
    return buildDashboardData(transactions, categories, budgets, {
      mes: month,
      pessoaId: personId,
      natureza,
      formaPagamento,
    });
  }, [transactions, categories, budgets, month, personId, natureza, formaPagamento]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumo mensal da casa com filtros rápidos para decisões diárias."
      />

      <section className="mb-6 grid gap-3 rounded-xl2 border border-slate-200 bg-white/85 p-4 shadow-card md:grid-cols-4 [&>*]:min-w-0">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Mês</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Pessoa</span>
          <select
            value={personId}
            onChange={(event) => setPersonId(event.target.value as string | 'todas')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="todas">Ambas</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Natureza</span>
          <select
            value={natureza}
            onChange={(event) => setNatureza(event.target.value as 'fixa' | 'variavel' | 'todas')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="todas">Fixa + variável</option>
            <option value="fixa">Fixa</option>
            <option value="variavel">Variável</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Pagamento</span>
          <select
            value={formaPagamento}
            onChange={(event) =>
              setFormaPagamento(
                event.target.value as
                  | 'dinheiro'
                  | 'debito'
                  | 'pix'
                  | 'boleto'
                  | 'transferencia'
                  | 'cartao_credito'
                  | 'todas'
              )
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="todas">Todos</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="debito">Débito</option>
            <option value="pix">Pix</option>
            <option value="boleto">Boleto</option>
            <option value="transferencia">Transferência</option>
            <option value="cartao_credito">Cartão de crédito</option>
          </select>
        </label>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ganhos"
          value={formatCurrencyFromCents(dashboardData.summary.ganhosCentavos)}
          tone="positive"
          icon={<ArrowUpCircle size={18} />}
        />
        <StatCard
          title="Gastos"
          value={formatCurrencyFromCents(dashboardData.summary.gastosCentavos)}
          tone="negative"
          icon={<ArrowDownCircle size={18} />}
        />
        <StatCard
          title="Saldo"
          value={formatCurrencyFromCents(dashboardData.summary.saldoCentavos)}
          tone={dashboardData.summary.saldoCentavos >= 0 ? 'positive' : 'negative'}
          icon={<Scale size={18} />}
        />
        <StatCard
          title="Comparativo de gastos"
          value={`${dashboardData.summary.comparativoGastosPercentual.toFixed(1)}%`}
          subtitle="vs mês anterior"
          tone={dashboardData.summary.comparativoGastosPercentual <= 0 ? 'positive' : 'negative'}
          icon={<TrendingUp size={18} />}
        />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold">Top 5 categorias de gasto</h2>
          <CategoryPieChart data={dashboardData.summary.topCategorias} />
          <ul className="mt-4 space-y-2">
            {dashboardData.summary.topCategorias.map((item) => (
              <li key={item.categoria} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.categoria}</span>
                <span className="font-semibold text-slate-800">{formatCurrencyFromCents(item.valorCentavos)}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold">Saldo diário do mês</h2>
          <DailyBalanceLineChart data={dashboardData.dailyBalance} />
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
            <div>
              <p className="text-slate-500">Fixo</p>
              <p className="font-semibold text-slate-800">{dashboardData.summary.fixoPercentual.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-slate-500">Variável</p>
              <p className="font-semibold text-slate-800">{dashboardData.summary.variavelPercentual.toFixed(1)}%</p>
            </div>
          </div>
        </article>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold">Orçamento por categoria</h2>
          {dashboardData.budgetStatus.length === 0 ? (
            <EmptyState title="Sem metas no mês" message="Cadastre metas no painel de lançamentos para acompanhar o consumo." />
          ) : (
            <ul className="space-y-3">
              {dashboardData.budgetStatus.map((item) => (
                <li key={item.categoriaId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{item.categoriaNome}</span>
                    <span>
                      {formatCurrencyFromCents(item.realizadoCentavos)} / {formatCurrencyFromCents(item.limiteCentavos)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${item.percentualConsumido > 100 ? 'bg-rose-500' : 'bg-primary-500'}`}
                      style={{ width: `${Math.min(item.percentualConsumido, 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold">Insights rápidos</h2>
          <ul className="space-y-3">
            {dashboardData.quickInsights.map((insight, index) => (
              <li key={`${insight.title}-${index}`} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-800">{insight.title}</p>
                <p className="text-sm text-slate-600">{insight.description}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};
