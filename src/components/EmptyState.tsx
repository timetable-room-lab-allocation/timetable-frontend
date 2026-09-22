interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
      <h2 className="text-2xl font-bold text-slate-800 capitalize">{title}</h2>
      <p className="text-slate-500 text-sm mt-2">{description}</p>
    </div>
  );
}