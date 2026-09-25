/* ============================================================
   PublicTimetableView.tsx — SCH-FR-08
   Ultra-simple personal timetable for Students & Lecturers.
   - Dropdown selector for Student Group or Staff Member
   - Week Calendar view ⇄ Linear Agenda view
   - Export to Calendar (.ics) · Printable Timetable (print CSS)
   ============================================================ */

import { useMemo, useState } from 'react'
import { Calendar, CalendarDays, Download, List, Printer } from 'lucide-react'
import { cn, slotLabel, downloadFile } from '@/lib/utils'
import { buildIcs, upcomingSunday, type IcsEvent } from '@/lib/ics'
import { useDataset } from '@/api/client'
import { useSchedulerStore } from '@/store/schedulerStore'
import {
  DAYS, DAY_LABELS, SLOTS, DAY_START_HOUR,
  type Allocation, type Dataset,
} from '@/types/sch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/EmptyState'

interface Entry {
  allocation: Allocation
  courseCode: string
  courseName: string
  sectionCode: string
  kind: 'lecture' | 'practical'
  roomName: string | null
  staffName: string | null
  groupCode: string | null
  day: string
  slot: number
  slotCount: number
}

function buildEntries(dataset: Dataset, allocations: Allocation[], subjectType: 'group' | 'staff', subjectId: string): Entry[] {
  const out: Entry[] = []
  for (const a of allocations) {
    const sec = dataset.sections.find((s) => s.id === a.sectionId)
    if (!sec) continue
    if (subjectType === 'group' && sec.groupId !== subjectId) continue
    if (subjectType === 'staff' && sec.staffId !== subjectId) continue
    const course = dataset.courses.find((c) => c.id === sec.courseId)
    const room = a.roomId ? dataset.rooms.find((r) => r.id === a.roomId) : null
    const staff = dataset.staff.find((s) => s.id === sec.staffId)
    const group = dataset.groups.find((g) => g.id === sec.groupId)
    out.push({
      allocation: a,
      courseCode: course?.code ?? '—',
      courseName: course?.name ?? '',
      sectionCode: sec.code,
      kind: sec.kind,
      roomName: room ? `${room.name} · ${room.building}` : null,
      staffName: staff ? `${staff.title} ${staff.name}` : null,
      groupCode: group?.code ?? null,
      day: a.day,
      slot: a.slot,
      slotCount: sec.slotCount,
    })
  }
  const dayOrder = DAYS as string[]
  return out.sort((x, y) => dayOrder.indexOf(x.day) - dayOrder.indexOf(y.day) || x.slot - y.slot)
}

export default function PublicTimetableView() {
  const { data: dataset } = useDataset()
  const [subjectType, setSubjectType] = useState<'group' | 'staff'>('group')
  const [view, setView] = useState<'week' | 'agenda'>('week')
  const publicSubjectId = useSchedulerStore((s) => s.publicSubjectId)
  const setPublicSubjectId = useSchedulerStore((s) => s.setPublicSubjectId)

  /* Students & lecturers always read the PUBLISHED version (fall back to draft). */
  const version = useMemo(() => {
    if (!dataset || dataset.versions.length === 0) return null
    return dataset.versions.find((v) => v.status === 'published') ?? dataset.versions[0]
  }, [dataset])

  const subjectId = publicSubjectId ?? (subjectType === 'group' ? dataset?.groups[0]?.id ?? null : dataset?.staff[0]?.id ?? null)

  const entries = useMemo(() => {
    if (!dataset || !version || !subjectId) return []
    return buildEntries(dataset, version.allocations, subjectType, subjectId)
  }, [dataset, version, subjectId, subjectType])

  if (!dataset || dataset.rooms.length === 0 || !version) {
    return (
      <EmptyState
        title="No timetable data yet"
        description="Load the seed demo dataset to view student group and lecturer timetables, with calendar export and printable layouts."
      />
    )
  }

  const subjectOptions: { id: string; label: string }[] =
    subjectType === 'group'
      ? dataset.groups.map((g) => ({ id: g.id, label: `${g.code} — ${g.name}` }))
      : dataset.staff.map((s) => ({ id: s.id, label: `${s.title} ${s.name} — ${s.department}` }))

  const subjectName =
    subjectType === 'group'
      ? dataset.groups.find((g) => g.id === subjectId)?.name
      : (() => {
          const s = dataset.staff.find((x) => x.id === subjectId)
          return s ? `${s.title} ${s.name} — ${s.department}` : undefined
        })()

  const handleExportIcs = () => {
    const weekStart = upcomingSunday()
    const events: IcsEvent[] = entries.map((e) => ({
      uid: `${e.allocation.id}-${version!.id}`,
      summary: `${e.courseCode} · ${e.courseName} (${e.sectionCode})`,
      description: [
        e.kind === 'practical' ? 'Practical Lab' : 'Lecture',
        e.staffName && `Lecturer: ${e.staffName}`,
        e.groupCode && `Group: ${e.groupCode}`,
      ].filter(Boolean).join('\n'),
      location: e.roomName ?? 'Room TBA',
      day: e.allocation.day,
      slot: e.slot,
      slotCount: e.slotCount,
      weekStart,
    }))
    const ics = buildIcs(events, `${subjectName ?? 'Timetable'} — BUA ${version!.label}`)
    downloadFile(`bua-timetable-${subjectId}.ics`, ics, 'text/calendar')
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      {/* -------- Controls (hidden when printing) -------- */}
      <Card className="print-hide">
        <CardContent className="flex flex-wrap items-center gap-3 p-3 pt-3">
          <Tabs value={subjectType} onValueChange={(v) => { setSubjectType(v as 'group' | 'staff'); setPublicSubjectId(null) }}>
            <TabsList aria-label="Timetable subject type">
              <TabsTrigger value="group">Student Group</TabsTrigger>
              <TabsTrigger value="staff">Staff Member</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={subjectId ?? ''} onValueChange={setPublicSubjectId}>
            <SelectTrigger className="w-72" aria-label={subjectType === 'group' ? 'Student group' : 'Staff member'}>
              <SelectValue placeholder={subjectType === 'group' ? 'Choose a group…' : 'Choose a lecturer…'} />
            </SelectTrigger>
            <SelectContent>
              {subjectOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={view} onValueChange={(v) => setView(v as 'week' | 'agenda')}>
            <TabsList aria-label="Timetable view">
              <TabsTrigger value="week"><Calendar className="h-3.5 w-3.5" /> Week</TabsTrigger>
              <TabsTrigger value="agenda"><List className="h-3.5 w-3.5" /> Agenda</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={handleExportIcs} disabled={entries.length === 0}>
              <Download /> Export to Calendar (.ics)
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> Printable Timetable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* -------- Printable timetable -------- */}
      <div className="print-area">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-bold">{subjectName ?? 'Timetable'}</h1>
            <p className="text-sm text-muted-foreground">
              BUA DevHub · {version.label} ({version.status}) · Weekly, Sun–Thu, {DAY_START_HOUR}:00–{DAY_START_HOUR + SLOTS.length}:00
            </p>
          </div>
          <Badge variant={version.status === 'published' ? 'published' : 'draft'} className="print-hide">
            {version.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No sessions scheduled for this {subjectType === 'group' ? 'group' : 'lecturer'} in {version.label}.
            </CardContent>
          </Card>
        ) : view === 'week' ? (
          <WeekCalendar entries={entries} />
        ) : (
          <AgendaList entries={entries} subjectType={subjectType} />
        )}
      </div>
    </div>
  )
}

/* ---------------- Week calendar ---------------- */

function WeekCalendar({ entries }: { entries: Entry[] }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0 pt-0">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `64px repeat(${DAYS.length}, minmax(0, 1fr))`,
            gridTemplateRows: `auto repeat(${SLOTS.length}, minmax(58px, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="border-b border-r bg-muted/50" />
          {DAYS.map((d, i) => (
            <div
              key={d}
              className="border-b border-r bg-muted/50 px-2 py-2 text-center text-xs font-semibold last:border-r-0"
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              {DAY_LABELS[d]}
            </div>
          ))}

          {/* Time gutter + empty day cells */}
          {SLOTS.map((slot) => (
            <div
              key={`t-${slot}`}
              className="flex items-start justify-center border-b border-r bg-muted/30 py-2 text-[11px] font-medium tabular-nums text-muted-foreground"
              style={{ gridColumn: 1, gridRow: slot + 2 }}
            >
              {String(DAY_START_HOUR + slot).padStart(2, '0')}:00
            </div>
          ))}
          {DAYS.map((day, di) =>
            SLOTS.map((slot) => (
              <div
                key={`${day}-${slot}`}
                className="border-b border-r last:border-r-0"
                style={{ gridColumn: di + 2, gridRow: slot + 2 }}
              />
            )),
          )}

          {/* Session cards (span slotCount rows) */}
          {entries.map((e) => {
            const di = DAYS.indexOf(e.day as (typeof DAYS)[number])
            return (
              <div
                key={e.allocation.id}
                className={cn(
                  'relative z-10 m-0.5 overflow-hidden rounded-md border px-2 py-1 text-[11px] leading-tight shadow-sm',
                  e.kind === 'practical'
                    ? 'border-teal-300 bg-teal-50 text-teal-950'
                    : 'border-indigo-300 bg-indigo-50 text-indigo-950',
                )}
                style={{
                  gridColumn: di + 2,
                  gridRow: `${e.slot + 2} / span ${e.slotCount}`,
                }}
              >
                <div className="font-bold">{e.courseCode} · {e.sectionCode}</div>
                <div className="truncate opacity-80">{e.courseName}</div>
                <div className="truncate opacity-70">{e.roomName ?? 'Room TBA'}</div>
                <div className="opacity-70">{slotLabel(e.slot, e.slotCount)}</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------------- Agenda list ---------------- */

function AgendaList({ entries, subjectType }: { entries: Entry[]; subjectType: 'group' | 'staff' }) {
  const byDay = DAYS.map((d) => ({ day: d, items: entries.filter((e) => e.day === d) }))
  return (
    <div className="space-y-3">
      {byDay.map(({ day, items }) => (
        <Card key={day}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
              {DAY_LABELS[day]}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {items.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No sessions — free day.</p>
            ) : (
              <ul className="divide-y">
                {items.map((e) => (
                  <li key={e.allocation.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                    <span className="w-24 shrink-0 font-semibold tabular-nums">{slotLabel(e.slot, e.slotCount)}</span>
                    <Badge variant={e.kind === 'practical' ? 'practical' : 'lecture'}>
                      {e.kind === 'practical' ? 'Practical Lab' : 'Lecture'}
                    </Badge>
                    <span className="font-medium">{e.courseCode} — {e.courseName}</span>
                    <span className="text-muted-foreground">({e.sectionCode})</span>
                    <span className="ml-auto text-muted-foreground">
                      {e.roomName ?? 'Room TBA'}
                      {subjectType === 'group' && e.staffName ? ` · ${e.staffName}` : ''}
                      {subjectType === 'staff' && e.groupCode ? ` · Group ${e.groupCode}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
