import type { StatCard } from '../types';

interface StatCardProps {
  data: StatCard;
}

const colors = {
  positive: 'text-emerald-600 bg-emerald-50',
  negative: 'text-red-600 bg-red-50',
  warning: 'text-amber-600 bg-amber-50',
  info: 'text-blue-600 bg-blue-50',
};

export default function StatCardComponent({ data }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-slate-500">{data.title}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[data.changeType]}`}>
          {data.change}
        </span>
      </div>
      <div className="text-3xl font-bold text-slate-900">{data.value}</div>
      <p className="text-xs text-slate-400 mt-2">{data.subtitle}</p>
    </div>
  );
}