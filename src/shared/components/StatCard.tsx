import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  tone?: 'neutral' | 'positive' | 'negative';
  icon?: ReactNode;
}

const tones: Record<NonNullable<StatCardProps['tone']>, string> = {
  neutral: 'border-slate-200',
  positive: 'border-emerald-200',
  negative: 'border-rose-200',
};

export const StatCard = ({ title, value, subtitle, tone = 'neutral', icon }: StatCardProps) => {
  return (
    <article className={`rounded-xl2 border bg-surface p-4 shadow-card ${tones[tone]}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {icon ? <span className="text-primary-600">{icon}</span> : null}
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </article>
  );
};
