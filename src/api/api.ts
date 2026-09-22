const API_BASE_URL = '/api';

async function request<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || 'Something went wrong'
    );
  }

  return data;
}

export const api = {
  health: () =>
    request<{ status: string; service: string }>('/health'),

  login: (data: {
    email: string;
    password: string;
  }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Courses
  courses: () =>
    request('/courses'),

  createCourse: (data: {
    code: string;
    name: string;
  }) =>
    request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCourse: (
    id: number,
    data: {
      code: string;
      name: string;
    }
  ) =>
    request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCourse: (id: number) =>
    request(`/courses/${id}`, {
      method: 'DELETE',
    }),

  // Student Timetable
  studentTimetable: (studentGroupId: number) =>
    request(`/student-timetable/${studentGroupId}`),

  // Student Groups
  studentGroups: () =>
    request('/student-groups'),

  studentGroupById: (id: number) =>
    request(`/student-groups/${id}`),

  createStudentGroup: (data: {
    name: string;
    student_count: number;
  }) =>
    request('/student-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStudentGroup: (
    id: number,
    data: {
      name: string;
      student_count: number;
    }
  ) =>
    request(`/student-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStudentGroup: (id: number) =>
    request(`/student-groups/${id}`, {
      method: 'DELETE',
    }),

  // Sections
  sections: () =>
    request('/sections'),

  sectionById: (id: number) =>
    request(`/sections/${id}`),

  createSection: (data: {
    course_id: number;
    student_group_id: number;
    lecturer_id?: number | null;
    name: string;
    students: number;
    duration: number;
    room_type_required: string;
  }) =>
    request('/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSection: (
    id: number,
    data: {
      course_id: number;
      student_group_id: number;
      lecturer_id?: number | null;
      name: string;
      students: number;
      duration: number;
      room_type_required: string;
    }
  ) =>
    request(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSection: (id: number) =>
    request(`/sections/${id}`, {
      method: 'DELETE',
    }),

  // Lecturer Availability
  lecturerAvailability: (lecturerId: number) =>
    request(`/lecturer-availability/${lecturerId}`),

  updateLecturerAvailability: (
    lecturerId: number,
    timeslot_ids: number[]
  ) =>
    request(`/lecturer-availability/${lecturerId}`, {
      method: 'PUT',
      body: JSON.stringify({ timeslot_ids }),
    }),

  // Rooms
  rooms: () =>
    request('/rooms'),

  roomById: (id: number) =>
    request(`/rooms/${id}`),

  createRoom: (data: {
    name: string;
    room_type: string;
    capacity: number;
  }) =>
    request('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRoom: (
    id: number,
    data: {
      name: string;
      room_type: string;
      capacity: number;
      is_available: number;
    }
  ) =>
    request(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRoom: (id: number) =>
    request(`/rooms/${id}`, {
      method: 'DELETE',
    }),

  // Lecturers
  lecturers: () =>
    request('/lecturers'),

  lecturerById: (id: number) =>
    request(`/lecturers/${id}`),

  createLecturer: (data: {
    user_id?: number | null;
    name: string;
  }) =>
    request('/lecturers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLecturer: (
    id: number,
    data: {
      user_id?: number | null;
      name: string;
    }
  ) =>
    request(`/lecturers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLecturer: (id: number) =>
    request(`/lecturers/${id}`, {
      method: 'DELETE',
    }),

  // Equipment
  equipment: () =>
    request('/equipment'),

  equipmentById: (id: number) =>
    request(`/equipment/${id}`),

  createEquipment: (data: {
    name: string;
  }) =>
    request('/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEquipment: (
    id: number,
    data: {
      name: string;
    }
  ) =>
    request(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEquipment: (id: number) =>
    request(`/equipment/${id}`, {
      method: 'DELETE',
    }),

  // Time Slots
  timeslots: () =>
    request('/timeslots'),

  // Allocations
  allocations: () =>
    request('/allocations'),

  // AI Recommendations
  recommendations: (section_id: number) =>
    request('/ai/recommendations', {
      method: 'POST',
      body: JSON.stringify({ section_id }),
    }),

  // Create Allocation
  createAllocation: (data: {
    section_id: number;
    lecturer_id: number;
    room_id: number;
    timeslot_id: number;
    score?: number;
    status?: 'Draft' | 'Approved' | 'Rejected';
  }) =>
    request('/allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
