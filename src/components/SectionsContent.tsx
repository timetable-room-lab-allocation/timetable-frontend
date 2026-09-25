import { Plus, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import SectionsTable from './SectionsTable';
import { api } from '../api/api';
import type { Section } from '../types';

interface BackendSection {
  id: number;
  course_id: number;
  student_group_id: number;
  lecturer_id: number | null;
  name: string;
  students: number;
  duration: number;
  room_type_required: string;
}

interface BackendCourse {
  id: number;
  code: string;
  name: string;
}

interface BackendStudentGroup {
  id: number;
  name: string;
  student_count: number;
}

interface BackendLecturer {
  id: number;
  name: string;
  user_id: number | null;
}

interface SectionForm {
  course_id: string;
  student_group_id: string;
  lecturer_id: string;
  name: string;
  students: string;
  duration: string;
  room_type_required: string;
}

const emptyForm: SectionForm = {
  course_id: '',
  student_group_id: '',
  lecturer_id: '',
  name: '',
  students: '',
  duration: '60',
  room_type_required: 'Classroom',
};

export default function SectionsContent() {
  const [sections, setSections] = useState<Section[]>([]);
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [studentGroups, setStudentGroups] = useState<BackendStudentGroup[]>([]);
  const [lecturers, setLecturers] = useState<BackendLecturer[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<SectionForm>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        sectionsResponse,
        coursesResponse,
        groupsResponse,
        lecturersResponse,
      ] = await Promise.all([
        api.sections(),
        api.courses(),
        api.studentGroups(),
        api.lecturers(),
      ]);

      const backendSections: BackendSection[] =
        sectionsResponse.data;

      const backendCourses: BackendCourse[] =
        coursesResponse.data;

      const backendGroups: BackendStudentGroup[] =
        groupsResponse.data;

      const backendLecturers: BackendLecturer[] =
        lecturersResponse.data;

      setCourses(backendCourses);
      setStudentGroups(backendGroups);
      setLecturers(backendLecturers);

      const mappedSections: Section[] =
        backendSections.map((section) => {
          const course = backendCourses.find(
            (item) => item.id === section.course_id
          );

          const lecturer = backendLecturers.find(
            (item) => item.id === section.lecturer_id
          );

          const group = backendGroups.find(
            (item) => item.id === section.student_group_id
          );

          const enrolled = section.students;

          const capacity =
            group?.student_count ?? section.students;

          let status: Section['status'] = 'Open';

          if (section.name.toLowerCase().includes('draft')) {
            status = 'Draft';
          } else if (capacity > 0 && enrolled >= capacity) {
            status = 'Full';
          }

          return {
            id: section.id,
            code: section.name,
            course: course
              ? `${course.code} - ${course.name}`
              : 'Unknown course',
            instructor: lecturer?.name ?? 'Unassigned',
            enrolled: `${enrolled} / ${capacity}`,
            schedule: `${section.duration} min`,
            room: section.room_type_required,
            status,
          };
        });

      setSections(mappedSections);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load sections'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = async (section: Section) => {
    try {
      setError('');

      const response = await api.sectionById(section.id);

      const backendSection: BackendSection =
        response.data;

      setEditingId(backendSection.id);

      setForm({
        course_id: String(backendSection.course_id),
        student_group_id: String(
          backendSection.student_group_id
        ),
        lecturer_id:
          backendSection.lecturer_id !== null
            ? String(backendSection.lecturer_id)
            : '',
        name: backendSection.name,
        students: String(backendSection.students),
        duration: String(backendSection.duration),
        room_type_required:
          backendSection.room_type_required,
      });

      setIsModalOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load section'
      );
    }
  };

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    if (!form.course_id) {
      setError('Please select a course.');
      return;
    }

    if (!form.student_group_id) {
      setError('Please select a student group.');
      return;
    }

    if (!form.name.trim()) {
      setError('Section name is required.');
      return;
    }

    if (!form.students || Number(form.students) < 0) {
      setError('Students must be a valid number.');
      return;
    }

    if (!form.duration || Number(form.duration) <= 0) {
      setError('Duration must be greater than 0.');
      return;
    }

    if (!form.room_type_required.trim()) {
      setError('Room type is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        course_id: Number(form.course_id),
        student_group_id: Number(form.student_group_id),
        lecturer_id: form.lecturer_id
          ? Number(form.lecturer_id)
          : null,
        name: form.name.trim(),
        students: Number(form.students),
        duration: Number(form.duration),
        room_type_required:
          form.room_type_required.trim(),
      };

      if (editingId !== null) {
        await api.updateSection(
          editingId,
          payload
        );
      } else {
        await api.createSection(payload);
      }

      closeModal();

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save section'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this section?'
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');

      await api.deleteSection(id);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete section'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sections
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Manage course sections and their assignments.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-md transition"
        >
          <Plus size={16} />
          Add section
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          Loading sections...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <SectionsTable
          sections={sections}
          onEdit={openEditModal}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId !== null
                    ? 'Edit Section'
                    : 'Add Section'}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Enter section information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >
              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Course *
                </label>

                <select
                  name="course_id"
                  value={form.course_id}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    Select course
                  </option>

                  {courses.map((course) => (
                    <option
                      key={course.id}
                      value={course.id}
                    >
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Group */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Student Group *
                </label>

                <select
                  name="student_group_id"
                  value={form.student_group_id}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    Select student group
                  </option>

                  {studentGroups.map((group) => (
                    <option
                      key={group.id}
                      value={group.id}
                    >
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lecturer */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lecturer
                </label>

                <select
                  name="lecturer_id"
                  value={form.lecturer_id}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    Unassigned
                  </option>

                  {lecturers.map((lecturer) => (
                    <option
                      key={lecturer.id}
                      value={lecturer.id}
                    >
                      {lecturer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Section Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="CS101 - Section 01"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Students + Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Students *
                  </label>

                  <input
                    type="number"
                    name="students"
                    value={form.students}
                    onChange={handleChange}
                    min="0"
                    placeholder="30"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Duration (minutes) *
                  </label>

                  <input
                    type="number"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    min="1"
                    placeholder="60"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Room Type *
                </label>

                <select
                  name="room_type_required"
                  value={form.room_type_required}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Classroom">
                    Classroom
                  </option>

                  <option value="Lab">
                    Lab
                  </option>

                  <option value="Computer Lab">
                    Computer Lab
                  </option>

                  <option value="Lecture Hall">
                    Lecture Hall
                  </option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium"
                >
                  {saving
                    ? 'Saving...'
                    : editingId !== null
                    ? 'Update Section'
                    : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
