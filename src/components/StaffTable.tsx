import {
  CalendarClock,
  Edit,
  Search,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

export interface StaffRow {
  id: number;
  name: string;
  hasAccount: boolean;
}

interface StaffTableProps {
  staff: StaffRow[];
  onEdit?: (member: StaffRow) => void;
  onDelete?: (id: number) => void;
  onAvailability?: (member: StaffRow) => void;
  deletingId?: number | null;
}

export default function StaffTable({
  staff,
  onEdit,
  onDelete,
  onAvailability,
  deletingId,
}: StaffTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = staff.filter((member) =>
    member.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">
          Teaching Staff
        </h3>

        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={16}
          />

          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs bg-slate-100 rounded-xl focus:outline-none w-48 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">

          <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
            <tr>
              <th className="p-4 font-semibold">
                ID
              </th>

              <th className="p-4 font-semibold">
                Name
              </th>

              <th className="p-4 font-semibold">
                Role
              </th>

              <th className="p-4 font-semibold">
                Account
              </th>

              <th className="p-4 font-semibold text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">

            {filteredStaff.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-slate-50 transition"
              >

                <td className="p-4 text-slate-500">
                  {member.id}
                </td>

                <td className="p-4 font-bold text-slate-900">
                  {member.name}
                </td>

                <td className="p-4">
                  Lecturer
                </td>

                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
                      member.hasAccount
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {member.hasAccount
                      ? 'Linked'
                      : 'No account'}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex justify-end gap-2">

                    {/* Availability */}
                    <button
                      type="button"
                      onClick={() =>
                        onAvailability?.(member)
                      }
                      className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                      title="Manage availability"
                    >
                      <CalendarClock size={17} />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() =>
                        onEdit?.(member)
                      }
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                      title="Edit staff"
                    >
                      <Edit size={17} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() =>
                        onDelete?.(member.id)
                      }
                      disabled={
                        deletingId === member.id
                      }
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                      title="Delete staff"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>
                </td>

              </tr>
            ))}

            {filteredStaff.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-slate-400"
                >
                  No staff found.
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}