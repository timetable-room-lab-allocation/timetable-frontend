import { Search } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support</h1>
        <p className="text-slate-500 text-sm mt-1">
          Find answers, track requests, and get help with Smart Timetable.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">How can we help?</h2>
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search help articles, features, or error messages..."
            className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 rounded-xl focus:outline-none shadow-sm text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition cursor-pointer">
          <h3 className="font-bold text-slate-800 mb-1">Scheduling & conflicts</h3>
          <p className="text-xs text-slate-500">Resolve overlaps, availability, and timetable issues.</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition cursor-pointer">
          <h3 className="font-bold text-slate-800 mb-1">Courses & people</h3>
          <p className="text-xs text-slate-500">Manage courses, sections, staff, and enrolment.</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition cursor-pointer">
          <h3 className="font-bold text-slate-800 mb-1">Rooms & equipment</h3>
          <p className="text-xs text-slate-500">Fix room, inventory, and assignment problems.</p>
        </div>
      </div>
    </div>
  );
}