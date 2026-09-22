import { AlertTriangle, X } from 'lucide-react';

interface ConflictAlertProps {
  onDismiss?: () => void;
}

export default function ConflictAlert({ onDismiss }: ConflictAlertProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="text-amber-600" size={24} />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">Room conflicts detected (3 open issues)</h4>
          <p className="text-xs text-amber-700">CS 101 · 01 overlaps with CS 101 · 03 in Tech 204</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition">
          Resolve Conflicts
        </button>
        {onDismiss && (
          <button onClick={onDismiss} className="text-amber-600 hover:text-amber-800 p-1">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}