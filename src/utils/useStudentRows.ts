import { useEffect, useState } from 'react';
import { api } from '../api/api';
import type { BackendAllocation } from './mapSections';

export interface ScheduleFilter {
  studentGroupId?: number;
  lecturerId?: number;
}

interface SectionData {
  id: number;
  name: string;
  students: number;
  course_name: string;
  lecturer_id: number;
  lecturer_name: string;
  student_group_id: number;
  student_group_name: string;
}

export interface ScheduleRow {
  sectionId: number;
  section: string;
  course: string;
  lecturer: string;
  group: string;
  students: number;
  day: string | null;
  start: string | null;
  end: string | null;
  room: string | null;
}

export function useScheduleRows(filter: ScheduleFilter) {
  const { studentGroupId, lecturerId } = filter;

  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [sectionsRes, allocationsRes] = await Promise.all([
          api.sections(),
          api.allocations(),
        ]);

        const sections: SectionData[] = sectionsRes.data;
        const allocations: BackendAllocation[] = allocationsRes.data;

        const mine = sections.filter((s) => {
          if (studentGroupId !== undefined) return s.student_group_id === studentGroupId;
          if (lecturerId !== undefined) return s.lecturer_id === lecturerId;
          return false;
        });

        setRows(
          mine.map((s) => {
            const alloc = allocations
              .filter((a) => a.section_id === s.id && a.status === 'Approved')
              .sort((a, b) => b.id - a.id)[0];

            return {
              sectionId: s.id,
              section: s.name,
              course: s.course_name,
              lecturer: s.lecturer_name,
              group: s.student_group_name,
              students: s.students,
              day: alloc ? alloc.day : null,
              start: alloc ? alloc.start_time.slice(0, 5) : null,
              end: alloc ? alloc.end_time.slice(0, 5) : null,
              room: alloc ? alloc.room_name : null,
            };
          })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentGroupId, lecturerId]);

  return { rows, loading, error };
}