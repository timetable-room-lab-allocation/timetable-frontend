/* ============================================================
   SchedulerGridView.tsx — SCH-FR-04 / SCH-FR-05
   High-density conflict-aware allocation board.
   Views: Room | Lecturer | Student Group.
   ============================================================ */

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  GraduationCap,
  Lock,
  Plus,
  Search,
  UserRound,
  X,
} from 'lucide-react'

import { cn, slotLabel } from '@/lib/utils'
import { useSchedulerData } from '@/hooks/useSchedulerData'
import { useSchedulerStore, type GridViewMode } from '@/store/schedulerStore'

import {
  DAYS,
  DAY_LABELS,
  SLOTS,
  DAY_START_HOUR,
  ROOM_TYPE_LABELS,
  type Allocation,
  type Room,
  type StaffMember,
  type StudentGroup,
} from '@/types/sch'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { EmptyState } from '@/components/EmptyState'
import { SessionCard } from '@/components/scheduler/SessionCard'
import {
  createSection,
  type CreateSectionInput,
} from '@/api/client'

const RESOURCE_COL = 'w-52 shrink-0'
const CELL_MIN = 118

interface GridRow {
  id: string
  label: string
  sublabel: string
  allocations: Allocation[]
}

export default function SchedulerGridView() {
  const {
    dataset,
    version,
    conflictsByAllocation,
    lookups,
    isDraft,
    isEmpty,
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

  /* ---------------- Add Section state ---------------- */

  const [showAddSection, setShowAddSection] = useState(false)

  const [sectionForm, setSectionForm] = useState<CreateSectionInput>({
    course_id: 0,
    student_group_id: 0,
    lecturer_id: 0,
    name: '',
    students: 30,
    duration: 1,
    room_type_required: 'Lecture',
  })

  const [creatingSection, setCreatingSection] = useState(false)
  const [sectionMessage, setSectionMessage] = useState('')

  const allocations = version?.allocations ?? []

  const rows: GridRow[] = useMemo(() => {
    if (!dataset || !lookups) return []

    const q = search.trim().toLowerCase()

    if (viewMode === 'room') {
      let rooms = dataset.rooms

      if (roomFilter !== 'all') {
        rooms = rooms.filter((r) => r.id === roomFilter)
      }

      if (q) {
        rooms = rooms.filter((r) =>
          `${r.name} ${r.code} ${r.building} ${r.type}`
            .toLowerCase()
            .includes(q),
        )
      }

      return rooms.map((room) => ({
        id: room.id,
        label: roomLabel(room),
        sublabel: `${room.building} · cap ${room.capacity}${room.accessible ? ' · ♿' : ''}`,
        allocations: allocations.filter(
          (a) => a.roomId === room.id,
        ),
      }))
    }

    if (viewMode === 'lecturer') {
      let staff = dataset.staff

      if (staffFilter !== 'all') {
        staff = staff.filter((s) => s.id === staffFilter)
      }

      if (q) {
        staff = staff.filter((s) =>
          `${s.name} ${s.code} ${s.department}`
            .toLowerCase()
            .includes(q),
        )
      }

      return staff.map((s) => ({
        id: s.id,
        label: `${s.title} ${s.name}`,
        sublabel: s.department,
        allocations: allocations.filter(
          (a) =>
            lookups.sectionsById.get(a.sectionId)?.staffId === s.id,
        ),
      }))
    }

    let groups = dataset.groups

    if (groupFilter !== 'all') {
      groups = groups.filter((g) => g.id === groupFilter)
    }

    if (q) {
      groups = groups.filter((g) =>
        `${g.code} ${g.name} ${g.program}`
          .toLowerCase()
          .includes(q),
      )
    }

    return groups.map((g) => ({
      id: g.id,
      label: g.code,
      sublabel: `${g.name} · ${g.size} students`,
      allocations: allocations.filter(
        (a) =>
          lookups.sectionsById.get(a.sectionId)?.groupId === g.id,
      ),
    }))
  }, [
    dataset,
    lookups,
    viewMode,
    allocations,
    roomFilter,
    staffFilter,
    groupFilter,
    search,
  ])

  const unallocated = useMemo(
    () => allocations.filter((a) => a.roomId === null),
    [allocations],
  )

  /* ---------------- Add Section ---------------- */

  async function handleCreateSection() {
    setSectionMessage('')

    if (
      !sectionForm.course_id ||
      !sectionForm.student_group_id ||
      !sectionForm.lecturer_id ||
      !sectionForm.name.trim()
    ) {
      setSectionMessage(
        'Please select Course, Student Group, Lecturer and enter Section Name.',
      )
      return
    }

    if (sectionForm.students <= 0) {
      setSectionMessage('Students must be greater than 0.')
      return
    }

    try {
      setCreatingSection(true)

      const result = await createSection({
        ...sectionForm,
        name: sectionForm.name.trim(),
      })

      setSectionMessage(
        `Section created successfully. ID: ${result.sectionId}`,
      )

      setSectionForm({
        course_id: 0,
        student_group_id: 0,
        lecturer_id: 0,
        name: '',
        students: 30,
        duration: 1,
        room_type_required: 'Lecture',
      })

      /*
       * useSchedulerData will need to refresh its dataset.
       * Reloading the page here guarantees the newly-created
       * section is fetched from the backend immediately.
       */
      window.location.reload()
    } catch (error) {
      console.error('Create section error:', error)

      setSectionMessage(
        error instanceof Error
          ? error.message
          : 'Failed to create section.',
      )
    } finally {
      setCreatingSection(false)
    }
  }

  if (isEmpty || !dataset) {
    return (
      <EmptyState
        title="No scheduling data yet"
        description="Load the seed demo dataset to explore the schedule builder with 20 rooms, 15 staff and 25 sections — including pre-baked hard conflicts to demo the Conflict Inspector."
      />
    )
  }

  const totalConflicts = new Set(
    [...conflictsByAllocation.values()]
      .flat()
      .map((c) => c.id),
  ).size

  return (
    <div className="flex h-full flex-col gap-3">

      {/* ---------------- Toolbar ---------------- */}

      <Card className="flex flex-wrap items-center gap-3 p-3">

        <Tabs
          value={viewMode}
          onValueChange={(v) =>
            setViewMode(v as GridViewMode)
          }
        >
          <TabsList aria-label="Grid view mode">
            <TabsTrigger value="room">
              <Building2 className="h-3.5 w-3.5" />
              Room
            </TabsTrigger>

            <TabsTrigger value="lecturer">
              <UserRound className="h-3.5 w-3.5" />
              Lecturer
            </TabsTrigger>

            <TabsTrigger value="group">
              <GraduationCap className="h-3.5 w-3.5" />
              Student Group
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ResourceFilterSelect
          viewMode={viewMode}
          dataset={dataset}
          roomFilter={roomFilter}
          staffFilter={staffFilter}
          groupFilter={groupFilter}
          setRoomFilter={setRoomFilter}
          setStaffFilter={setStaffFilter}
          setGroupFilter={setGroupFilter}
        />

        <div className="relative min-w-40 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Filter ${
              viewMode === 'room'
                ? 'rooms'
                : viewMode === 'lecturer'
                  ? 'lecturers'
                  : 'groups'
            }…`}
            aria-label="Filter rows"
            className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Add Section button */}

        {isDraft && (
          <Button
            type="button"
            onClick={() => {
              setShowAddSection((value) => !value)
              setSectionMessage('')
            }}
            className="gap-1.5"
          >
            {showAddSection ? (
              <>
                <X className="h-4 w-4" />
                Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Section
              </>
            )}
          </Button>
        )}

        <div className="flex items-center gap-2">

          {totalConflicts > 0 ? (
            <Badge
              variant="destructive"
              className="gap-1 px-2.5"
            >
              <AlertTriangle className="h-3 w-3" />
              {totalConflicts} hard conflicts
            </Badge>
          ) : (
            <Badge variant="success">
              No hard conflicts
            </Badge>
          )}

          {unallocated.length > 0 && (
            <Badge variant="warning">
              {unallocated.length} unallocated
            </Badge>
          )}

          {!isDraft && (
            <Badge
              variant="secondary"
              className="gap-1"
            >
              <Lock className="h-3 w-3" />
              Read-only (published)
            </Badge>
          )}

        </div>
      </Card>

      {/* ---------------- Add Section Form ---------------- */}

      {showAddSection && isDraft && (
        <Card className="border-primary/30 bg-card p-4">

          <div className="mb-4">
            <h2 className="text-sm font-semibold">
              Add New Section
            </h2>

            <p className="text-xs text-muted-foreground">
              Create a section and assign its course, student
              group and lecturer.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* Course */}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Course
              </label>

              <Select
                value={
                  sectionForm.course_id
                    ? String(sectionForm.course_id)
                    : ''
                }
                onValueChange={(value) =>
                  setSectionForm((current) => ({
                    ...current,
                    course_id: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>

                <SelectContent>
                  {dataset.courses.map((course) => (
                    <SelectItem
                      key={course.id}
                      value={String(course.id)}
                    >
                      {course.code} — {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Group */}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Student Group
              </label>

              <Select
                value={
                  sectionForm.student_group_id
                    ? String(sectionForm.student_group_id)
                    : ''
                }
                onValueChange={(value) =>
                  setSectionForm((current) => ({
                    ...current,
                    student_group_id: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student group" />
                </SelectTrigger>

                <SelectContent>
                  {dataset.groups.map((group) => (
                    <SelectItem
                      key={group.id}
                      value={String(group.id)}
                    >
                      {group.code} — {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lecturer */}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Lecturer
              </label>

              <Select
                value={
                  sectionForm.lecturer_id
                    ? String(sectionForm.lecturer_id)
                    : ''
                }
                onValueChange={(value) =>
                  setSectionForm((current) => ({
                    ...current,
                    lecturer_id: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>

                <SelectContent>
                  {dataset.staff.map(
                    (staff: StaffMember) => (
                      <SelectItem
                        key={staff.id}
                        value={String(staff.id)}
                      >
                        {staff.title} {staff.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Section Name */}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Section Name
              </label>

              <input
                value={sectionForm.name}
                onChange={(e) =>
                  setSectionForm((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g. AI Section A"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Students */}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Students
              </label>

              <input
                type="number"
                min={1}
                value={sectionForm.students}
                onChange={(e) =>
                  setSectionForm((current) => ({
                    ...current,
                    students: Number(e.target.value),
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Duration */}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Duration
              </label>

              <Select
                value={String(sectionForm.duration)}
                onValueChange={(value) =>
                  setSectionForm((current) => ({
                    ...current,
                    duration: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="1">
                    1 hour
                  </SelectItem>

                  <SelectItem value="2">
                    2 hours
                  </SelectItem>

                  <SelectItem value="3">
                    3 hours
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Room Type */}

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Room Type
              </label>

              <Select
                value={sectionForm.room_type_required}
                onValueChange={(value) =>
                  setSectionForm((current) => ({
                    ...current,
                    room_type_required: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Lecture">
                    Lecture
                  </SelectItem>

                  <SelectItem value="Lab">
                    Lab
                  </SelectItem>

                  <SelectItem value="Computer Lab">
                    Computer Lab
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {sectionMessage && (
            <div className="mt-4 rounded-md border px-3 py-2 text-sm">
              {sectionMessage}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddSection(false)
                setSectionMessage('')
              }}
              disabled={creatingSection}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleCreateSection}
              disabled={creatingSection}
            >
              {creatingSection
                ? 'Creating...'
                : 'Create Section'}
            </Button>

          </div>
        </Card>
      )}

      {/* ---------------- Unallocated tray ---------------- */}

      {unallocated.length > 0 &&
        viewMode !== 'room' && (
          <Card className="flex flex-wrap items-center gap-2 border-dashed border-amber-300 bg-amber-50/60 p-2.5">

            <span className="text-xs font-semibold text-amber-800">
              Needs a room:
            </span>

            {unallocated.map((a) => {
              const sec =
                lookups!.sectionsById.get(a.sectionId)

              const course = sec
                ? lookups!.coursesById.get(sec.courseId)
                : null

              return (
                <Button
                  key={a.id}
                  size="sm"
                  variant="outline"
                  className="h-7 border-amber-400 text-xs"
                  onClick={() =>
                    openRecommendDrawer({
                      sectionId: a.sectionId,
                      allocationId: a.id,
                    })
                  }
                >
                  {course?.code} · {sec?.code} —{' '}
                  {DAY_LABELS[a.day]}{' '}
                  {slotLabel(
                    a.slot,
                    sec?.slotCount ?? 1,
                  )}

                  <span className="text-amber-600">
                    Find room →
                  </span>
                </Button>
              )
            })}
          </Card>
        )}

      {/* ---------------- Grid ---------------- */}

      <Card className="sch-scroll min-h-0 flex-1 overflow-auto p-0">

        <div
          style={{
            minWidth:
              208 +
              DAYS.length *
                SLOTS.length *
                CELL_MIN,
          }}
        >

          {/* Day header */}

          <div className="sticky top-0 z-20 flex border-b bg-card">

            <div
              className={cn(
                RESOURCE_COL,
                'sticky left-0 z-30 border-r bg-card px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
              )}
            >
              {viewMode === 'room'
                ? 'Room'
                : viewMode === 'lecturer'
                  ? 'Lecturer'
                  : 'Group'}
            </div>

            {DAYS.map((day) => (
              <div
                key={day}
                className="flex-1 border-r last:border-r-0"
                style={{
                  minWidth:
                    SLOTS.length * CELL_MIN,
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${SLOTS.length}, minmax(${CELL_MIN}px, 1fr))`,
                  }}
                >
                  {SLOTS.map((slot) => (
                    <div
                      key={`${day}-${slot}`}
                      className="border-b px-2 pb-1 pt-2 text-center last:border-r-0"
                    >
                      <div className="text-[11px] font-semibold text-foreground">
                        {slot === 0
                          ? DAY_LABELS[day]
                          : ''}
                      </div>

                      <div className="text-[10px] text-muted-foreground">
                        {String(
                          DAY_START_HOUR + slot,
                        ).padStart(2, '0')}
                        :00
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
              No{' '}
              {viewMode === 'room'
                ? 'rooms'
                : viewMode === 'lecturer'
                  ? 'lecturers'
                  : 'groups'}{' '}
              match the current filter.
            </p>
          )}

          {rows.map((row) => (
            <div
              key={row.id}
              className="flex border-b last:border-b-0"
            >

              <div
                className={cn(
                  RESOURCE_COL,
                  'sticky left-0 z-10 border-r bg-card px-3 py-2',
                )}
              >
                <div className="truncate text-xs font-semibold">
                  {row.label}
                </div>

                <div className="truncate text-[11px] text-muted-foreground">
                  {row.sublabel}
                </div>
              </div>

              {DAYS.map((day) => (
                <div
                  key={day}
                  className="flex min-w-fit flex-1 border-r last:border-r-0"
                >
                  {SLOTS.map((slot) => {

                    const starting =
                      row.allocations.filter(
                        (a) =>
                          a.day === day &&
                          a.slot === slot,
                      )

                    const room =
                      viewMode === 'room'
                        ? lookups!.roomsById.get(row.id)
                        : undefined

                    const closure =
                      room?.closures.find(
                        (c) =>
                          c.day === day &&
                          c.slot === slot,
                      )

                    return (
                      <div
                        key={`${day}-${slot}`}
                        className={cn(
                          'flex min-h-[64px] flex-1 flex-col gap-0.5 border-l border-dashed border-slate-200 p-0.5 first:border-l-0',
                          closure &&
                            'bg-slate-200/70',
                          slot === 0 &&
                            'border-l-0',
                        )}
                        style={{
                          minWidth: CELL_MIN,
                        }}
                      >

                        {closure && (
                          <div
                            className="px-1 pt-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500"
                            title={closure.reason}
                          >
                            Closed
                          </div>
                        )}

                        {starting.map((a) => {

                          const sec =
                            lookups!.sectionsById.get(
                              a.sectionId,
                            )

                          if (!sec) return null

                          const course =
                            lookups!.coursesById.get(
                              sec.courseId,
                            )

                          const group =
                            lookups!.groupsById.get(
                              sec.groupId,
                            )

                          if (!course || !group) {
                            return null
                          }

                          const staff =
                            lookups!.staffById.get(
                              sec.staffId,
                            )

                          const aRoom = a.roomId
                            ? lookups!.roomsById.get(
                                a.roomId,
                              )
                            : null

                          return (
                            <div
                              key={a.id}
                              className="relative z-[5]"
                              style={{
                                width: `calc(${sec.slotCount * 100}% - 2px)`,
                              }}
                            >
                              <SessionCard
                                section={sec}
                                courseCode={course.code}
                                group={group}
                                staff={
                                  viewMode === 'lecturer'
                                    ? undefined
                                    : staff
                                }
                                room={aRoom}
                                hideRoomName={
                                  viewMode === 'room'
                                }
                                day={day}
                                slot={a.slot}
                                slotCount={
                                  sec.slotCount
                                }
                                conflicts={
                                  conflictsByAllocation.get(
                                    a.id,
                                  ) ?? []
                                }
                                editable={isDraft}
                                onInspect={() =>
                                  openConflictDrawer(
                                    a.id,
                                  )
                                }
                                onRecommend={() =>
                                  openRecommendDrawer({
                                    sectionId: sec.id,
                                    allocationId: a.id,
                                  })
                                }
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
  dataset: NonNullable<
    ReturnType<typeof useSchedulerData>['dataset']
  >
  roomFilter: string | 'all'
  staffFilter: string | 'all'
  groupFilter: string | 'all'
  setRoomFilter: (v: string | 'all') => void
  setStaffFilter: (v: string | 'all') => void
  setGroupFilter: (v: string | 'all') => void
}

function ResourceFilterSelect({
  viewMode,
  dataset,
  roomFilter,
  staffFilter,
  groupFilter,
  setRoomFilter,
  setStaffFilter,
  setGroupFilter,
}: ResourceFilterSelectProps) {

  if (viewMode === 'room') {
    return (
      <Select
        value={roomFilter}
        onValueChange={setRoomFilter}
      >
        <SelectTrigger
          className="w-56"
          aria-label="Room filter"
        >
          <SelectValue placeholder="All rooms" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            All rooms ({dataset.rooms.length})
          </SelectItem>

          {dataset.rooms.map((r) => (
            <SelectItem
              key={r.id}
              value={r.id}
            >
              {r.code} — {r.name} (
              {ROOM_TYPE_LABELS[r.type]},{' '}
              {r.capacity})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (viewMode === 'lecturer') {
    return (
      <Select
        value={staffFilter}
        onValueChange={setStaffFilter}
      >
        <SelectTrigger
          className="w-56"
          aria-label="Lecturer filter"
        >
          <SelectValue placeholder="All lecturers" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            All lecturers ({dataset.staff.length})
          </SelectItem>

          {dataset.staff.map(
            (s: StaffMember) => (
              <SelectItem
                key={s.id}
                value={s.id}
              >
                {s.title} {s.name} —{' '}
                {s.department}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Select
      value={groupFilter}
      onValueChange={setGroupFilter}
    >
      <SelectTrigger
        className="w-56"
        aria-label="Student group filter"
      >
        <SelectValue placeholder="All groups" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="all">
          All groups ({dataset.groups.length})
        </SelectItem>

        {dataset.groups.map(
          (g: StudentGroup) => (
            <SelectItem
              key={g.id}
              value={g.id}
            >
              {g.code} — {g.name}
            </SelectItem>
          ),
        )}
      </SelectContent>
    </Select>
  )
}