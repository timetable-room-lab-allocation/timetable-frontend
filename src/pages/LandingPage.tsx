import { ArrowRight, CalendarDays, ShieldCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950">
              ST
            </div>

            <div>
              <h1 className="font-bold">Smart Timetable</h1>
              <p className="text-xs text-slate-400">
                University Scheduling System
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Smart University Scheduling
            </div>

            <h2 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
              Build better
              <span className="text-slate-400"> university timetables.</span>
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Manage courses, rooms, lecturers, student groups, and
              scheduling conflicts through one centralized timetable
              management system.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center rounded-xl bg-white px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>

              <button
                onClick={() => navigate('/login')}
                className="rounded-xl border border-white/15 px-6 py-3.5 font-semibold text-white transition hover:bg-white/5"
              >
                Sign In
              </button>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <CalendarDays className="mb-3 h-5 w-5 text-slate-300" />
                <p className="text-sm font-semibold">Scheduling</p>
                <p className="mt-1 text-xs text-slate-500">
                  Organized timetables
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Users className="mb-3 h-5 w-5 text-slate-300" />
                <p className="text-sm font-semibold">Resources</p>
                <p className="mt-1 text-xs text-slate-500">
                  Rooms & lecturers
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-slate-300" />
                <p className="text-sm font-semibold">Conflicts</p>
                <p className="mt-1 text-xs text-slate-500">
                  Smart validation
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-white/5 blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold">
                    Scheduler Dashboard
                  </p>
                  <p className="text-xs text-slate-500">
                    Weekly timetable overview
                  </p>
                </div>

                <div className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  Draft
                </div>
              </div>

              <div className="grid grid-cols-4 border-b border-white/10">
                <div className="p-4">
                  <p className="text-xs text-slate-500">Sections</p>
                  <p className="mt-1 text-2xl font-bold">24</p>
                </div>

                <div className="border-l border-white/10 p-4">
                  <p className="text-xs text-slate-500">Rooms</p>
                  <p className="mt-1 text-2xl font-bold">18</p>
                </div>

                <div className="border-l border-white/10 p-4">
                  <p className="text-xs text-slate-500">Lecturers</p>
                  <p className="mt-1 text-2xl font-bold">32</p>
                </div>

                <div className="border-l border-white/10 p-4">
                  <p className="text-xs text-slate-500">Conflicts</p>
                  <p className="mt-1 text-2xl font-bold">2</p>
                </div>
              </div>

              <div className="space-y-3 p-5">
                {[
                  ['09:00', 'Machine Learning', 'Room 204'],
                  ['11:00', 'Computer Vision', 'Lab 2'],
                  ['13:00', 'Deep Learning', 'Room 110'],
                  ['15:00', 'Pattern Recognition', 'Room 305'],
                ].map(([time, course, room]) => (
                  <div
                    key={time}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="w-14 text-xs text-slate-500">
                      {time}
                    </div>

                    <div className="h-9 w-1 rounded-full bg-slate-500" />

                    <div className="flex-1">
                      <p className="text-sm font-medium">{course}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {room}
                      </p>
                    </div>

                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

