import { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import { api } from '../api/api';

interface StudentGroup {
  id: number;
  name: string;
  student_count: number;
}

interface StudentGroupsResponse {
  success: boolean;
  message: string;
  data: StudentGroup[];
}

interface FormData {
  name: string;
  student_count: string;
}

const initialForm: FormData = {
  name: '',
  student_count: '',
};

export default function StudentGroupsContent() {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] =
    useState<FormData>(initialForm);

  const [saving, setSaving] = useState(false);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        (await api.studentGroups()) as StudentGroupsResponse;

      if (!response.success) {
        throw new Error(
          response.message ||
            'Failed to fetch student groups'
        );
      }

      setGroups(response.data || []);

    } catch (err) {
      console.error(
        'Failed to load student groups:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load student groups'
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
    setError('');
  };

  const openEditForm = (group: StudentGroup) => {
    setEditingId(group.id);

    setForm({
      name: group.name,
      student_count: String(
        group.student_count
      ),
    });

    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const name = form.name.trim();
    const studentCount = Number(
      form.student_count
    );

    if (!name) {
      setError('Group name is required.');
      return;
    }

    if (
      !Number.isInteger(studentCount) ||
      studentCount <= 0
    ) {
      setError(
        'Student count must be a positive number.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingId !== null) {
        await api.updateStudentGroup(
          editingId,
          {
            name,
            student_count: studentCount,
          }
        );
      } else {
        await api.createStudentGroup({
          name,
          student_count: studentCount,
        });
      }

      await loadGroups();

      closeForm();

    } catch (err) {
      console.error(
        'Failed to save student group:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save student group'
      );

    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    group: StudentGroup
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${group.name}"?`
    );

    if (!confirmed) return;

    try {
      setError('');

      await api.deleteStudentGroup(group.id);

      setGroups((current) =>
        current.filter(
          (item) => item.id !== group.id
        )
      );

    } catch (err) {
      console.error(
        'Failed to delete student group:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete student group'
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Student Groups
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Manage student groups and their capacity.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium shadow-md transition"
        >
          <Plus size={18} />
          Add Group
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingId !== null
                  ? 'Edit Student Group'
                  : 'Add Student Group'}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Enter the group name and number of students.
              </p>
            </div>

            <button
              onClick={closeForm}
              disabled={saving}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Group Name
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
                placeholder="e.g. AI Group 3"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Student Count
              </label>

              <input
                type="number"
                min="1"
                value={form.student_count}
                onChange={(e) =>
                  setForm({
                    ...form,
                    student_count:
                      e.target.value,
                  })
                }
                placeholder="30"
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Update Group'
                    : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
          Loading student groups...
        </div>
      )}

      {/* Empty */}
      {!loading && groups.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Users
            size={40}
            className="mx-auto text-slate-300 mb-3"
          />

          <h3 className="font-semibold text-slate-800">
            No student groups yet
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Create your first student group.
          </p>
        </div>
      )}

      {/* Groups */}
      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-start justify-between">

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={21} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {group.name}
                    </h3>

                    <p className="text-xs text-slate-400">
                      Group ID: {group.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      openEditForm(group)
                    }
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(group)
                    }
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Students
                  </span>

                  <span className="font-bold text-slate-900">
                    {group.student_count}
                  </span>
                </div>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}