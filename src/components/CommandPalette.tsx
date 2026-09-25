/* ============================================================
   CommandPalette.tsx — Ctrl+K / Cmd+K quick jump (UX guideline 2)
   Jump to any room, lecturer, course or student group and land
   on the Schedule Builder pre-filtered to it.
   ============================================================ */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, GraduationCap, Search, UserRound, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDataset } from '@/api/client'
import { useSchedulerStore } from '@/store/schedulerStore'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

type ResultKind = 'room' | 'lecturer' | 'group' | 'course'

interface Result {
  kind: ResultKind
  id: string
  title: string
  subtitle: string
}

export default function CommandPalette() {
  const open = useSchedulerStore((s) => s.commandPaletteOpen)
  const setOpen = useSchedulerStore((s) => s.setCommandPaletteOpen)
  const setViewMode = useSchedulerStore((s) => s.setViewMode)
  const setRoomFilter = useSchedulerStore((s) => s.setRoomFilter)
  const setStaffFilter = useSchedulerStore((s) => s.setStaffFilter)
  const setGroupFilter = useSchedulerStore((s) => s.setGroupFilter)
  const setPublicSubjectId = useSchedulerStore((s) => s.setPublicSubjectId)

  const { data: dataset } = useDataset()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  /* Global hotkey */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const results = useMemo<Result[]>(() => {
    if (!dataset) return []
    const q = query.trim().toLowerCase()
    const out: Result[] = []
    for (const r of dataset.rooms) {
      out.push({ kind: 'room', id: r.id, title: `${r.name} (${r.code})`, subtitle: `${r.building} · cap ${r.capacity}` })
    }
    for (const s of dataset.staff) {
      out.push({ kind: 'lecturer', id: s.id, title: `${s.title} ${s.name}`, subtitle: s.department })
    }
    for (const g of dataset.groups) {
      out.push({ kind: 'group', id: g.id, title: g.code, subtitle: g.name })
    }
    for (const c of dataset.courses) {
      out.push({ kind: 'course', id: c.id, title: `${c.code} — ${c.name}`, subtitle: c.department })
    }
    if (!q) return out.slice(0, 12)
    return out.filter((r) => `${r.title} ${r.subtitle} ${r.kind}`.toLowerCase().includes(q)).slice(0, 12)
  }, [dataset, query])

  useEffect(() => setCursor(0), [query])

  const pick = (res: Result) => {
    setOpen(false)
    setQuery('')
    if (res.kind === 'room') {
      setViewMode('room')
      setRoomFilter(res.id)
      navigate('/admin/schedule')
    } else if (res.kind === 'lecturer') {
      setViewMode('lecturer')
      setStaffFilter(res.id)
      navigate('/admin/schedule')
    } else if (res.kind === 'group') {
      setViewMode('group')
      setGroupFilter(res.id)
      navigate('/admin/schedule')
    } else {
      // Course → open the personal timetable of the first group taking it.
      const section = dataset?.sections.find((s) => s.courseId === res.id)
      if (section) setPublicSubjectId(section.groupId)
      navigate('/timetable')
    }
  }

  const KIND_ICON = { room: Building2, lecturer: UserRound, group: GraduationCap, course: BookOpen } as const

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery('') }}>
      <DialogContent className="top-[20%] translate-y-0 gap-0 p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Quick search</DialogTitle>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
              if (e.key === 'Enter' && results[cursor]) pick(results[cursor])
            }}
            placeholder="Jump to a room, lecturer, course or student group…"
            aria-label="Search rooms, lecturers, courses and groups"
            className="h-12 w-full bg-transparent text-sm focus:outline-none"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">Esc</kbd>
        </div>
        <ul className="sch-scroll max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {results.length === 0 && (
            <li className="p-4 text-center text-sm text-muted-foreground">No matches.</li>
          )}
          {results.map((r, i) => {
            const Icon = KIND_ICON[r.kind]
            return (
              <li key={`${r.kind}-${r.id}`} role="option" aria-selected={i === cursor}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  onMouseEnter={() => setCursor(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
                    i === cursor ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="font-medium">{r.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{r.subtitle}</span>
                  <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{r.kind}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
