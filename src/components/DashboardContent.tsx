import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import StatCardComponent from './StatCard';
import SectionsTable from './SectionsTable';
import { api } from '../api/api';
import type { Section, StatCard } from '../types';
import {
  findConflicts,
  mapSections,
  scheduledCount,
} from '../utils/mapSections';

interface BackendRoom {
  id: number;
  is_available: number;
}

export default function DashboardContent() {
  const [cards, setCards] = useState<StatCard[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const [
          coursesRes,
          sectionsRes,
          roomsRes,
          lecturersRes,
          equipmentRes,
          allocationsRes,
        ] = await Promise.all([
          api.courses(),
          api.sections(),
          api.rooms(),
          api.lecturers(),
          api.equipment(),
          api.allocations(),
        ]);

        const backendSections = sectionsRes.data;
        const allocations = allocationsRes.data;
        const rooms: BackendRoom[] = roomsRes.data;

        const availableRooms = rooms.filter((r) => r.is_available === 1).length;
        const scheduled = scheduledCount(backendSections, allocations);
        const pending = backendSections.length - scheduled;
        const foundConflicts = findConflicts(allocations);

        setCards([
          {
            title: 'Courses',
            value: String(coursesRes.data.length),
            change: 'Active',
            changeType: 'positive',
            subtitle: 'Courses in the system',
          },
          {
            title: 'Sections',
            value: String(backendSections.length),
            change: pending > 0 ? `${pending} pending` : 'All scheduled',
            changeType: pending > 0 ? 'warning' : 'positive',
            subtitle: `${scheduled} scheduled`,
          },
          {
            title: 'Rooms',
            value: String(rooms.length),
            change: `${availableRooms} available`,
            changeType: 'positive',
            subtitle: `${equipmentRes.data.length} equipment types`,
          },
          {
            title: 'Staff',
            value: String(lecturersRes.data.length),
            change: 'Lecturers',
            changeType: 'info',
            subtitle: 'Teaching staff',
          },
        ]);

        setSections(mapSections(backendSections, allocations));
        setConflicts(foundConflicts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scheduler Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitor upcoming scheduling activity, room conflicts, and staff availability across the next 7 days.
        </p>
      </div>

      {loading && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          Loading dashboard...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          Failed to load dashboard: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
              <StatCardComponent key={idx} data={card} />
            ))}
          </div>

          {conflicts.length > 0 ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <AlertTriangle size={16} />
                {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''}
              </div>
              <ul className="text-sm list-disc list-inside space-y-1">
                {conflicts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-2 text-sm font-medium">
              <CheckCircle size={16} />
              No scheduling conflicts detected.
            </div>
          )}

          <SectionsTable sections={sections} />
        </>
      )}
    </div>
  );
}