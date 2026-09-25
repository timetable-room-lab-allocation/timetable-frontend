import {
  CalendarClock,
  Plus,
  X,
} from 'lucide-react';

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import StaffTable from './StaffTable';
import type { StaffRow } from './StaffTable';

import { api } from '../api/api';

interface BackendLecturer {
  id: number;
  user_id: number | null;
  name: string;
}

interface BackendTimeslot {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
}

interface AvailabilityRow {
  lecturer_id: number;
  timeslot_id: number;
  day: string;
  start_time: string;
  end_time: string;
}

interface StaffForm {
  name: string;
  user_id: string;
}

const emptyForm: StaffForm = {
  name: '',
  user_id: '',
};

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const formatTime = (time: string) => {
  return time.slice(0, 5);
};

export default function StaffContent() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<StaffForm>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  // --------------------------------
  // Availability state
  // --------------------------------

  const [isAvailabilityOpen, setIsAvailabilityOpen] =
    useState(false);

  const [availabilityLecturer, setAvailabilityLecturer] =
    useState<StaffRow | null>(null);

  const [timeslots, setTimeslots] =
    useState<BackendTimeslot[]>([]);

  const [selectedTimeslots, setSelectedTimeslots] =
    useState<number[]>([]);

  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);

  const [availabilitySaving, setAvailabilitySaving] =
    useState(false);

  // --------------------------------
  // Load staff
  // --------------------------------

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.lecturers();

      const lecturers: BackendLecturer[] =
        response.data;

      const mapped: StaffRow[] =
        lecturers.map((lecturer) => ({
          id: lecturer.id,
          name: lecturer.name,
          hasAccount:
            lecturer.user_id !== null,
        }));

      setStaff(mapped);

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load staff'
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  // --------------------------------
  // Staff CRUD
  // --------------------------------

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = async (
    member: StaffRow
  ) => {
    try {
      setError('');

      const response =
        await api.lecturerById(member.id);

      const lecturer: BackendLecturer =
        response.data;

      setEditingId(lecturer.id);

      setForm({
        name: lecturer.name,
        user_id:
          lecturer.user_id !== null
            ? String(lecturer.user_id)
            : '',
      });

      setIsModalOpen(true);

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load lecturer'
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
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError(
        'Staff name is required.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        name: form.name.trim(),
        user_id: form.user_id
          ? Number(form.user_id)
          : null,
      };

      if (editingId !== null) {
        await api.updateLecturer(
          editingId,
          payload
        );
      } else {
        await api.createLecturer(
          payload
        );
      }

      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadStaff();

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save staff'
      );

    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this staff member?'
      );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');

      await api.deleteLecturer(id);

      await loadStaff();

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete staff'
      );

    } finally {
      setDeletingId(null);
    }
  };

  // --------------------------------
  // Availability
  // --------------------------------

  
  const openAvailability = async (
    member: StaffRow
  ) => {
    try {
      setAvailabilityLecturer(member);
      setAvailabilityLoading(true);
      setAvailabilitySaving(false);
      setError('');
      setSelectedTimeslots([]);

      setIsAvailabilityOpen(true);

      // Load timeslots and current availability
      const [
        timeslotResponse,
        availabilityResponse,
      ] = await Promise.all([
        api.timeslots(),
        api.lecturerAvailability(
          member.id
        ),
      ]);

      const fetchedTimeslots:
        BackendTimeslot[] =
        timeslotResponse.data;

      const availability:
        AvailabilityRow[] =
        availabilityResponse.availability;

      setTimeslots(
        fetchedTimeslots
      );

      setSelectedTimeslots(
        availability.map(
          (item) =>
            item.timeslot_id
        )
      );

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load lecturer availability'
      );

    } finally {
      setAvailabilityLoading(false);
    }
  };

  const closeAvailability = () => {
    if (availabilitySaving) return;

    setIsAvailabilityOpen(false);
    setAvailabilityLecturer(null);
    setSelectedTimeslots([]);
  };

  const toggleTimeslot = (
    timeslotId: number
  ) => {
    setSelectedTimeslots((current) => {
      if (
        current.includes(timeslotId)
      ) {
        return current.filter(
          (id) =>
            id !== timeslotId
        );
      }

      return [
        ...current,
        timeslotId,
      ];
    });
  };

  const saveAvailability = async () => {
    if (!availabilityLecturer) {
      return;
    }

    try {
      setAvailabilitySaving(true);
      setError('');

      await api.updateLecturerAvailability(
        availabilityLecturer.id,
        selectedTimeslots
      );

      closeAvailability();

    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save availability'
      );

    } finally {
      setAvailabilitySaving(false);
    }
  };

  // --------------------------------
  // Render
  // --------------------------------

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Staff
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Manage lecturers and teaching staff.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-md transition"
        >
          <Plus size={16} />
          Add staff
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
          Loading staff...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <StaffTable
          staff={staff}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onAvailability={
            openAvailability
          }
          deletingId={deletingId}
        />
      )}

      {/* -------------------------------- */}
      {/* Staff Modal */}
      {/* -------------------------------- */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl">

            <div className="flex items-center justify-between p-6 border-b border-slate-100">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId !== null
                    ? 'Edit Staff'
                    : 'Add Staff'}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Manage lecturer information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Dr. Ahmed Mohamed"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  User ID
                </label>

                <input
                  type="number"
                  name="user_id"
                  value={form.user_id}
                  onChange={handleChange}
                  min="1"
                  placeholder="Optional"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-xs text-slate-400 mt-1">
                  Leave empty if this lecturer has no linked account.
                </p>
              </div>

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
                    ? 'Update Staff'
                    : 'Create Staff'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* -------------------------------- */}
      {/* Availability Modal */}
      {/* -------------------------------- */}

      {isAvailabilityOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarClock size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Manage Availability
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    {availabilityLecturer?.name}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeAvailability}
                disabled={
                  availabilitySaving
                }
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={20} />
              </button>

            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">

              {availabilityLoading ? (
                <div className="py-10 text-center text-slate-500">
                  Loading availability...
                </div>
              ) : timeslots.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  No timeslots available.
                </div>
              ) : (
                <div className="space-y-5">

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                    Select the time slots when this lecturer is available to teach.
                  </div>

                  {days.map((day) => {

                    const daySlots =
                      timeslots.filter(
                        (slot) =>
                          slot.day === day
                      );

                    if (
                      daySlots.length === 0
                    ) {
                      return null;
                    }

                    return (
                      <div
                        key={day}
                        className="border border-slate-200 rounded-xl overflow-hidden"
                      >

                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                          <h3 className="font-semibold text-slate-800">
                            {day}
                          </h3>
                        </div>

                        <div className="p-3 space-y-2">

                          {daySlots.map(
                            (slot) => {
                              const checked =
                                selectedTimeslots.includes(
                                  slot.id
                                );

                              return (
                                <label
                                  key={slot.id}
                                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                    checked
                                      ? 'border-emerald-300 bg-emerald-50'
                                      : 'border-slate-200 hover:bg-slate-50'
                                  }`}
                                >

                                  <div className="flex items-center gap-3">

                                    <input
                                      type="checkbox"
                                      checked={
                                        checked
                                      }
                                      onChange={() =>
                                        toggleTimeslot(
                                          slot.id
                                        )
                                      }
                                      className="w-4 h-4 accent-emerald-600"
                                    />

                                    <div>
                                      <p className="font-medium text-slate-800">
                                        {formatTime(
                                          slot.start_time
                                        )}{' '}
                                        -{' '}
                                        {formatTime(
                                          slot.end_time
                                        )}
                                      </p>

                                      <p className="text-xs text-slate-400">
                                        Timeslot ID: {slot.id}
                                      </p>
                                    </div>

                                  </div>

                                  {checked && (
                                    <span className="text-xs font-semibold text-emerald-700">
                                      Available
                                    </span>
                                  )}

                                </label>
                              );
                            }
                          )}

                        </div>
                      </div>
                    );
                  })}

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-100">

              <div className="text-sm text-slate-500">
                <span className="font-semibold text-slate-800">
                  {selectedTimeslots.length}
                </span>{' '}
                time slot
                {selectedTimeslots.length !== 1
                  ? 's'
                  : ''}{' '}
                selected
              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    closeAvailability
                  }
                  disabled={
                    availabilitySaving
                  }
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveAvailability
                  }
                  disabled={
                    availabilityLoading ||
                    availabilitySaving
                  }
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium"
                >
                  {availabilitySaving
                    ? 'Saving...'
                    : 'Save Availability'}
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}