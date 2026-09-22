import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import CoursesTable from './CoursesTable';
import { api } from '../api/api';
import type { Course } from '../types';

interface BackendCourse {
  id: number;
  code: string;
  name: string;
}

interface BackendSection {
  id: number;
  course_id: number;
}

interface CourseForm {
  code: string;
  name: string;
}

export default function CoursesContent() {
  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);

  const [editingCourse, setEditingCourse] =
    useState<BackendCourse | null>(null);

  const [form, setForm] = useState<CourseForm>({
    code: '',
    name: '',
  });

  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError('');

      const [coursesRes, sectionsRes] = await Promise.all([
        api.courses(),
        api.sections(),
      ]);

      const fetchedCourses: BackendCourse[] = coursesRes.data;

      const backendSections: BackendSection[] = sectionsRes.data;

      const sectionCount = new Map<number, number>();

      backendSections.forEach((section) => {
        sectionCount.set(
          section.course_id,
          (sectionCount.get(section.course_id) ?? 0) + 1
        );
      });

      const mappedCourses: Course[] = fetchedCourses.map((course) => ({
        id: course.id,
        code: course.code || '—',
        name: course.name,
        dept: '—',
        sections: sectionCount.get(course.id) ?? 0,
        status: 'Active',
      }));

      setCourses(mappedCourses);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load courses'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const openAddModal = () => {
    setEditingCourse(null);

    setForm({
      code: '',
      name: '',
    });

    setShowModal(true);
  };

  const openEditModal = (course: {
    id: number;
    code: string;
    name: string;
  }) => {
    setEditingCourse(course);

    setForm({
      code: course.code,
      name: course.name,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCourse(null);

    setForm({
      code: '',
      name: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code.trim() || !form.name.trim()) {
      setError('Course code and name are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const courseData = {
        code: form.code.trim(),
        name: form.name.trim(),
      };

      if (editingCourse) {
        await api.updateCourse(
          editingCourse.id,
          courseData
        );
      } else {
        await api.createCourse(courseData);
      }

      setShowModal(false);
      setEditingCourse(null);

      setForm({
        code: '',
        name: '',
      });

      await loadCourses();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save course'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this course?'
    );

    if (!confirmed) return;

    try {
      setError('');

      await api.deleteCourse(id);

      await loadCourses();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete course'
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Courses
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Manage course details and their scheduled sections.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-md transition"
        >
          <Plus size={16} />
          Add course
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
          Loading courses...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <CoursesTable
          courses={courses}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingCourse
                    ? 'Edit Course'
                    : 'Add Course'}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {editingCourse
                    ? 'Update course information.'
                    : 'Create a new course.'}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="p-2 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >

              {/* Course Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Course Code
                </label>

                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value,
                    })
                  }
                  placeholder="AI101"
                  disabled={saving}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Course Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Artificial Intelligence"
                  disabled={saving}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingCourse
                    ? 'Update Course'
                    : 'Create Course'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
