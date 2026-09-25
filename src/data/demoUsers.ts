import type { Role } from '../types';

export interface DemoUser {
  id?: number;
  name?: string;
  email: string;
  password: string;
  role: Role;
  studentGroupId?: number;
  lecturerId?: number;
}

export const demoUsers: DemoUser[] = [
  {
    email: 'admin@smart.edu',
    password: 'admin123',
    role: 'admin',
  },
  {
    email: 'coordinator@smart.edu',
    password: 'coord123',
    role: 'coordinator',
  },
  {
    email: 'lecturer@smart.edu',
    password: 'lect123',
    role: 'lecturer',
    lecturerId: 1,
  },
  {
    email: 'student@smart.edu',
    password: 'stud123',
    role: 'student',
    studentGroupId: 1,
  },
  {
    email: 'facilities@smart.edu',
    password: 'fac123',
    role: 'facilities',
  },
];