import type { Role, TabId } from '../types';

export const roleLabels: Record<Role, string> = {
  admin: 'Scheduler / Admin',
  coordinator: 'Department Coordinator',
  lecturer: 'Lecturer / TA',
  student: 'Student',
  facilities: 'Facilities / Lab Manager',
};

export const roleTabs: Record<Role, TabId[]> = {
  admin: [
    'dashboard',
    'courses',
    'sections',
    'student-groups',
    'staff',
    'rooms',
    'equipment',
    'ai-recommendations',
    'support',
  ],

  coordinator: [
    'dashboard',
    'courses',
    'sections',
    'student-groups',
    'rooms',
    'ai-recommendations',
    'support',
  ],

  lecturer: [
    'my-timetable',
    'my-sections',
    'support',
  ],

  student: [
    'my-timetable',
    'my-sections',
    'support',
  ],

  facilities: [
    'dashboard',
    'rooms',
    'equipment',
    'support',
  ],
};

export const canAccess = (
  role: Role,
  tab: TabId
) => roleTabs[role].includes(tab);

export const defaultTab = (
  role: Role
): TabId => roleTabs[role][0];
