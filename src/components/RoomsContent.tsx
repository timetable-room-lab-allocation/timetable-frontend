import { Plus, X } from 'lucide-react';
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import RoomsTable from './RoomsTable';
import type { RoomRow } from './RoomsTable';

import { api } from '../api/api';

interface BackendRoom {
  id: number;
  name: string;
  room_type: string;
  capacity: number;
  is_available: number;
}

interface RoomForm {
  name: string;
  room_type: string;
  capacity: string;
  is_available: string;
}

const emptyForm: RoomForm = {
  name: '',
  room_type: 'Lecture',
  capacity: '',
  is_available: '1',
};

export default function RoomsContent() {
  const [rooms, setRooms] = useState<RoomRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<RoomForm>(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  // =========================
  // LOAD ROOMS
  // =========================

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.rooms();

      const backendRooms: BackendRoom[] =
        response.data ?? [];

      const mappedRooms: RoomRow[] =
        backendRooms.map((room) => ({
          id: room.id,
          name: room.name,
          room_type: room.room_type,
          capacity: room.capacity,
          is_available:
            Number(room.is_available),
        }));

      setRooms(mappedRooms);

    } catch (err) {
      console.error(
        'LOAD ROOMS ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load rooms'
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // =========================
  // ADD
  // =========================

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setIsModalOpen(true);
  };

  // =========================
  // EDIT
  // =========================

  const openEditModal = async (
    room: RoomRow
  ) => {
    try {
      setError('');

      const response =
        await api.roomById(room.id);

      const backendRoom: BackendRoom =
        response.data;

      setEditingId(backendRoom.id);

      setForm({
        name: backendRoom.name ?? '',
        room_type:
          backendRoom.room_type ?? 'Lecture',
        capacity:
          String(backendRoom.capacity ?? ''),
        is_available:
          String(
            Number(
              backendRoom.is_available
            )
          ),
      });

      setIsModalOpen(true);

    } catch (err) {
      console.error(
        'LOAD ROOM ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load room'
      );
    }
  };

  // =========================
  // CLOSE
  // =========================

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // =========================
  // CHANGE
  // =========================

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // SAVE
  // =========================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError('Room name is required.');
      return;
    }

    if (!form.room_type.trim()) {
      setError('Room type is required.');
      return;
    }

    const capacity = Number(
      form.capacity
    );

    if (
      !form.capacity ||
      Number.isNaN(capacity) ||
      capacity <= 0
    ) {
      setError(
        'Capacity must be greater than 0.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      // =========================
      // CREATE
      // =========================

      if (editingId === null) {
        await api.createRoom({
          name: form.name.trim(),
          room_type:
            form.room_type.trim(),
          capacity,
        });
      }

      // =========================
      // UPDATE
      // =========================

      else {
        await api.updateRoom(
          editingId,
          {
            name: form.name.trim(),
            room_type:
              form.room_type.trim(),
            capacity,
            is_available:
              Number(form.is_available),
          }
        );
      }

      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadRooms();

    } catch (err) {
      console.error(
        'SAVE ROOM ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save room'
      );

    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this room?'
      );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');

      await api.deleteRoom(id);

      await loadRooms();

    } catch (err) {
      console.error(
        'DELETE ROOM ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete room'
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
            Rooms
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Manage classrooms, labs and available facilities.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium shadow-md transition"
        >
          <Plus size={16} />

          Add room
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
          Loading rooms...
        </div>
      )}

      {/* Table */}

      {!loading && (
        <RoomsTable
          rooms={rooms}
          onEdit={openEditModal}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}

      {/* Modal */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between p-6 border-b border-slate-100">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editingId !== null
                    ? 'Edit Room'
                    : 'Add Room'}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {editingId !== null
                    ? 'Update room information.'
                    : 'Enter room information.'}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >

              {/* Name */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Room Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Room 101"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

              </div>

              {/* Type */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Room Type *
                </label>

                <select
                  name="room_type"
                  value={form.room_type}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >

                  <option value="Lecture">
                    Lecture
                  </option>

                  <option value="Lab">
                    Lab
                  </option>

                  <option value="Computer Lab">
                    Computer Lab
                  </option>

                  <option value="Classroom">
                    Classroom
                  </option>

                  <option value="Lecture Hall">
                    Lecture Hall
                  </option>

                </select>

              </div>

              {/* Capacity */}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Capacity *
                </label>

                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  min="1"
                  placeholder="50"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

              </div>

              {/* Availability */}

              {editingId !== null && (
                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Availability
                  </label>

                  <select
                    name="is_available"
                    value={form.is_available}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="1">
                      Available
                    </option>

                    <option value="0">
                      Unavailable
                    </option>

                  </select>

                </div>
              )}

              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
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
                    ? 'Update Room'
                    : 'Create Room'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
