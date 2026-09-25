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

interface StudentTimetableItem {
  allocation_id: number;
  section_id: number;
  section_name: string;

  course_id: number;
  course_code: string;
  course_name: string;

  lecturer_id: number;
  lecturer_name: string;

  room_id: number;
  room_name: string;

  timeslot_id: number;
  day: string;
  start_time: string;
  end_time: string;
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
        setRows([]);

        /*
         * STUDENT
         *
         * Use the dedicated backend timetable endpoint.
         */
        if (studentGroupId !== undefined) {
          const response = await api.studentTimetable(
            studentGroupId
          );

          const timetable: StudentTimetableItem[] =
            response.data;

          setRows(
            timetable.map((item) => ({
              sectionId: item.section_id,

              section: item.section_name,

              course: item.course_name,

              lecturer: item.lecturer_name,

              // The backend endpoint is currently
              // returning the student's timetable,
              // so the group is represented by the
              // student group ID.
              group: `Group ${studentGroupId}`,

              students: 0,

              day: item.day,

              start: item.start_time
                ? item.start_time.slice(0, 5)
                : null,

              end: item.end_time
                ? item.end_time.slice(0, 5)
                : null,

              room: item.room_name,
            }))
          );

          return;
        }

        /*
         * LECTURER
         *
         * Keep the existing logic for lecturers.
         */
        if (lecturerId !== undefined) {
          const [sectionsRes, allocationsRes] =
            await Promise.all([
              api.sections(),
              api.allocations(),
            ]);

          const sections: SectionData[] =
            sectionsRes.data;

          const allocations: BackendAllocation[] =
            allocationsRes.data;

          const mine = sections.filter(
            (s) =>
              s.lecturer_id === lecturerId
          );

          setRows(
            mine.map((s) => {
              const alloc = allocations
                .filter(
                  (a) =>
                    a.section_id === s.id &&
                    a.status === 'Approved'
                )
                .sort(
                  (a, b) => b.id - a.id
                )[0];

              return {
                sectionId: s.id,

                section: s.name,

                course: s.course_name,

                lecturer: s.lecturer_name,

                group: s.student_group_name,

                students: s.students,

                day: alloc
                  ? alloc.day
                  : null,

                start: alloc
                  ? alloc.start_time.slice(0, 5)
                  : null,

                end: alloc
                  ? alloc.end_time.slice(0, 5)
                  : null,

                room: alloc
                  ? alloc.room_name
                  : null,
              };
            })
          );

          return;
        }

        setRows([]);

      } catch (err) {
        console.error(
          'Failed to load timetable:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load timetable'
        );

      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentGroupId, lecturerId]);

  return {
    rows,
    loading,
    error,
  };
}