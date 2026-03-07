import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrencyFromCents } from '@/shared/utils/currency';

interface CategoryPieChartProps {
  data: Array<{ categoria: string; valorCentavos: number; cor?: string }>;
}

const palette = ['#2c9a5b', '#f4a261', '#2a9d8f', '#e76f51', '#457b9d', '#8d99ae'];

export const CategoryPieChart = ({ data }: CategoryPieChartProps) => {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Sem gastos por categoria no período.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="valorCentavos" nameKey="categoria" cx="50%" cy="50%" outerRadius={90} label>
            {data.map((entry, index) => (
              <Cell key={`${entry.categoria}-${index}`} fill={entry.cor ?? palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrencyFromCents(Number(value))}
            contentStyle={{ borderRadius: '0.75rem', borderColor: '#dbe4dd' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
