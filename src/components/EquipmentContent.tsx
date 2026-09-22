import {
  Search,
  Plus,
  Edit2,
  MoreHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/api';

interface EquipmentItem {
  id: number;
  name: string;
}

export default function EquipmentContent() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] =
    useState<EquipmentItem | null>(null);

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.equipment();

      setEquipment(
        response.data
          .map((item: EquipmentItem) => ({
            id: item.id,
            name: item.name,
          }))
          .sort((a: EquipmentItem, b: EquipmentItem) => a.id - b.id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load equipment'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const filteredEquipment = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return equipment;
    }

    return equipment.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        String(item.id).includes(search)
    );
  }, [equipment, searchTerm]);

  const openAddModal = () => {
    setEditingEquipment(null);
    setName('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item: EquipmentItem) => {
    setEditingEquipment(item);
    setName(item.name);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingEquipment(null);
    setName('');
    setFormError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError('Equipment name is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      if (editingEquipment) {
        await api.updateEquipment(editingEquipment.id, {
          name: trimmedName,
        });
      } else {
        await api.createEquipment({
          name: trimmedName,
        });
      }

      closeModal();
      await loadEquipment();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Failed to save equipment'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: EquipmentItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?`
    );

    if (!confirmed) return;

    try {
      setError('');

      await api.deleteEquipment(item.id);

      await loadEquipment();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete equipment'
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Equipment
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Manage teaching equipment, inventory, and availability.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Plus size={16} />
          Add equipment
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-base">
            Equipment inventory
          </h3>

          <span className="text-xs text-slate-500 font-medium">
            {equipment.length} {equipment.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-3">

          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={15}
            />

            <input
              type="text"
              placeholder="Search equipment"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none w-64 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredEquipment.length} of {equipment.length}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading equipment...
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse text-sm">

              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-bold text-slate-900 text-xs">
                    ITEM NAME
                  </th>

                  <th className="p-4 font-bold text-slate-900 text-xs">
                    EQUIPMENT ID
                  </th>

                  <th className="p-4 font-bold text-slate-900 text-xs">
                    STATUS
                  </th>

                  <th className="p-4 font-bold text-slate-900 text-xs text-right">
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">

                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-10 text-center text-sm text-slate-500"
                    >
                      No equipment found.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition"
                    >

                      <td className="p-4 font-bold text-slate-900">
                        {item.name}
                      </td>

                      <td className="p-4 text-xs font-mono font-medium text-slate-600">
                        EQ-{String(item.id).padStart(3, '0')}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-emerald-100 text-emerald-800">
                          Available
                        </span>
                      </td>

                      <td className="p-4 text-right">

                        <div className="flex items-center justify-end gap-2 text-slate-400">

                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded transition"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>

                          <button
                            className="p-1.5 hover:bg-slate-100 rounded transition"
                            title="More"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-white">

          <div>
            {filteredEquipment.length} equipment items
          </div>

        </div>

      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingEquipment
                    ? 'Edit equipment'
                    : 'Add equipment'}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  {editingEquipment
                    ? 'Update equipment information.'
                    : 'Add a new teaching equipment item.'}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={18} />
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-5"
            >

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Equipment name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Projector"
                  disabled={saving}
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 transition"
                >
                  {saving
                    ? 'Saving...'
                    : editingEquipment
                      ? 'Save changes'
                      : 'Add equipment'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}