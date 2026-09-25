import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  BarChart3, Building2, CalendarClock, GraduationCap, LayoutGrid,
  Search, ShieldAlert, TimerReset, UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDataset, useResetData } from '@/api/client'
import { useSchedulerStore } from '@/store/schedulerStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Role } from '@/types/sch'

const ADMIN_NAV = [
  { to: '/admin/schedule', label: 'Schedule Builder', icon: LayoutGrid },
  { to: '/admin/conflicts', label: 'Conflicts', icon: ShieldAlert },
  { to: '/admin/rooms', label: 'Rooms & Labs', icon: Building2 },
  { to: '/admin/availability', label: 'Lecturer Availability', icon: TimerReset },
  { to: '/admin/dashboard', label: 'Facilities Dashboard', icon: BarChart3 },
]

const SIMPLE_NAV = [
  { to: '/timetable', label: 'My Timetable', icon: CalendarClock },
]

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Scheduler / Admin',
  coordinator: 'Dept. Coordinator',
  staff: 'Lecturer',
  student: 'Student',
}

export default function AppShell() {
  const role = useSchedulerStore((s) => s.role)
  const setRole = useSchedulerStore((s) => s.setRole)
  const setPaletteOpen = useSchedulerStore((s) => s.setCommandPaletteOpen)
  const resetData = useResetData()
  const navigate = useNavigate()

  /* Default the active version (draft first) as soon as data exists,
     so every page — not just the builder — has a version context. */
  const { data: dataset } = useDataset()
  const activeVersionId = useSchedulerStore((s) => s.activeVersionId)
  const setActiveVersionId = useSchedulerStore((s) => s.setActiveVersionId)
  useEffect(() => {
    if (!dataset || dataset.versions.length === 0) return
    if (activeVersionId && dataset.versions.some((v) => v.id === activeVersionId)) return
    const draft = dataset.versions.find((v) => v.status === 'draft')
    setActiveVersionId((draft ?? dataset.versions[0]).id)
  }, [dataset, activeVersionId, setActiveVersionId])

  const isAdmin = role === 'admin' || role === 'coordinator'
  const nav = isAdmin ? ADMIN_NAV : SIMPLE_NAV

  const handleRole = (r: Role) => {
    setRole(r)
    navigate(r === 'admin' || r === 'coordinator' ? '/admin/schedule' : '/timetable')
  }

  return (
    <div className="flex h-full">
      {/* -------- Sidebar (role-based navigation) -------- */}
      <aside className="print-hide flex w-56 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4.5 w-4.5" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">BUA DevHub</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Project SCH</div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 px-2" aria-label="Main navigation">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t p-3">
          <div className="space-y-1">
            <label htmlFor="role-select" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              View as
            </label>
            <Select value={role} onValueChange={(v) => handleRole(v as Role)}>
              <SelectTrigger id="role-select" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    <span className="flex items-center gap-1.5 text-xs">
                      {r === 'student' ? <GraduationCap className="h-3 w-3" /> : r === 'staff' ? <UserRound className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                      {ROLE_LABELS[r]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-xs text-muted-foreground hover:text-destructive"
              onClick={() => resetData.mutate()}
              disabled={resetData.isPending}
            >
              <TimerReset className="h-3.5 w-3.5" /> Reset demo data
            </Button>
          )}
        </div>
      </aside>

      {/* -------- Main column -------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="print-hide flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
          <Badge variant="secondary" className="gap-1">
            {isAdmin ? <ShieldAlert className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
            {ROLE_LABELS[role]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Timetable, Room &amp; Lab Allocation · Fall 2026
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto w-64 justify-start gap-2 text-muted-foreground"
            onClick={() => setPaletteOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            Quick search…
            <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px] font-semibold">Ctrl K</kbd>
          </Button>
        </header>

        <main className="sch-scroll min-h-0 flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
