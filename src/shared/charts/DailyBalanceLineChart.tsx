import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrencyFromCents } from '@/shared/utils/currency';

interface DailyBalanceLineChartProps {
  data: Array<{ data: string; saldoCentavos: number }>;
}

export const DailyBalanceLineChart = ({ data }: DailyBalanceLineChartProps) => {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Sem dados para o gráfico de saldo diário.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="data" minTickGap={20} tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(value) => `R$${(Number(value) / 100).toFixed(0)}`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => formatCurrencyFromCents(Number(value))} />
          <Line type="monotone" dataKey="saldoCentavos" stroke="#2c9a5b" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
