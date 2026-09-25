import { Pencil, Trash2 } from 'lucide-react';
import type { Course } from '../types';

interface CoursesTableProps {
  courses: Course[];
  onEdit: (course: {
    id: number;
    code: string;
    name: string;
  }) => void;
  onDelete: (id: number) => void;
}

export default function CoursesTable({
  courses,
  onEdit,
  onDelete,
}: CoursesTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      <table className="w-full text-left border-collapse text-sm">

        <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
          <tr>
            <th className="p-4 font-semibold">Code</th>
            <th className="p-4 font-semibold">Course Name</th>
            <th className="p-4 font-semibold">Department</th>
            <th className="p-4 font-semibold">Sections</th>
            <th className="p-4 font-semibold">Status</th>
            <th className="p-4 font-semibold text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-slate-700">

          {courses.map((course) => (
            <tr
              key={course.id}
              className="hover:bg-slate-50 transition"
            >

              <td className="p-4 font-bold text-slate-900">
                {course.code}
              </td>

              <td className="p-4">
                {course.name}
              </td>

              <td className="p-4">
                {course.dept}
              </td>

              <td className="p-4">
                {course.sections} Active
              </td>

              <td className="p-4">
                <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-emerald-100 text-emerald-800">
                  {course.status}
                </span>
              </td>

              <td className="p-4">
                <div className="flex justify-end gap-2">

                  <button
                    onClick={() =>
                      onEdit({
                        id: course.id,
                        code: course.code,
                        name: course.name,
                      })
                    }
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                    title="Edit course"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => onDelete(course.id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                    title="Delete course"
                  >
                    <Trash2 size={17} />
                  </button>

                </div>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

      {courses.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          No courses found.
        </div>
      )}

    </div>
  );
}

