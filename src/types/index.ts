import type { LucideIcon } from 'lucide-react';

export interface Course {
  id: number;
  code: string;
  name: string;
  dept: string;
  sections: number;
  status: 'Active' | 'Draft';
}

export interface Section {
  id: number;
  code: string;
  course: string;
  instructor: string;
  enrolled: string;
  schedule: string;
  room: string;
  status: 'Open' | 'Full' | 'Draft';
}

export interface Staff {
  name: string;
  role: string;
  dept: string;
  email: string;
  assigned: string;
  status:
    | 'Available'
    | 'In class'
    | 'Office hours'
    | 'Unavailable';
}

export interface StudentGroup {
  id: number;
  name: string;
  student_count: number;
}

export interface StatCard {
  title: string;
  value: string | number;
  change: string;
  changeType:
    | 'positive'
    | 'negative'
    | 'warning'
    | 'info';
  subtitle: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export type Role =
  | 'admin'
  | 'coordinator'
  | 'lecturer'
  | 'student'
  | 'facilities';

export type TabId =
  | 'my-timetable'
  | 'my-sections'
  | 'dashboard'
  | 'courses'
  | 'sections'
  | 'student-groups'
  | 'staff'
  | 'rooms'
  | 'equipment'
  | 'support'
  | 'ai-recommendations';
