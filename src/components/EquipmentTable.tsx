import { Pencil, Trash2 } from 'lucide-react';

export interface EquipmentRow {
  id: number;
  name: string;
}

interface EquipmentTableProps {
  equipment: EquipmentRow[];
  onEdit: (item: EquipmentRow) => void;
  onDelete: (item: EquipmentRow) => void;
}

export default function EquipmentTable({
  equipment,
  onEdit,
  onDelete,
}: EquipmentTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
          <tr>
            <th className="p-4 font-semibold">ID</th>
            <th className="p-4 font-semibold">Equipment</th>
            <th className="p-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-slate-700">
          {equipment.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="p-8 text-center text-slate-500"
              >
                No equipment found.
              </td>
            </tr>
          ) : (
            equipment.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50 transition"
              >
                <td className="p-4 text-slate-500">{item.id}</td>

                <td className="p-4 font-bold text-slate-900">
                  {item.name}
                </td>

                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                      title="Edit equipment"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => onDelete(item)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                      title="Delete equipment"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}