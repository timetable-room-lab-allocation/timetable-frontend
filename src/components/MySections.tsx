import { useScheduleRows } from '../utils/useScheduleRows';
import type { ScheduleFilter } from '../utils/useScheduleRows';

export default function MySections({ filter }: { filter: ScheduleFilter }) {
  const { rows, loading, error } = useScheduleRows(filter);
  const isLecturer = filter.lecturerId !== undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Sections</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isLecturer
            ? 'The sections you teach.'
            : 'The sections you are enrolled in.'}
        </p>
      </div>

      {loading && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          Loading sections...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          Failed to load sections: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold">Section</th>
                <th className="p-4 font-semibold">Course</th>
                <th className="p-4 font-semibold">{isLecturer ? 'Group' : 'Instructor'}</th>
                {isLecturer && <th className="p-4 font-semibold">Students</th>}
                <th className="p-4 font-semibold">Schedule / Room</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={isLecturer ? 6 : 5} className="p-6 text-center text-slate-500">
                    No sections found.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.sectionId} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-900">{r.section}</td>
                  <td className="p-4">{r.course}</td>
                  <td className="p-4">{isLecturer ? r.group : r.lecturer}</td>
                  {isLecturer && <td className="p-4">{r.students}</td>}
                  <td className="p-4">
                    {r.day ? (
                      <>
                        <div className="text-xs font-medium text-slate-900">
                          {r.day} {r.start}–{r.end}
                        </div>
                        <div className="text-xs text-slate-400">{r.room}</div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Not published yet</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
                        r.day
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {r.day ? 'Scheduled' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}