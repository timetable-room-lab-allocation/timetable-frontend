import { Edit, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface RoomRow {
  id: number;
  name: string;
  room_type: string;
  capacity: number;
  is_available: number;
}

interface RoomsTableProps {
  rooms: RoomRow[];
  onEdit?: (room: RoomRow) => void;
  onDelete?: (id: number) => void;
  deletingId?: number | null;
}

export default function RoomsTable({
  rooms,
  onEdit,
  onDelete,
  deletingId,
}: RoomsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRooms = rooms.filter((room) => {
    const search = searchTerm.toLowerCase();

    return (
      room.name.toLowerCase().includes(search) ||
      room.room_type.toLowerCase().includes(search)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">
          Rooms
        </h3>

        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={16}
          />

          <input
            type="text"
            placeholder="Search rooms..."
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
                ID
              </th>

              <th className="p-4 font-semibold">
                Room
              </th>

              <th className="p-4 font-semibold">
                Type
              </th>

              <th className="p-4 font-semibold">
                Capacity
              </th>

              <th className="p-4 font-semibold">
                Availability
              </th>

              <th className="p-4 font-semibold text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">

            {filteredRooms.map((room) => (
              <tr
                key={room.id}
                className="hover:bg-slate-50 transition"
              >

                <td className="p-4 text-slate-500">
                  {room.id}
                </td>

                <td className="p-4 font-bold text-slate-900">
                  {room.name}
                </td>

                <td className="p-4">
                  {room.room_type}
                </td>

                <td className="p-4">
                  {room.capacity}
                </td>

                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
                      room.is_available
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {room.is_available
                      ? 'Available'
                      : 'Unavailable'}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex justify-end gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        onEdit?.(room)
                      }
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                      title="Edit room"
                    >
                      <Edit size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete?.(room.id)
                      }
                      disabled={
                        deletingId === room.id
                      }
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                      title="Delete room"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>
                </td>

              </tr>
            ))}

            {filteredRooms.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-slate-400"
                >
                  No rooms found.
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}
