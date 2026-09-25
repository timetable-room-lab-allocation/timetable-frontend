/* ============================================================
   Project SCH — Domain types (BUA DevHub)
   Timetable, Room & Lab Allocation
   ============================================================ */

export type Day = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU'

export const DAYS: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU']
export const DAY_LABELS: Record<Day, string> = {
  SUN: 'Sunday', MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
}

/** Working day: 8 slots of 1h starting at 08:00 (08:00 → 16:00). */
export const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7] as const
export type Slot = (typeof SLOTS)[number]
export const DAY_START_HOUR = 8

export type RoomType = 'lecture-hall' | 'computer-lab' | 'hardware-lab' | 'seminar-room'

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  'lecture-hall': 'Lecture Hall',
  'computer-lab': 'Computer Lab',
  'hardware-lab': 'Hardware Lab',
  'seminar-room': 'Seminar Room',
}

export type EquipmentTag =
  | 'projector'
  | 'smart-board'
  | 'gpu-workstations'
  | 'networking-racks'
  | 'oscilloscopes'
  | 'soldering-stations'
  | 'robotics-kits'
  | 'microcontroller-benches'

export const EQUIPMENT_LABELS: Record<EquipmentTag, string> = {
  projector: 'Projector',
  'smart-board': 'Smart Board',
  'gpu-workstations': 'GPU Workstations',
  'networking-racks': 'Networking Racks',
  oscilloscopes: 'Oscilloscopes',
  'soldering-stations': 'Soldering Stations',
  'robotics-kits': 'Robotics Kits',
  'microcontroller-benches': 'Microcontroller Benches',
}

export interface RoomClosure {
  day: Day
  slot: Slot
  reason: string
}

export interface Room {
  id: string
  code: string          // e.g. "H-B204"
  name: string          // e.g. "Hall B · 204"
  building: string
  type: RoomType
  capacity: number
  accessible: boolean
  equipment: EquipmentTag[]
  closures: RoomClosure[]
}

export type Availability = 'preferred' | 'allowed' | 'blocked'

export interface StaffMember {
  id: string
  code: string          // e.g. "ST-07"
  name: string
  title: string         // e.g. "Dr."
  department: string
  /** availability[day][slot] */
  availability: Record<Day, Availability[]>
}

export interface Course {
  id: string
  code: string          // e.g. "CS301"
  name: string
  department: string
}

export interface StudentGroup {
  id: string
  code: string          // e.g. "AI-2"
  name: string
  program: string
  year: number
  size: number
}

export type SessionKind = 'lecture' | 'practical'

export interface Section {
  id: string
  code: string          // e.g. "CS301-L1" / "CS301-P1"
  courseId: string
  kind: SessionKind
  groupId: string       // student group attending
  staffId: string       // lecturer teaching
  expectedStudents: number
  requiredRoomType: RoomType | null  // null = any room type acceptable
  requiredEquipment: EquipmentTag[]
  slotCount: 1 | 2      // duration in 1h slots
}

/** One placement of a section on the grid. A section with slotCount 2 spans [slot, slot+2). */
export interface Allocation {
  id: string
  sectionId: string
  day: Day
  slot: Slot
  roomId: string | null // null = unallocated (still needs a room)
}

export type VersionStatus = 'draft' | 'published'

export interface ScheduleVersion {
  id: string
  label: string               // "v1.2-draft" / "v1.0"
  status: VersionStatus
  createdAt: string
  allocations: Allocation[]
}

export type ConflictType =
  | 'room-double-booking'
  | 'lecturer-clash'
  | 'group-overlap'
  | 'capacity-overflow'
  | 'room-type-mismatch'
  | 'missing-equipment'
  | 'room-closure'

export const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  'room-double-booking': 'Room double-booking',
  'lecturer-clash': 'Lecturer clash',
  'group-overlap': 'Student group overlap',
  'capacity-overflow': 'Capacity overflow',
  'room-type-mismatch': 'Room type mismatch',
  'missing-equipment': 'Missing required equipment',
  'room-closure': 'Room closure',
}

export interface Conflict {
  id: string
  type: ConflictType
  severity: 'hard'
  allocationIds: string[]
  /** Plain human sentence(s) — zero guesswork (SCH-FR-05). */
  message: string
}

export interface ScoreBreakdown {
  capacityFit: number   // 0..100
  equipmentMatch: number
  staffPreference: number
  compactness: number
  total: number
}

export interface AlternativeOption {
  day: Day
  slot: Slot
  roomId: string
  score: ScoreBreakdown
  feasible: boolean     // passes every hard constraint
}

export type Role = 'admin' | 'coordinator' | 'staff' | 'student'

export interface PublishImpact {
  movedAllocations: number
  affectedGroups: { groupId: string; groupCode: string; changes: string[] }[]
  affectedStaff: { staffId: string; staffName: string; changes: string[] }[]
}

export interface Dataset {
  rooms: Room[]
  staff: StaffMember[]
  courses: Course[]
  groups: StudentGroup[]
  sections: Section[]
  versions: ScheduleVersion[]
}
