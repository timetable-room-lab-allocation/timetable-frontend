/* ============================================================
   SchedulerGridView.tsx — SCH-FR-04 / SCH-FR-05
   High-density conflict-aware allocation board.
   Views: Room | Lecturer | Student Group.
   ============================================================ */

import { useMemo, useState } from 'react'
import { AlertTriangle, Building2, GraduationCap, Lock, Search, UserRound } from 'lucide-react'
import { cn, slotLabel } from '@/lib/utils'
import { useSchedulerData } from '@/hooks/useSchedulerData'
import { useSchedulerStore, type GridViewMode } from '@/store/schedulerStore'
import {
  DAYS, DAY_LABELS, SLOTS, DAY_START_HOUR, ROOM_TYPE_LABELS,
  type Allocation, type Room, type StaffMember, type StudentGroup,
} from '@/types/sch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/EmptyState'
import { SessionCard } from '@/components/scheduler/SessionCard'

const RESOURCE_COL = 'w-52 shrink-0'
const CELL_MIN = 118 // px per 1h slot column

interface GridRow {
  id: string
  label: string
  sublabel: string
  allocations: Allocation[]
}

export default function SchedulerGridView() {
  const {
    dataset, version, conflictsByAllocation, lookups, isDraft, isEmpty,
  } = useSchedulerData()

  const viewMode = useSchedulerStore((s) => s.viewMode)
  const setViewMode = useSchedulerStore((s) => s.setViewMode)
  const roomFilter = useSchedulerStore((s) => s.roomFilter)
  const staffFilter = useSchedulerStore((s) => s.staffFilter)
  const groupFilter = useSchedulerStore((s) => s.groupFilter)
  const setRoomFilter = useSchedulerStore((s) => s.setRoomFilter)
  const setStaffFilter = useSchedulerStore((s) => s.setStaffFilter)
  const setGroupFilter = useSchedulerStore((s) => s.setGroupFilter)
  const openConflictDrawer = useSchedulerStore((s) => s.openConflictDrawer)
  const openRecommendDrawer = useSchedulerStore((s) => s.openRecommendDrawer)

  const [search, setSearch] = useState('')

  const allocations = version?.allocations ?? []

  const rows: GridRow[] = useMemo(() => {
    if (!dataset || !lookups) return []
    const q = search.trim().toLowerCase()

    if (viewMode === 'room') {
      let rooms = dataset.rooms
      if (roomFilter !== 'all') rooms = rooms.filter((r) => r.id === roomFilter)
      if (q) {
        rooms = rooms.filter((r) =>
          `${r.name} ${r.code} ${r.building} ${r.type}`.toLowerCase().includes(q))
      }
      return rooms.map((room) => ({
        id: room.id,
        label: roomLabel(room),
        sublabel: `${room.building} · cap ${room.capacity}${room.accessible ? ' · ♿' : ''}`,
        allocations: allocations.filter((a) => a.roomId === room.id),
      }))
    }

    if (viewMode === 'lecturer') {
      let staff = dataset.staff
      if (staffFilter !== 'all') staff = staff.filter((s) => s.id === staffFilter)
      if (q) staff = staff.filter((s) => `${s.name} ${s.code} ${s.department}`.toLowerCase().includes(q))
      return staff.map((s) => ({
        id: s.id,
        label: `${s.title} ${s.name}`,
        sublabel: s.department,
        allocations: allocations.filter((a) => lookups.sectionsById.get(a.sectionId)?.staffId === s.id),
      }))
    }

    let groups = dataset.groups
    if (groupFilter !== 'all') groups = groups.filter((g) => g.id === groupFilter)
    if (q) groups = groups.filter((g) => `${g.code} ${g.name} ${g.program}`.toLowerCase().includes(q))
    return groups.map((g) => ({
      id: g.id,
      label: g.code,
      sublabel: `${g.name} · ${g.size} students`,
      allocations: allocations.filter((a) => lookups.sectionsById.get(a.sectionId)?.groupId === g.id),
    }))
  }, [dataset, lookups, viewMode, allocations, roomFilter, staffFilter, groupFilter, search])

  /* Unallocated sessions tray */
  const unallocated = useMemo(
    () => allocations.filter((a) => a.roomId === null),
    [allocations],
  )

  if (isEmpty || !dataset) {
    return (
      <EmptyState
        title="No scheduling data yet"
        description="Load the seed demo dataset to explore the schedule builder with 20 rooms, 15 staff and 25 sections — including pre-baked hard conflicts to demo the Conflict Inspector."
      />
    )
  }

  const totalConflicts = new Set(
    [...conflictsByAllocation.values()].flat().map((c) => c.id),
  ).size

  return (
    <div className="flex h-full flex-col gap-3">
      {/* ---------------- Toolbar ---------------- */}
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as GridViewMode)}>
          <TabsList aria-label="Grid view mode">
            <TabsTrigger value="room"><Building2 className="h-3.5 w-3.5" /> Room</TabsTrigger>
            <TabsTrigger value="lecturer"><UserRound className="h-3.5 w-3.5" /> Lecturer</TabsTrigger>
            <TabsTrigger value="group"><GraduationCap className="h-3.5 w-3.5" /> Student Group</TabsTrigger>
          </TabsList>
        </Tabs>

        <ResourceFilterSelect
          viewMode={viewMode}
          dataset={dataset}
          roomFilter={roomFilter} staffFilter={staffFilter} groupFilter={groupFilter}
          setRoomFilter={setRoomFilter} setStaffFilter={setStaffFilter} setGroupFilter={setGroupFilter}
        />

        <div className="relative min-w-40 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Filter ${viewMode === 'room' ? 'rooms' : viewMode === 'lecturer' ? 'lecturers' : 'groups'}…`}
            aria-label="Filter rows"
            className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          {totalConflicts > 0 ? (
            <Badge variant="destructive" className="gap-1 px-2.5">
              <AlertTriangle className="h-3 w-3" /> {totalConflicts} hard conflicts
            </Badge>
          ) : (
            <Badge variant="success">No hard conflicts</Badge>
          )}
          {unallocated.length > 0 && (
            <Badge variant="warning">{unallocated.length} unallocated</Badge>
          )}
          {!isDraft && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" /> Read-only (published)
            </Badge>
          )}
        </div>
      </Card>

      {/* ---------------- Unallocated tray ---------------- */}
      {unallocated.length > 0 && viewMode !== 'room' && (
        <Card className="flex flex-wrap items-center gap-2 border-dashed border-amber-300 bg-amber-50/60 p-2.5">
          <span className="text-xs font-semibold text-amber-800">Needs a room:</span>
          {unallocated.map((a) => {
            const sec = lookups!.sectionsById.get(a.sectionId)
            const course = sec ? lookups!.coursesById.get(sec.courseId) : null
            return (
              <Button key={a.id} size="sm" variant="outline" className="h-7 border-amber-400 text-xs"
                onClick={() => openRecommendDrawer({ sectionId: a.sectionId, allocationId: a.id })}>
                {course?.code} · {sec?.code} — {DAY_LABELS[a.day]} {slotLabel(a.slot, sec?.slotCount ?? 1)}
                <span className="text-amber-600">Find room →</span>
              </Button>
            )
          })}
        </Card>
      )}

      {/* ---------------- Grid ---------------- */}
      <Card className="sch-scroll min-h-0 flex-1 overflow-auto p-0">
        <div style={{ minWidth: 208 + DAYS.length * SLOTS.length * CELL_MIN }}>
          {/* Day header */}
          <div className="sticky top-0 z-20 flex border-b bg-card">
            <div className={cn(RESOURCE_COL, 'sticky left-0 z-30 border-r bg-card px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground')}>
              {viewMode === 'room' ? 'Room' : viewMode === 'lecturer' ? 'Lecturer' : 'Group'}
            </div>
            {DAYS.map((day) => (
              <div key={day} className="flex-1 border-r last:border-r-0" style={{ minWidth: SLOTS.length * CELL_MIN }}>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${SLOTS.length}, minmax(${CELL_MIN}px, 1fr))` }}>
                  {SLOTS.map((slot) => (
                    <div key={`${day}-${slot}`} className="border-b px-2 pb-1 pt-2 text-center last:border-r-0">
                      <div className="text-[11px] font-semibold text-foreground">
                        {slot === 0 ? DAY_LABELS[day] : ''}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {String(DAY_START_HOUR + slot).padStart(2, '0')}:00
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Resource rows */}
          {rows.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No {viewMode === 'room' ? 'rooms' : viewMode === 'lecturer' ? 'lecturers' : 'groups'} match the current filter.
            </p>
          )}
          {rows.map((row) => (
            <div key={row.id} className="flex border-b last:border-b-0">
              <div className={cn(RESOURCE_COL, 'sticky left-0 z-10 border-r bg-card px-3 py-2')}>
                <div className="truncate text-xs font-semibold">{row.label}</div>
                <div className="truncate text-[11px] text-muted-foreground">{row.sublabel}</div>
              </div>
              {DAYS.map((day) => (
                <div key={day} className="flex min-w-fit flex-1 border-r last:border-r-0">
                  {SLOTS.map((slot) => {
                    const starting = row.allocations.filter((a) => a.day === day && a.slot === slot)
                    const room = viewMode === 'room' ? lookups!.roomsById.get(row.id) : undefined
                    const closure = room?.closures.find((c) => c.day === day && c.slot === slot)
                    return (
                      <div
                        key={`${day}-${slot}`}
                        className={cn(
                          'flex min-h-[64px] flex-1 flex-col gap-0.5 border-l border-dashed border-slate-200 p-0.5 first:border-l-0',
                          closure && 'bg-slate-200/70',
                          slot === 0 && 'border-l-0',
                        )}
                        style={{ minWidth: CELL_MIN }}
                      >
                        {closure && (
                          <div className="px-1 pt-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500" title={closure.reason}>
                            Closed
                          </div>
                        )}
                        {starting.map((a) => {
                          const sec = lookups!.sectionsById.get(a.sectionId)
                          if (!sec) return null
                          const course = lookups!.coursesById.get(sec.courseId)
                          const group = lookups!.groupsById.get(sec.groupId)
                          if (!course || !group) return null
                          const staff = lookups!.staffById.get(sec.staffId)
                          const aRoom = a.roomId ? lookups!.roomsById.get(a.roomId) : null
                          return (
                            <div
                              key={a.id}
                              className="relative z-[5]"
                              style={{ width: `calc(${sec.slotCount * 100}% - 2px)` }}
                            >
                              <SessionCard
                                section={sec}
                                courseCode={course.code}
                                group={group}
                                staff={viewMode === 'lecturer' ? undefined : staff}
                                room={aRoom}
                                hideRoomName={viewMode === 'room'}
                                day={day}
                                slot={a.slot}
                                slotCount={sec.slotCount}
                                conflicts={conflictsByAllocation.get(a.id) ?? []}
                                editable={isDraft}
                                onInspect={() => openConflictDrawer(a.id)}
                                onRecommend={() => openRecommendDrawer({ sectionId: sec.id, allocationId: a.id })}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function roomLabel(room: Room): string {
  return `${room.name} · ${ROOM_TYPE_LABELS[room.type]}`
}

/* ---------------- Resource filter select ---------------- */

interface ResourceFilterSelectProps {
  viewMode: GridViewMode
  dataset: NonNullable<ReturnType<typeof useSchedulerData>['dataset']>
  roomFilter: string | 'all'
  staffFilter: string | 'all'
  groupFilter: string | 'all'
  setRoomFilter: (v: string | 'all') => void
  setStaffFilter: (v: string | 'all') => void
  setGroupFilter: (v: string | 'all') => void
}

function ResourceFilterSelect({
  viewMode, dataset, roomFilter, staffFilter, groupFilter,
  setRoomFilter, setStaffFilter, setGroupFilter,
}: ResourceFilterSelectProps) {
  if (viewMode === 'room') {
    return (
      <Select value={roomFilter} onValueChange={setRoomFilter}>
        <SelectTrigger className="w-56" aria-label="Room filter">
          <SelectValue placeholder="All rooms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All rooms ({dataset.rooms.length})</SelectItem>
          {dataset.rooms.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.code} — {r.name} ({ROOM_TYPE_LABELS[r.type]}, {r.capacity})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  if (viewMode === 'lecturer') {
    return (
      <Select value={staffFilter} onValueChange={setStaffFilter}>
        <SelectTrigger className="w-56" aria-label="Lecturer filter">
          <SelectValue placeholder="All lecturers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All lecturers ({dataset.staff.length})</SelectItem>
          {dataset.staff.map((s: StaffMember) => (
            <SelectItem key={s.id} value={s.id}>{s.title} {s.name} — {s.department}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  return (
    <Select value={groupFilter} onValueChange={setGroupFilter}>
      <SelectTrigger className="w-56" aria-label="Student group filter">
        <SelectValue placeholder="All groups" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All groups ({dataset.groups.length})</SelectItem>
        {dataset.groups.map((g: StudentGroup) => (
          <SelectItem key={g.id} value={g.id}>{g.code} — {g.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
