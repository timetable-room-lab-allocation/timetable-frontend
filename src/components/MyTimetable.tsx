import { Download } from 'lucide-react';
import { useScheduleRows } from '../utils/useScheduleRows';
import type { ScheduleFilter } from '../utils/useScheduleRows';

const DAY_ORDER = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function MyTimetable({ filter }: { filter: ScheduleFilter }) {
  const { rows, loading, error } = useScheduleRows(filter);
  const isLecturer = filter.lecturerId !== undefined;

  const scheduled = rows.filter((r) => r.day !== null);
  const days = DAY_ORDER.filter((d) => scheduled.some((r) => r.day === d));

  const handleExport = () => {
    const header = ['Day', 'Start', 'End', 'Section', 'Course', 'Instructor', 'Group', 'Room'];
    const lines = scheduled.map((r) =>
      [r.day, r.start, r.end, r.section, r.course, r.lecturer, r.group, r.room]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-timetable.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Timetable</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLecturer
              ? 'Your published teaching schedule.'
              : 'Your published weekly schedule.'}
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={scheduled.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-md transition"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {loading && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          Loading timetable...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          Failed to load timetable: {error}
        </div>
      )}

      {!loading && !error && scheduled.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          No published classes yet. Check back once the timetable is approved.
        </div>
      )}

      {!loading && !error && scheduled.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {days.map((day) => (
            <div
              key={day}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                {day}
              </div>
              <div className="divide-y divide-slate-100">
                {scheduled
                  .filter((r) => r.day === day)
                  .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''))
                  .map((r) => (
                    <div key={r.sectionId} className="p-4">
                      <div className="text-xs font-semibold text-blue-600">
                        {r.start}–{r.end}
                      </div>
                      <div className="font-bold text-slate-900 mt-1">{r.course}</div>
                      <div className="text-sm text-slate-500">{r.section}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {isLecturer ? r.group : r.lecturer} · {r.room}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}