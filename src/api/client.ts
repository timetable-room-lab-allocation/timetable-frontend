import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Allocation,
  Availability,
  Dataset,
  Day,
  PublishImpact,
  Slot,
  Room,
  StaffMember,
  Course,
  StudentGroup,
  Section,
  ScheduleVersion,
  ScoreBreakdown,
  AlternativeOption,
  EquipmentTag,
  RoomType,
} from '@/types/sch'
import { detectConflicts } from '@/engine/conflicts'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://timetable-backend-five.vercel.app/api'

console.log('🌐 API BASE URL:', API_BASE_URL)

/* ============================================================
   API HELPERS
   ============================================================ */

type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data: T
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  const body = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null

  if (!response.ok || body?.success === false) {
    throw new Error(
      body?.message ||
        `API request failed (${response.status})`,
    )
  }

  return body?.data as T
}

async function requestRaw<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok || body?.success === false) {
    throw new Error(
      body?.message ||
        body?.error ||
        `API request failed (${response.status})`,
    )
  }

  return body as T
}

export async function testBackend() {
  return request<{
    status: string
    service: string
  }>('/health')
}

/* ============================================================
   BACKEND DTO TYPES
   ============================================================ */

interface BackendRoom {
  id: number | string
  name: string
  room_type?: string | null
  capacity?: number | null
  is_available?: number | boolean | null
  code?: string | null
  building?: string | null
  accessible?: number | boolean | null
}

export interface BackendLecturer {
  id: number | string
  user_id?: number | string | null
  name: string
  code?: string | null
  title?: string | null
  department?: string | null
}

export interface BackendCourse {
  id: number | string
  code: string
  name: string
  department?: string | null
}

export interface BackendStudentGroup {
  id: number | string
  name: string
  student_count?: number | null
  code?: string | null
  program?: string | null
  year?: number | null
}

interface BackendTimeslot {
  id: number | string
  day: string
  start_time: string
  end_time: string
}

interface BackendSection {
  id: number | string
  name: string
  students: number
  duration: number
  room_type_required?: string | null
  course_id: number | string
  course_code?: string
  course_name?: string
  student_group_id: number | string
  student_group_name?: string
  lecturer_id?: number | string | null
  lecturer_name?: string | null
}

interface BackendEquipment {
  id: number | string
  name: string
}

interface BackendAvailability {
  lecturer_id: number | string
  timeslot_id: number | string
  day: string
  start_time: string
  end_time: string
  status: 'allowed' | 'preferred' | 'blocked'
}

interface BackendAllocation {
  id: number | string
  section_id: number | string
  section_name?: string
  lecturer_id?: number | string | null
  lecturer_name?: string | null
  room_id?: number | string | null
  room_name?: string | null
  timeslot_id?: number | string | null
  day?: string
  start_time?: string
  end_time?: string
  score?: number | null
  status?: string | null
  created_at?: string
}

/* ============================================================
   NORMALIZATION HELPERS
   ============================================================ */

function toId(
  value: number | string | null | undefined,
): string {
  return String(value ?? '')
}

function normalizeDay(value: string): Day {
  const day = value.toUpperCase().slice(0, 3)

  if (
    day === 'SUN' ||
    day === 'MON' ||
    day === 'TUE' ||
    day === 'WED' ||
    day === 'THU'
  ) {
    return day
  }

  throw new Error(
    `Unsupported day returned by API: ${value}`,
  )
}

function normalizeRoomType(
  value: string | null | undefined,
): RoomType {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')

  const map: Record<string, RoomType> = {
    lecture: 'lecture-hall',
    'lecture-hall': 'lecture-hall',
    'lecture-room': 'lecture-hall',

    'computer-lab': 'computer-lab',
    'computer-laboratory': 'computer-lab',
    computerlab: 'computer-lab',

    'hardware-lab': 'hardware-lab',
    'hardware-laboratory': 'hardware-lab',
    hardwarelab: 'hardware-lab',

    'seminar-room': 'seminar-room',
    seminar: 'seminar-room',
  }

  return map[normalized] ?? 'lecture-hall'
}

function normalizeEquipment(
  name: string,
): EquipmentTag {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')

  const map: Record<string, EquipmentTag> = {
    projector: 'projector',

    'smart-board': 'smart-board',
    smartboard: 'smart-board',

    'gpu-workstations': 'gpu-workstations',
    'gpu-workstation': 'gpu-workstations',

    'networking-racks': 'networking-racks',
    'networking-rack': 'networking-racks',

    oscilloscopes: 'oscilloscopes',
    oscilloscope: 'oscilloscopes',

    'soldering-stations': 'soldering-stations',
    'soldering-station': 'soldering-stations',

    'robotics-kits': 'robotics-kits',
    'robotics-kit': 'robotics-kits',

    'microcontroller-benches':
      'microcontroller-benches',
    'microcontroller-bench':
      'microcontroller-benches',
  }

  return (
    map[normalized] ??
    (normalized as EquipmentTag)
  )
}

function getStartHour(time: string): number {
  const [hour] = time.split(':')
  return Number(hour)
}

function timeToSlot(startTime: string): Slot {
  const hour = getStartHour(startTime)
  const slot = hour - 8

  if (slot < 0 || slot > 7) {
    throw new Error(
      `Timeslot ${startTime} cannot be represented by frontend Slot`,
    )
  }

  return slot as Slot
}

function slotToHour(slot: Slot): number {
  return 8 + slot
}

/* ============================================================
   DATA ADAPTERS
   ============================================================ */

function adaptRoom(
  room: BackendRoom,
  equipment: BackendEquipment[],
): Room {
  return {
    id: toId(room.id),
    code: room.code ?? `ROOM-${room.id}`,
    name: room.name,
    building: room.building ?? '',
    type: normalizeRoomType(room.room_type),
    capacity: Number(room.capacity ?? 0),
    accessible: Boolean(room.accessible ?? false),
    equipment: equipment.map((item) =>
      normalizeEquipment(item.name),
    ),
    closures: [],
  }
}

function adaptStaff(
  lecturer: BackendLecturer,
  availability: BackendAvailability[],
  timeslots: BackendTimeslot[],
): StaffMember {
  const availabilityByDay: Record<
    Day,
    Availability[]
  > = {
    SUN: Array(8).fill('blocked'),
    MON: Array(8).fill('blocked'),
    TUE: Array(8).fill('blocked'),
    WED: Array(8).fill('blocked'),
    THU: Array(8).fill('blocked'),
  }

for (const item of availability) {
  const day = normalizeDay(item.day)

  const startHour = getStartHour(
    item.start_time,
  )

  const endHour = getStartHour(
    item.end_time,
  )

  const startSlot = startHour - 8
  const endSlot = endHour - 8

  for (
    let slot = startSlot;
    slot < endSlot;
    slot++
  ) {
    if (slot >= 0 && slot < 8) {
      availabilityByDay[day][slot] =
        item.status
    }
  }
}
  void timeslots

return {
  id: toId(lecturer.id),

  user_id:
    lecturer.user_id == null
      ? null
      : Number(lecturer.user_id),

  code:
    lecturer.code ??
    `LEC-${lecturer.id}`,

  name: lecturer.name,

  title:
    lecturer.title ?? '',

  department:
    lecturer.department ?? '',

  availability:
    availabilityByDay,
}
}

function adaptCourse(
  course: BackendCourse,
): Course {
  return {
    id: toId(course.id),
    code: course.code,
    name: course.name,
    department:
      course.department ?? '',
  }
}

function adaptGroup(
  group: BackendStudentGroup,
): StudentGroup {
  return {
    id: toId(group.id),
    code:
      group.code ??
      `GROUP-${group.id}`,
    name: group.name,
    program:
      group.program ?? '',
    year: Number(group.year ?? 0),
    size: Number(
      group.student_count ?? 0,
    ),
  }
}

function adaptSection(
  section: BackendSection,
  equipment: BackendEquipment[],
): Section {
  return {
    id: toId(section.id),
    code: section.name,
    courseId: toId(
      section.course_id,
    ),
    kind: 'lecture',
    groupId: toId(
      section.student_group_id,
    ),
    staffId: toId(
      section.lecturer_id,
    ),
    expectedStudents: Number(
      section.students ?? 0,
    ),
    requiredRoomType:
      section.room_type_required
        ? normalizeRoomType(
            section.room_type_required,
          )
        : null,
    requiredEquipment:
      equipment.map((item) =>
        normalizeEquipment(
          item.name,
        ),
      ),
    slotCount:
      Number(section.duration ?? 1) >= 2
        ? 2
        : 1,
  }
}

function adaptAllocation(
  allocation: BackendAllocation,
): Allocation {
  if (!allocation.day) {
    throw new Error(
      `Allocation ${allocation.id} is missing day`,
    )
  }

  return {
    id: toId(allocation.id),
    sectionId: toId(
      allocation.section_id,
    ),
    day: normalizeDay(
      allocation.day,
    ),
    slot: timeToSlot(
      allocation.start_time ??
        '08:00:00',
    ),
    roomId:
      allocation.room_id == null
        ? null
        : toId(allocation.room_id),
  }
}

/* ============================================================
   VERSION COMPATIBILITY
   ============================================================ */

function buildVersions(
  allocations: BackendAllocation[],
): ScheduleVersion[] {
  const validAllocations =
    allocations.filter(
      (item) =>
        item.day &&
        item.start_time,
    )

  const adapted =
    validAllocations.map(
      adaptAllocation,
    )

  const draftAllocations =
    validAllocations
      .filter(
        (item) =>
          String(
            item.status ?? '',
          ).toLowerCase() ===
          'draft',
      )
      .map(adaptAllocation)

  const publishedAllocations =
    validAllocations
      .filter(
        (item) =>
          String(
            item.status ?? '',
          ).toLowerCase() ===
          'approved',
      )
      .map(adaptAllocation)

  return [
    {
      id: 'published',
      label: 'Published',
      status: 'published',
      createdAt:
        new Date().toISOString(),
      allocations:
        publishedAllocations,
    },

    {
      id: 'draft',
      label: 'Draft',
      status: 'draft',
      createdAt:
        new Date().toISOString(),
      allocations:
        draftAllocations.length > 0
          ? draftAllocations
          : adapted,
    },
  ]
}

/* ============================================================
   FETCH DATASET
   ============================================================ */

async function fetchDataset(): Promise<Dataset> {
  console.log('🔥 fetchDataset START')

  try {
    console.log('📡 Fetching main endpoints...')

    const [
      rooms,
      lecturers,
      courses,
      groups,
      sections,
      timeslots,
      allocations,
    ] = await Promise.all([
      request<BackendRoom[]>('/rooms'),
      request<BackendLecturer[]>('/lecturers'),
      request<BackendCourse[]>('/courses'),
      request<BackendStudentGroup[]>('/student-groups'),
      request<BackendSection[]>('/sections'),
      request<BackendTimeslot[]>('/timeslots'),
      request<BackendAllocation[]>('/allocations'),
    ])

    console.log('✅ Main endpoints loaded:', {
      rooms: rooms.length,
      lecturers: lecturers.length,
      courses: courses.length,
      groups: groups.length,
      sections: sections.length,
      timeslots: timeslots.length,
      allocations: allocations.length,
    })

    console.log('📡 Fetching room equipment...')

    const roomEquipmentEntries = await Promise.all(
      rooms.map(async (room) => {
        try {
          const data =
            await request<BackendEquipment[]>(
              `/rooms/${room.id}/equipment`,
            )

          console.log(
            `✅ Room ${room.id} equipment:`,
            data,
          )

          return [
            toId(room.id),
            data,
          ] as const
        } catch (error) {
          console.error(
            `❌ Room ${room.id} equipment failed`,
            error,
          )

          throw error
        }
      }),
    )

    const roomEquipmentMap = new Map(
      roomEquipmentEntries,
    )

    console.log('📡 Fetching section equipment...')

    const sectionEquipmentEntries =
      await Promise.all(
        sections.map(async (section) => {
          try {
            const data =
              await request<BackendEquipment[]>(
                `/sections/${section.id}/equipment`,
              )

            console.log(
              `✅ Section ${section.id} equipment:`,
              data,
            )

            return [
              toId(section.id),
              data,
            ] as const
          } catch (error) {
            console.error(
              `❌ Section ${section.id} equipment failed`,
              error,
            )

            throw error
          }
        }),
      )

    const sectionEquipmentMap = new Map(
      sectionEquipmentEntries,
    )

    console.log(
      '📡 Fetching lecturer availability...',
    )

    const lecturerAvailabilityEntries =
      await Promise.all(
        lecturers.map(async (lecturer) => {
          try {
            const response =
              await requestRaw<{
                success: boolean
                availability: BackendAvailability[]
              }>(
                `/lecturer-availability/${lecturer.id}`,
              )

            console.log(
              `✅ Lecturer ${lecturer.id} availability:`,
              response.availability,
            )

            return [
              toId(lecturer.id),
              response.availability,
            ] as const
          } catch (error) {
            console.error(
              `❌ Lecturer ${lecturer.id} availability failed`,
              error,
            )

            throw error
          }
        }),
      )

    const lecturerAvailabilityMap = new Map(
      lecturerAvailabilityEntries,
    )

    console.log('🔄 Adapting dataset...')

    const adaptedRooms = rooms.map((room) =>
      adaptRoom(
        room,
        roomEquipmentMap.get(
          toId(room.id),
        ) ?? [],
      ),
    )

    const adaptedStaff = lecturers.map(
      (lecturer) =>
        adaptStaff(
          lecturer,
          lecturerAvailabilityMap.get(
            toId(lecturer.id),
          ) ?? [],
          timeslots,
        ),
    )

    const adaptedCourses =
      courses.map(adaptCourse)

    const adaptedGroups =
      groups.map(adaptGroup)

    const adaptedSections =
      sections.map((section) =>
        adaptSection(
          section,
          sectionEquipmentMap.get(
            toId(section.id),
          ) ?? [],
        ),
      )

    const versions =
      buildVersions(
        allocations,
      )

    const dataset: Dataset = {
      rooms: adaptedRooms,
      staff: adaptedStaff,
      courses: adaptedCourses,
      groups: adaptedGroups,
      sections: adaptedSections,
      versions,
    }

    console.log(
      '🎉 DATASET READY:',
      {
        rooms:
          dataset.rooms.length,
        staff:
          dataset.staff.length,
        courses:
          dataset.courses.length,
        groups:
          dataset.groups.length,
        sections:
          dataset.sections.length,
        versions:
          dataset.versions.length,
      },
    )

    return dataset
  } catch (error) {
    console.error(
      '💥 fetchDataset FAILED:',
      error,
    )

    throw error
  }
}

/* ============================================================
   QUERY KEYS
   ============================================================ */

export const dbKeys = {
  all: ['sch-db'] as const,

  dataset: () =>
    [...dbKeys.all, 'dataset'] as const,

  version: (
    id: string | null,
  ) =>
    [
      ...dbKeys.all,
      'version',
      id,
    ] as const,

  conflicts: (
    id: string | null,
  ) =>
    [
      ...dbKeys.all,
      'conflicts',
      id,
    ] as const,

  impact: (
    id: string | null,
  ) =>
    [
      ...dbKeys.all,
      'impact',
      id,
    ] as const,
}

/* ============================================================
   SEED STATUS
   ============================================================ */

export function isSeeded(): boolean {
  return true
}

/* ============================================================
   DATASET QUERY
   ============================================================ */

export function useDataset() {
  return useQuery({
    queryKey: dbKeys.dataset(),
    queryFn: fetchDataset,
    staleTime: 5 * 60 * 1000,
  })
}

/* ============================================================
   VERSION QUERY
   ============================================================ */

export function useVersion(
  versionId: string | null,
) {
  const datasetQuery = useDataset()

  const data =
    versionId && datasetQuery.data
      ? datasetQuery.data.versions.find(
          (version) =>
            version.id === versionId,
        ) ?? null
      : null

  return {
    ...datasetQuery,
    data,
  }
}

/* ============================================================
   CONFLICTS
   ============================================================ */

export function useConflicts(
  versionId: string | null,
) {
  const datasetQuery = useDataset()

  const data =
    versionId && datasetQuery.data
      ? (() => {
          const version =
            datasetQuery.data.versions.find(
              (item) =>
                item.id === versionId,
            )

          if (!version) {
            return []
          }

          return detectConflicts(
            datasetQuery.data,
            version.allocations,
          )
        })()
      : []

  return {
    ...datasetQuery,
    data,
  }
}

/* ============================================================
   PUBLISH IMPACT
   ============================================================ */

export function usePublishImpact(
  draftId: string | null,
) {
  return useQuery({
    queryKey:
      dbKeys.impact(draftId),

    queryFn: async (): Promise<
      PublishImpact | null
    > => {
      if (!draftId) {
        return null
      }

      const dataset =
        await fetchDataset()

      const draft =
        dataset.versions.find(
          (version) =>
            version.id === draftId,
        )

      const published =
        dataset.versions.find(
          (version) =>
            version.status ===
            'published',
        )

      if (!draft) {
        return null
      }

      return computeImpact(
        dataset,
        draft.allocations,
        published?.allocations ?? [],
      )
    },

    enabled:
      draftId !== null,
  })
}

function computeImpact(
  dataset: Dataset,
  draft: Allocation[],
  published: Allocation[],
): PublishImpact {
  const pubBySection =
    new Map(
      published.map((item) => [
        item.sectionId,
        item,
      ]),
    )

  const impact: PublishImpact = {
    movedAllocations: 0,
    affectedGroups: [],
    affectedStaff: [],
  }

  const groupMap =
    new Map<string, string[]>()

  const staffMap =
    new Map<string, string[]>()

  for (const allocation of draft) {
    const section =
      dataset.sections.find(
        (item) =>
          item.id ===
          allocation.sectionId,
      )

    if (!section) {
      continue
    }

    const previous =
      pubBySection.get(
        allocation.sectionId,
      )

    const course =
      dataset.courses.find(
        (item) =>
          item.id ===
          section.courseId,
      )

    const describe = (
      item: Allocation,
    ) => {
      const room =
        item.roomId
          ? dataset.rooms.find(
              (r) =>
                r.id ===
                item.roomId,
            )
          : null

      return `${item.day} ${String(
        slotToHour(item.slot),
      ).padStart(2, '0')}:00${
        room
          ? ` · ${room.name}`
          : ' · no room'
      }`
    }

    const changed =
      !previous ||
      previous.day !==
        allocation.day ||
      previous.slot !==
        allocation.slot ||
      previous.roomId !==
        allocation.roomId

    if (!changed) {
      continue
    }

    impact.movedAllocations++

    const message = previous
      ? `${course?.code ?? ''} (${section.code}) moved from ${describe(previous)} to ${describe(allocation)}`
      : `${course?.code ?? ''} (${section.code}) newly scheduled at ${describe(allocation)}`

    const groupChanges =
      groupMap.get(
        section.groupId,
      ) ?? []

    groupChanges.push(message)

    groupMap.set(
      section.groupId,
      groupChanges,
    )

    const staffChanges =
      staffMap.get(
        section.staffId,
      ) ?? []

    staffChanges.push(message)

    staffMap.set(
      section.staffId,
      staffChanges,
    )
  }

  impact.affectedGroups =
    [...groupMap.entries()].map(
      ([groupId, changes]) => ({
        groupId,
        groupCode:
          dataset.groups.find(
            (group) =>
              group.id ===
              groupId,
          )?.code ?? groupId,
        changes,
      }),
    )

  impact.affectedStaff =
    [...staffMap.entries()].map(
      ([staffId, changes]) => {
        const staff =
          dataset.staff.find(
            (item) =>
              item.id ===
              staffId,
          )

        return {
          staffId,
          staffName: staff
            ? `${staff.title} ${staff.name}`.trim()
            : staffId,
          changes,
        }
      },
    )

  return impact
}

/* ============================================================
   APPLY FIX
   ============================================================ */

export interface ApplyFixInput {
  versionId: string
  sectionId: string
  allocationId?: string
  day: Day
  slot: Slot
  roomId: string
}

export function useApplyFix() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async (
      input: ApplyFixInput,
    ) => {
      if (
        input.versionId !==
        'draft'
      ) {
        throw new Error(
          'Only the draft version can be edited.',
        )
      }

      const timeslots =
        await request<
          BackendTimeslot[]
        >('/timeslots')

      const matchingTimeslot =
        timeslots.find(
          (timeslot) =>
            normalizeDay(
              timeslot.day,
            ) === input.day &&
            timeToSlot(
              timeslot.start_time,
            ) === input.slot,
        )

      if (!matchingTimeslot) {
        throw new Error(
          `No backend timeslot found for ${input.day} slot ${input.slot}.`,
        )
      }

      const payload = {
        section_id:
          input.sectionId,
        room_id: input.roomId,
        timeslot_id:
          matchingTimeslot.id,
        status: 'Draft',
      }

      if (input.allocationId) {
        await request(
          `/allocations/${input.allocationId}`,
          {
            method: 'PUT',
            body: JSON.stringify(
              payload,
            ),
          },
        )
      } else {
        await request(
          '/allocations',
          {
            method: 'POST',
            body: JSON.stringify(
              payload,
            ),
          },
        )
      }

      return true
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries(
        {
          queryKey: dbKeys.all,
        },
      )
    },
  })
}

/* ============================================================
   PUBLISH VERSION
   ============================================================ */

export function usePublishVersion() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async (
      draftId: string,
    ) => {
      if (draftId !== 'draft') {
        throw new Error(
          'Only the draft version can be published.',
        )
      }

      const dataset =
        await fetchDataset()

      const draft =
        dataset.versions.find(
          (version) =>
            version.id === draftId,
        )

      if (!draft) {
        throw new Error(
          'Draft version not found.',
        )
      }

      const conflicts =
        detectConflicts(
          dataset,
          draft.allocations,
        )

      if (conflicts.length > 0) {
        throw new Error(
          `Publish blocked: ${conflicts.length} hard conflict(s) must be resolved first.`,
        )
      }

      throw new Error(
        'Publishing is not available yet because the backend does not expose a schedule publish endpoint.',
      )
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries(
        {
          queryKey: dbKeys.all,
        },
      )
    },
  })
}

/* ============================================================
   LECTURER AVAILABILITY
   ============================================================ */

export interface SetAvailabilityInput {
  staffId: string
  day: Day
  slot: Slot
  value: Availability
}

export function useSetAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: SetAvailabilityInput,
    ) => {
     const timeslots = await request<BackendTimeslot[]>('/timeslots')

const availabilityResponse =
  await requestRaw<{
    success: boolean
    availability: BackendAvailability[]
  }>(
    `/lecturer-availability/${input.staffId}`,
  )

const currentAvailability =
  availabilityResponse.availability

      const targetTimeslot = timeslots.find(
        (timeslot) =>
          normalizeDay(timeslot.day) === input.day &&
          timeToSlot(timeslot.start_time) === input.slot,
      )

      if (!targetTimeslot) {
        throw new Error(
          `No backend timeslot found for ${input.day} slot ${input.slot}.`,
        )
      }

      const targetId = toId(targetTimeslot.id)

      // Keep only allowed / preferred rows.
      // Missing row means blocked.
      const nextAvailability = currentAvailability
        .filter((item) => {
          const id = toId(item.timeslot_id)

          return (
            id !== targetId &&
            (item.status === 'allowed' ||
              item.status === 'preferred')
          )
        })
        .map((item) => ({
          timeslot_id: toId(item.timeslot_id),
          status: item.status,
        }))

      // Add the new state unless the target is blocked.
      if (
        input.value === 'allowed' ||
        input.value === 'preferred'
      ) {
        nextAvailability.push({
          timeslot_id: targetId,
          status: input.value,
        })
      }

      await request(
        `/lecturer-availability/${input.staffId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            availability: nextAvailability,
          }),
        },
      )

      return true
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dbKeys.all,
      })
    },
  })
}

/* ============================================================
   AI RECOMMENDATIONS
   ============================================================ */

interface AIScore {
  capacityFit?: number
  capacity_fit?: number
  equipmentMatch?: number
  equipment_match?: number
  staffPreference?: number
  staff_preference?: number
  compactness?: number
  total?: number
}

interface AIRecommendationResponse {
  success: boolean
  section_id: number | string

  recommendations: Array<{
    room_id?: number | string
    roomId?: number | string
    room?: string
    day: string
    start?: string
    end?: string
    slot?: number
    timeslot_id?: number | string
    score?: number | AIScore
    reasons?: string[]
    feasible?: boolean
  }>

  message?: string
}

function normalizeAIScore(
  score:
    | number
    | AIScore
    | ScoreBreakdown
    | undefined,
): ScoreBreakdown {
  if (typeof score === 'number') {
    return {
      capacityFit: 0,
      equipmentMatch: 0,
      staffPreference: 0,
      compactness: 0,
      total: score,
    }
  }

  const raw =
    score as AIScore | undefined

  return {
    capacityFit: Number(
      raw?.capacityFit ??
        raw?.capacity_fit ??
        0,
    ),

    equipmentMatch: Number(
      raw?.equipmentMatch ??
        raw?.equipment_match ??
        0,
    ),

    staffPreference: Number(
      raw?.staffPreference ??
        raw?.staff_preference ??
        0,
    ),

    compactness: Number(
      raw?.compactness ?? 0,
    ),

    total: Number(
      raw?.total ?? 0,
    ),
  }
}

export async function fetchAIRecommendations(
  sectionId: string,
): Promise<
  AlternativeOption[]
> {
  const response =
    await requestRaw<
      AIRecommendationResponse
    >(
      '/ai/recommendations',
      {
        method: 'POST',
        body: JSON.stringify({
          section_id:
            Number.isNaN(
              Number(sectionId),
            )
              ? sectionId
              : Number(sectionId),
        }),
      },
    )

  return (
    response.recommendations ?? []
  ).map((item) => {
    const score =
      normalizeAIScore(
        item.score,
      )

    return {
      day: normalizeDay(
        item.day,
      ),

      slot: (
        item.slot ??
        (item.start
          ? timeToSlot(
              item.start,
            )
          : 0)
      ) as Slot,

      roomId: toId(
        item.room_id ??
          item.roomId,
      ),

      score,

      feasible:
        item.feasible ??
        true,
    }
  })
}

export function useAIRecommendations(
  sectionId: string | null,
) {
  return useQuery({
    queryKey: [
      ...dbKeys.all,
      'ai-recommendations',
      sectionId,
    ],

    queryFn: () =>
      fetchAIRecommendations(
        sectionId!,
      ),

    enabled:
      sectionId !== null &&
      sectionId !== '',
  })
}

/* ============================================================
   CRUD INPUT TYPES
   ============================================================ */

/* -------------------- ROOMS -------------------- */

export interface CreateRoomInput {
  name: string
  room_type: string
  capacity: number
  is_available?: boolean
  code?: string
  building?: string
  accessible?: boolean
}

export type UpdateRoomInput =
  Partial<CreateRoomInput>

/* -------------------- LECTURERS -------------------- */

export interface CreateLecturerInput {
  name: string
  code?: string
  title?: string
  department?: string
  user_id?: number
}

export type UpdateLecturerInput =
  Partial<CreateLecturerInput>

/* -------------------- COURSES -------------------- */

export interface CreateCourseInput {
  code: string
  name: string
  department?: string
}

export type UpdateCourseInput =
  Partial<CreateCourseInput>

/* -------------------- STUDENT GROUPS -------------------- */

export interface CreateStudentGroupInput {
  name: string
  student_count: number
  code?: string
  program?: string
  year?: number
}

export type UpdateStudentGroupInput =
  Partial<CreateStudentGroupInput>

/* -------------------- SECTIONS -------------------- */

export interface CreateSectionInput {
  course_id: number
  student_group_id: number
  lecturer_id: number
  name: string
  students: number
  duration: number
  room_type_required: string
}

export type UpdateSectionInput =
  Partial<CreateSectionInput>

/* -------------------- TIME SLOTS -------------------- */

export interface CreateTimeslotInput {
  day: string
  start_time: string
  end_time: string
}

export type UpdateTimeslotInput =
  Partial<CreateTimeslotInput>

/* ============================================================
   ROOMS CRUD
   ============================================================ */

export async function fetchRooms() {
  return request<
    BackendRoom[]
  >('/rooms')
}

export async function createRoom(
  input: CreateRoomInput,
) {
  return request<BackendRoom>(
    '/rooms',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function updateRoom(
  id: string | number,
  input: UpdateRoomInput,
) {
  return request<BackendRoom>(
    `/rooms/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export async function deleteRoom(
  id: string | number,
) {
  return request<unknown>(
    `/rooms/${id}`,
    {
      method: 'DELETE',
    },
  )
}

/* ============================================================
   LECTURERS CRUD
   ============================================================ */

export async function fetchLecturers() {
  return request<
    BackendLecturer[]
  >('/lecturers')
}

export async function createLecturer(
  input: CreateLecturerInput,
) {
  return request<BackendLecturer>(
    '/lecturers',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function updateLecturer(
  id: string | number,
  input: UpdateLecturerInput,
) {
  return request<BackendLecturer>(
    `/lecturers/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export async function deleteLecturer(
  id: string | number,
) {
  return request<unknown>(
    `/lecturers/${id}`,
    {
      method: 'DELETE',
    },
  )
}

/* ============================================================
   COURSES CRUD
   ============================================================ */

export async function fetchCourses() {
  return request<
    BackendCourse[]
  >('/courses')
}

export async function createCourse(
  input: CreateCourseInput,
) {
  return request<BackendCourse>(
    '/courses',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function updateCourse(
  id: string | number,
  input: UpdateCourseInput,
) {
  return request<BackendCourse>(
    `/courses/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export async function deleteCourse(
  id: string | number,
) {
  return request<unknown>(
    `/courses/${id}`,
    {
      method: 'DELETE',
    },
  )
}

/* ============================================================
   STUDENT GROUPS CRUD
   ============================================================ */

export async function fetchStudentGroups() {
  return request<
    BackendStudentGroup[]
  >('/student-groups')
}

export async function createStudentGroup(
  input: CreateStudentGroupInput,
) {
  return request<BackendStudentGroup>(
    '/student-groups',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function updateStudentGroup(
  id: string | number,
  input: UpdateStudentGroupInput,
) {
  return request<BackendStudentGroup>(
    `/student-groups/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export async function deleteStudentGroup(
  id: string | number,
) {
  return request<unknown>(
    `/student-groups/${id}`,
    {
      method: 'DELETE',
    },
  )
}

/* ============================================================
   SECTIONS CRUD
   ============================================================ */

export async function fetchSections() {
  return request<
    BackendSection[]
  >('/sections')
}

export async function createSection(
  input: CreateSectionInput,
) {
  return request<BackendSection>(
    '/sections',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function updateSection(
  id: string | number,
  input: UpdateSectionInput,
) {
  return request<BackendSection>(
    `/sections/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export async function deleteSection(
  id: string | number,
) {
  return request<unknown>(
    `/sections/${id}`,
    {
      method: 'DELETE',
    },
  )
}

/* ============================================================
   TIME SLOTS CRUD
   ============================================================ */

export async function fetchTimeslots() {
  return request<
    BackendTimeslot[]
  >('/timeslots')
}

export async function createTimeslot(
  input: CreateTimeslotInput,
) {
  return request<BackendTimeslot>(
    '/timeslots',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

export async function updateTimeslot(
  id: string | number,
  input: UpdateTimeslotInput,
) {
  return request<BackendTimeslot>(
    `/timeslots/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
}

export async function deleteTimeslot(
  id: string | number,
) {
  return request<unknown>(
    `/timeslots/${id}`,
    {
      method: 'DELETE',
    },
  )
}

/* ============================================================
   ALLOCATIONS
   ============================================================ */

export async function fetchAllocations() {
  return request<
    BackendAllocation[]
  >('/allocations')
}

/* ============================================================
   LEGACY COMPATIBILITY
   ============================================================ */

export function useLoadSeed() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return true
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries()
    },
  })
}

export function useResetData() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return true
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries()
    },
  })
}
