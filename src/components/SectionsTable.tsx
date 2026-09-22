import { Edit, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { Section } from '../types';

interface SectionsTableProps {
  sections: Section[];
  onEdit?: (section: Section) => void;
  onDelete?: (id: number) => void;
  deletingId?: number | null;
}

const statusStyles = {
  Open: 'bg-emerald-100 text-emerald-800',
  Full: 'bg-rose-100 text-rose-800',
  Draft: 'bg-slate-100 text-slate-600',
};

export default function SectionsTable({
  sections,
  onEdit,
  onDelete,
  deletingId,
}: SectionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSections = sections.filter(
    (section) =>
      section.code
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      section.course
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      section.instructor
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">
          Upcoming schedule
        </h3>

        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={16}
          />

          <input
            type="text"
            placeholder="Search sections..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
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
                Section
              </th>

              <th className="p-4 font-semibold">
                Course
              </th>

              <th className="p-4 font-semibold">
                Instructor
              </th>

              <th className="p-4 font-semibold">
                Enrolled
              </th>

              <th className="p-4 font-semibold">
                Schedule / Room
              </th>

              <th className="p-4 font-semibold">
                Status
              </th>

              {hasActions && (
                <th className="p-4 font-semibold text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredSections.map((section) => (
              <tr
                key={section.id}
                className="hover:bg-slate-50 transition"
              >
                <td className="p-4 font-bold text-slate-900">
                  {section.code}
                </td>

                <td className="p-4">
                  {section.course}
                </td>

                <td className="p-4">
                  {section.instructor}
                </td>

                <td className="p-4">
                  {section.enrolled}
                </td>

                <td className="p-4">
                  <div className="text-xs font-medium text-slate-900">
                    {section.schedule}
                  </div>

                  <div className="text-xs text-slate-400">
                    {section.room}
                  </div>
                </td>

                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
                      statusStyles[section.status]
                    }`}
                  >
                    {section.status}
                  </span>
                </td>

                {hasActions && (
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() =>
                            onEdit(section)
                          }
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="Edit section"
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() =>
                            onDelete(section.id)
                          }
                          disabled={
                            deletingId === section.id
                          }
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                          title="Delete section"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {filteredSections.length === 0 && (
              <tr>
                <td
                  colSpan={hasActions ? 7 : 6}
                  className="p-8 text-center text-slate-400"
                >
                  No sections found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
