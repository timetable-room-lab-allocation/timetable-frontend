import type { Section } from '../types';

export interface BackendSection {
  id: number;
  name: string;
  students: number;
  duration: number;
  course_name: string;
  lecturer_name: string;
}

export interface BackendAllocation {
  id: number;
  section_id: number;
  section_name: string;
  lecturer_id: number;
  lecturer_name: string;
  room_id: number;
  room_name: string;
  timeslot_id: number;
  day: string;
  start_time: string;
  end_time: string;
  status: 'Draft' | 'Approved' | 'Rejected';
}

const hhmm = (t: string) => t.slice(0, 5);

// لكل سكشن: نفضّل الـAllocation المعتمدة، وإلا آخر واحدة (غير المرفوضة)
function pickAllocation(
  sectionId: number,
  allocations: BackendAllocation[]
): BackendAllocation | undefined {
  const mine = allocations.filter(
    (a) => a.section_id === sectionId && a.status !== 'Rejected'
  );
  return (
    mine.find((a) => a.status === 'Approved') ??
    mine.sort((a, b) => b.id - a.id)[0]
  );
}

export function mapSections(
  sections: BackendSection[],
  allocations: BackendAllocation[]
): Section[] {
  return sections.map((s) => {
    const alloc = pickAllocation(s.id, allocations);

    return {
       id: s.id,
      code: s.name,
      course: s.course_name,
      instructor: s.lecturer_name,
      enrolled: String(s.students),
      schedule: alloc
        ? `${alloc.day} ${hhmm(alloc.start_time)}–${hhmm(alloc.end_time)}`
        : `Schedule pending · ${s.duration} hrs`,
      room: alloc ? alloc.room_name : 'Unassigned',
      status: alloc && alloc.status === 'Approved' ? 'Open' : 'Draft',
    };
  });
}

export function scheduledCount(
  sections: BackendSection[],
  allocations: BackendAllocation[]
): number {
  return sections.filter((s) => pickAllocation(s.id, allocations)).length;
}

// تعارضات: نفس القاعة أو نفس المحاضر في نفس الفترة لأكتر من سكشن
export function findConflicts(allocations: BackendAllocation[]): string[] {
  const active = allocations.filter((a) => a.status !== 'Rejected');
  const messages: string[] = [];

  const byKey = (keyOf: (a: BackendAllocation) => string, label: (a: BackendAllocation) => string) => {
    const groups = new Map<string, BackendAllocation[]>();
    active.forEach((a) => {
      const key = keyOf(a);
      groups.set(key, [...(groups.get(key) ?? []), a]);
    });
    groups.forEach((items) => {
      if (items.length > 1) {
        const first = items[0];
        messages.push(
          `${label(first)} double-booked on ${first.day} ${hhmm(first.start_time)}–${hhmm(first.end_time)}: ${items
            .map((i) => i.section_name)
            .join(', ')}`
        );
      }
    });
  };

  byKey(
    (a) => `room-${a.room_id}-${a.timeslot_id}`,
    (a) => a.room_name
  );
  byKey(
    (a) => `lecturer-${a.lecturer_id}-${a.timeslot_id}`,
    (a) => a.lecturer_name
  );

  return messages;
}