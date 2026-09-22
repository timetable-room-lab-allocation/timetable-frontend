import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { api } from '../api/api';

interface BackendSection {
  id: number;
  name: string;
  course_name: string;
  lecturer_id: number;
  lecturer_name: string;
}

interface Timeslot {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
}

interface Recommendation {
  room_id: number;
  room: string;
  day: string;
  start: string;
  end: string;
  score: number;
  reasons: string[];
}

const hhmm = (t: string) => t.slice(0, 5);

const scoreStyle = (score: number) =>
  score >= 80
    ? 'bg-emerald-100 text-emerald-800'
    : score >= 60
    ? 'bg-amber-100 text-amber-800'
    : 'bg-red-100 text-red-800';

export default function AIRecommendations({
  canApprove = false,
}: {
  canApprove?: boolean;
}) {
  const [sections, setSections] = useState<BackendSection[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoadingInit(true);
        setError('');

        const [sectionsRes, timeslotsRes] = await Promise.all([
          api.sections() as Promise<{ data: BackendSection[] }>,
          api.timeslots() as Promise<{ data: Timeslot[] }>,
        ]);

        setSections(sectionsRes.data);
        setTimeslots(timeslotsRes.data);

        if (sectionsRes.data.length > 0) {
          setSelectedId(sectionsRes.data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoadingInit(false);
      }
    };

    loadInitial();
  }, []);

  const handleGenerate = async () => {
    if (selectedId === '') return;

    try {
      setLoadingRecs(true);
      setError('');
      setMessage('');
      setRecs([]);

      const res = (await api.recommendations(selectedId)) as {
        success: boolean;
        message?: string;
        recommendations?: Recommendation[];
      };

      setRecs(res.recommendations ?? []);
      setHasGenerated(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to get recommendations'
      );
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleApprove = async (rec: Recommendation, index: number) => {
    const section = sections.find((s) => s.id === selectedId);
    if (!section) return;

    const slot = timeslots.find(
      (t) =>
        t.day === rec.day &&
        t.start_time === rec.start &&
        t.end_time === rec.end
    );

    if (!slot) {
      setError('No matching timeslot found for this recommendation.');
      return;
    }

    try {
      setSavingIndex(index);
      setError('');
      setMessage('');

      await api.createAllocation({
        section_id: section.id,
        lecturer_id: section.lecturer_id,
        room_id: rec.room_id,
        timeslot_id: slot.id,
        score: rec.score,
        status: 'Approved',
      });

      setMessage(
        `Approved: ${section.name} → ${rec.room}, ${rec.day} ${hhmm(rec.start)}–${hhmm(rec.end)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save allocation');
    } finally {
      setSavingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Recommendations</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pick a section and get the best room and time slot suggestions.
        </p>
      </div>

      {loadingInit && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          Loading...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl">
          {message}
        </div>
      )}

      {!loadingInit && sections.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Section
            </label>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(Number(e.target.value));
                setRecs([]);
                setHasGenerated(false);
                setMessage('');
              }}
              className="w-full px-3 py-2 text-sm bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.course_name} ({s.lecturer_name})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loadingRecs || selectedId === ''}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-md transition"
          >
            <Sparkles size={16} />
            {loadingRecs ? 'Thinking...' : 'Get recommendations'}
          </button>
        </div>
      )}

      {!loadingInit && sections.length === 0 && !error && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          No sections found.
        </div>
      )}

      {hasGenerated && recs.length === 0 && !loadingRecs && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          No recommendations available for this section.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recs.map((rec, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-lg font-bold text-slate-900">{rec.room}</div>
                <div className="text-sm text-slate-500">
                  {rec.day} · {hhmm(rec.start)}–{hhmm(rec.end)}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 text-xs rounded-full font-semibold ${scoreStyle(rec.score)}`}
              >
                Score {rec.score}
              </span>
            </div>

            <ul className="text-sm text-slate-600 space-y-1 mb-4 list-disc list-inside">
              {rec.reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>

            {canApprove && (
              <button
                onClick={() => handleApprove(rec, idx)}
                disabled={savingIndex === idx}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-medium transition"
              >
                <Check size={14} />
                {savingIndex === idx ? 'Saving...' : 'Approve'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 