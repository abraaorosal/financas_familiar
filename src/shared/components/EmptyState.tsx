interface EmptyStateProps {
  title: string;
  message: string;
}

export const EmptyState = ({ title, message }: EmptyStateProps) => (
  <div className="rounded-xl2 border border-dashed border-slate-300 bg-white/70 p-8 text-center">
    <h3 className="font-display text-lg font-semibold text-slate-800">{title}</h3>
    <p className="mt-2 text-sm text-slate-600">{message}</p>
  </div>
);
