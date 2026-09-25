/* ============================================================
   SCH seed demo dataset — 20 rooms · 15 staff · 25 sections
   Generated deterministically; draft version contains scripted
   hard conflicts so every conflict class in SCH-FR-05 is demoable.
   ============================================================ */

import {
  DAYS, SLOTS,
  type Allocation, type Course, type Dataset, type Day, type EquipmentTag,
  type Room, type RoomType, type ScheduleVersion, type Section, type Slot,
  type StaffMember, type StudentGroup, type Availability,
} from '@/types/sch'

const allAllowed = (): Availability[] => SLOTS.map(() => 'allowed' as Availability)

const BUILDINGS = ['Main Building', 'Hall A', 'Hall B', 'Engineering Block', 'IT Complex']

function makeRooms(): Room[] {
  const rooms: Room[] = []
  const plan: [RoomType, number, number][] = [
    // [type, count, capacityBase]
    ['lecture-hall', 8, 60],
    ['computer-lab', 6, 30],
    ['hardware-lab', 4, 24],
    ['seminar-room', 2, 18],
  ]
  const eqByType: Record<RoomType, EquipmentTag[]> = {
    'lecture-hall': ['projector', 'smart-board'],
    'computer-lab': ['gpu-workstations', 'projector', 'networking-racks'],
    'hardware-lab': ['microcontroller-benches'],
    'seminar-room': ['smart-board'],
  }
  let n = 0
  for (const [type, count, capBase] of plan) {
    for (let i = 0; i < count; i++) {
      n++
      const building = BUILDINGS[n % BUILDINGS.length]
      const capacity =
        type === 'lecture-hall'
          ? i === count - 1
            ? 36                              // one small hall — used for the capacity-overflow demo
            : capBase + (i % 4) * 30          // 60, 90, 120, 150
          : capBase + (i % 3) * 6             // labs 30/36/42, hw 24/30/36
      const equipment = [...eqByType[type]]
      if (type === 'hardware-lab') {
        // Half the hardware labs have oscilloscopes, half only soldering stations.
        equipment.push(i % 2 === 0 ? 'oscilloscopes' : 'soldering-stations')
      }
      if (type === 'computer-lab' && i % 2 === 1) equipment.push('robotics-kits')
      if (type === 'lecture-hall' && i % 3 === 0) equipment.splice(1, 0, 'gpu-workstations')
      rooms.push({
        id: `room-${String(n).padStart(2, '0')}`,
        code: `${building === 'Hall A' ? 'A' : building === 'Hall B' ? 'B' : building === 'Main Building' ? 'M' : building === 'Engineering Block' ? 'E' : 'IT'}-${100 + n}`,
        name: `${building} · ${100 + n}`,
        building,
        type,
        capacity,
        accessible: n % 4 !== 0,
        equipment,
        closures:
          n === 5
            ? [{ day: 'TUE', slot: 3 as Slot, reason: 'scheduled maintenance' }]
            : n === 12
              ? [{ day: 'MON', slot: 0 as Slot, reason: 'faculty meeting' }]
              : [],
      })
    }
  }
  return rooms
}

function makeStaff(): StaffMember[] {
  const names: [string, string, string][] = [
    ['Ahmed', 'Malek', 'Computer Science'],
    ['Sara', 'Hassan', 'Computer Science'],
    ['Mohamed', 'Fahmy', 'Computer Science'],
    ['Laila', 'Ibrahim', 'Artificial Intelligence'],
    ['Omar', 'Farouk', 'Artificial Intelligence'],
    ['Nour', 'Zaki', 'Information Systems'],
    ['Hany', 'Sadek', 'Information Systems'],
    ['Mona', 'Kamel', 'Software Engineering'],
    ['Tarek', 'Mansour', 'Software Engineering'],
    ['Dina', 'Sherif', 'Computer Engineering'],
    ['Khaled', 'Nabil', 'Computer Engineering'],
    ['Rania', 'Fouad', 'Mathematics'],
    ['Youssef', 'Amin', 'Physics'],
    ['Hala', 'Samir', 'Mathematics'],
    ['Karim', 'Adel', 'Networks & Security'],
  ]
  return names.map(([first, last, dept], i) => {
    const availability = Object.fromEntries(DAYS.map((d) => [d, allAllowed()])) as Record<Day, Availability[]>
    // Every staff member blocks their last slot on two days (personal hours).
    availability[DAYS[i % DAYS.length]][7] = 'blocked'
    availability[DAYS[(i + 2) % DAYS.length]][7] = 'blocked'
    // Mark a preferred morning window.
    availability[DAYS[(i + 1) % DAYS.length]][0] = 'preferred'
    availability[DAYS[(i + 1) % DAYS.length]][1] = 'preferred'
    return {
      id: `staff-${String(i + 1).padStart(2, '0')}`,
      code: `ST-${String(i + 1).padStart(2, '0')}`,
      name: `${first} ${last}`,
      title: i % 3 === 0 ? 'Prof.' : i % 3 === 1 ? 'Dr.' : 'Eng.',
      department: dept,
      availability,
    }
  })
}

function makeCourses(): Course[] {
  const raw: [string, string, string][] = [
    ['CS201', 'Data Structures', 'Computer Science'],
    ['CS301', 'Operating Systems', 'Computer Science'],
    ['CS310', 'Computer Networks', 'Computer Science'],
    ['AI320', 'Machine Learning', 'Artificial Intelligence'],
    ['AI410', 'Deep Learning', 'Artificial Intelligence'],
    ['IS250', 'Database Systems', 'Information Systems'],
    ['SE330', 'Software Architecture', 'Software Engineering'],
    ['CE240', 'Digital Logic Design', 'Computer Engineering'],
    ['CE350', 'Embedded Systems', 'Computer Engineering'],
    ['MATH101', 'Calculus I', 'Mathematics'],
    ['PHYS110', 'Mechanics & Electronics', 'Physics'],
    ['NS420', 'Network Security', 'Networks & Security'],
  ]
  return raw.map(([code, name, dept], i) => ({ id: `course-${String(i + 1).padStart(2, '0')}`, code, name, department: dept }))
}

function makeGroups(): StudentGroup[] {
  const raw: [string, string, number, number][] = [
    ['CS-1', 'Computer Science · Y1', 1, 55],
    ['CS-2', 'Computer Science · Y2', 2, 48],
    ['CS-3', 'Computer Science · Y3', 3, 42],
    ['AI-1', 'Artificial Intelligence · Y2', 2, 38],
    ['AI-2', 'Artificial Intelligence · Y3', 3, 45],
    ['IS-2', 'Information Systems · Y2', 2, 36],
    ['SE-3', 'Software Engineering · Y3', 3, 30],
    ['CE-2', 'Computer Engineering · Y2', 2, 40],
  ]
  return raw.map(([code, name, year, size], i) => ({
    id: `group-${String(i + 1).padStart(2, '0')}`, code, name,
    program: name.split(' · ')[0], year, size,
  }))
}

interface SectionPlan {
  code: string; courseIdx: number; kind: 'lecture' | 'practical'; groupIdx: number
  staffIdx: number; expected: number; roomType: RoomType | null; equipment: EquipmentTag[]; slotCount: 1 | 2
}

const SECTION_PLANS: SectionPlan[] = [
  { code: 'CS201-L1', courseIdx: 0, kind: 'lecture', groupIdx: 1, staffIdx: 0, expected: 48, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 2 },
  { code: 'CS201-P1', courseIdx: 0, kind: 'practical', groupIdx: 1, staffIdx: 1, expected: 24, roomType: 'computer-lab', equipment: ['gpu-workstations'], slotCount: 2 },
  { code: 'CS301-L1', courseIdx: 1, kind: 'lecture', groupIdx: 2, staffIdx: 0, expected: 42, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 2 },
  { code: 'CS301-P1', courseIdx: 1, kind: 'practical', groupIdx: 2, staffIdx: 2, expected: 21, roomType: 'computer-lab', equipment: ['gpu-workstations'], slotCount: 2 },
  { code: 'CS310-L1', courseIdx: 2, kind: 'lecture', groupIdx: 2, staffIdx: 14, expected: 42, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 1 },
  { code: 'CS310-P1', courseIdx: 2, kind: 'practical', groupIdx: 2, staffIdx: 14, expected: 21, roomType: 'computer-lab', equipment: ['networking-racks'], slotCount: 2 },
  { code: 'AI320-L1', courseIdx: 3, kind: 'lecture', groupIdx: 4, staffIdx: 3, expected: 45, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 2 },
  { code: 'AI320-P1', courseIdx: 3, kind: 'practical', groupIdx: 4, staffIdx: 4, expected: 23, roomType: 'computer-lab', equipment: ['gpu-workstations'], slotCount: 2 },
  { code: 'AI410-L1', courseIdx: 4, kind: 'lecture', groupIdx: 4, staffIdx: 3, expected: 45, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 1 },
  { code: 'AI410-P1', courseIdx: 4, kind: 'practical', groupIdx: 4, staffIdx: 4, expected: 23, roomType: 'computer-lab', equipment: ['gpu-workstations'], slotCount: 2 },
  { code: 'IS250-L1', courseIdx: 5, kind: 'lecture', groupIdx: 5, staffIdx: 5, expected: 36, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 2 },
  { code: 'IS250-P1', courseIdx: 5, kind: 'practical', groupIdx: 5, staffIdx: 6, expected: 18, roomType: 'computer-lab', equipment: [], slotCount: 2 },
  { code: 'SE330-L1', courseIdx: 6, kind: 'lecture', groupIdx: 6, staffIdx: 7, expected: 30, roomType: null, equipment: ['projector'], slotCount: 1 },
  { code: 'SE330-P1', courseIdx: 6, kind: 'practical', groupIdx: 6, staffIdx: 8, expected: 15, roomType: 'computer-lab', equipment: [], slotCount: 2 },
  { code: 'CE240-L1', courseIdx: 7, kind: 'lecture', groupIdx: 7, staffIdx: 9, expected: 40, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 2 },
  { code: 'CE240-P1', courseIdx: 7, kind: 'practical', groupIdx: 7, staffIdx: 10, expected: 20, roomType: 'hardware-lab', equipment: ['oscilloscopes'], slotCount: 2 },
  { code: 'CE350-L1', courseIdx: 8, kind: 'lecture', groupIdx: 7, staffIdx: 10, expected: 40, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 1 },
  { code: 'CE350-P1', courseIdx: 8, kind: 'practical', groupIdx: 7, staffIdx: 9, expected: 20, roomType: 'hardware-lab', equipment: ['microcontroller-benches'], slotCount: 2 },
  { code: 'MATH101-L1', courseIdx: 9, kind: 'lecture', groupIdx: 0, staffIdx: 11, expected: 55, roomType: 'lecture-hall', equipment: ['smart-board'], slotCount: 2 },
  { code: 'MATH101-L2', courseIdx: 9, kind: 'lecture', groupIdx: 3, staffIdx: 13, expected: 38, roomType: 'lecture-hall', equipment: ['smart-board'], slotCount: 2 },
  { code: 'PHYS110-L1', courseIdx: 10, kind: 'lecture', groupIdx: 0, staffIdx: 12, expected: 55, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 1 },
  { code: 'PHYS110-P1', courseIdx: 10, kind: 'practical', groupIdx: 0, staffIdx: 12, expected: 28, roomType: 'hardware-lab', equipment: ['oscilloscopes'], slotCount: 2 },
  { code: 'NS420-L1', courseIdx: 11, kind: 'lecture', groupIdx: 2, staffIdx: 14, expected: 42, roomType: null, equipment: ['projector'], slotCount: 1 },
  { code: 'NS420-P1', courseIdx: 11, kind: 'practical', groupIdx: 2, staffIdx: 14, expected: 21, roomType: 'computer-lab', equipment: ['networking-racks'], slotCount: 2 },
  { code: 'AI320-L2', courseIdx: 3, kind: 'lecture', groupIdx: 3, staffIdx: 3, expected: 38, roomType: 'lecture-hall', equipment: ['projector'], slotCount: 2 },
]

function makeSections(courses: Course[]): Section[] {
  return SECTION_PLANS.map((p, i) => ({
    id: `sec-${String(i + 1).padStart(2, '0')}`,
    code: p.code,
    courseId: courses[p.courseIdx].id,
    kind: p.kind,
    groupId: `group-${String(p.groupIdx + 1).padStart(2, '0')}`,
    staffId: `staff-${String(p.staffIdx + 1).padStart(2, '0')}`,
    expectedStudents: p.expected,
    requiredRoomType: p.roomType,
    requiredEquipment: p.equipment,
    slotCount: p.slotCount,
  }))
}

/* ---------- Published v1.0 — clean greedy packing ------------------- */

function packPublished(rooms: Room[], sections: Section[]): Allocation[] {
  const allocations: Allocation[] = []
  const roomBusy = new Map<string, Set<string>>()   // roomId -> "day-slot"
  const staffBusy = new Map<string, Set<string>>()
  const groupBusy = new Map<string, Set<string>>()
  const key = (d: Day, s: number) => `${d}-${s}`

  const fits = (room: Room, sec: Section, day: Day, slot: Slot): boolean => {
    if (room.capacity < sec.expectedStudents) return false
    if (sec.requiredRoomType && room.type !== sec.requiredRoomType) return false
    if (sec.requiredEquipment.some((e) => !room.equipment.includes(e))) return false
    for (let i = 0; i < sec.slotCount; i++) {
      const s = slot + i
      if (s > 7) return false
      if (room.closures.some((c) => c.day === day && c.slot === s)) return false
      if (roomBusy.get(room.id)?.has(key(day, s))) return false
      if (staffBusy.get(sec.staffId)?.has(key(day, s))) return false
      if (groupBusy.get(sec.groupId)?.has(key(day, s))) return false
    }
    return true
  }

  sections.forEach((sec, idx) => {
    // Rotate the scan origin per section so demand spreads across the week
    // instead of piling onto Sunday.
    const dayShift = idx % DAYS.length
    const dayOrder = [...DAYS.slice(dayShift), ...DAYS.slice(0, dayShift)]
    const slotShift = idx % 6
    const slotOrder = [...SLOTS].sort(
      (a, b) => ((a - slotShift + 8) % 8) - ((b - slotShift + 8) % 8),
    )
    outer:
    for (const day of dayOrder) {
      for (const slot of slotOrder) {
        for (const room of rooms) {
          if (!fits(room, sec, day, slot)) continue
          const a: Allocation = { id: `al-p-${String(idx + 1).padStart(2, '0')}`, sectionId: sec.id, day, slot, roomId: room.id }
          allocations.push(a)
          for (let i = 0; i < sec.slotCount; i++) {
            const k = key(day, slot + i)
            ;(roomBusy.get(room.id) ?? roomBusy.set(room.id, new Set()).get(room.id)!).add(k)
            ;(staffBusy.get(sec.staffId) ?? staffBusy.set(sec.staffId, new Set()).get(sec.staffId)!).add(k)
            ;(groupBusy.get(sec.groupId) ?? groupBusy.set(sec.groupId, new Set()).get(sec.groupId)!).add(k)
          }
          break outer
        }
      }
    }
  })
  return allocations
}

/* ---------- Draft v1.2 — published plan + scripted conflicts ---------
   Each scripted edit produces (where possible) exactly one conflict class,
   so every SCH-FR-05 indicator is demoable in isolation.                  */

function makeDraftAllocations(published: Allocation[], rooms: Room[], sections: Section[]): Allocation[] {
  const draft: Allocation[] = published.map((a) => ({ ...a, id: a.id.replace('al-p-', 'al-d-') }))
  const bySection = new Map(draft.map((a) => [a.sectionId, a]))
  const sec = (code: string) => sections.find((s) => s.code === code)!
  const alloc = (code: string) => bySection.get(sec(code).id)!

  const move = (code: string, day: Day, slot: Slot, roomId?: string) => {
    const a = alloc(code)
    a.day = day; a.slot = slot
    if (roomId) a.roomId = roomId
  }

  const smallHall = rooms.find((r) => r.type === 'lecture-hall' && r.capacity === 36)!.id
  const hwLabNoScopes = rooms.find((r) => r.type === 'hardware-lab' && !r.equipment.includes('oscilloscopes'))!.id
  const bigHall = rooms.find((r) => r.type === 'lecture-hall' && r.capacity >= 90)!.id
  const hallForTue = rooms.find((r) => r.type === 'lecture-hall' && r.capacity >= 60 && r.id !== bigHall)!.id
  const room05 = rooms.find((r) => r.closures.some((c) => c.day === 'TUE'))!.id // Main Building, closed TUE slot 3

  // 1. Capacity overflow — AI320-L1 (45 students) squeezed into the 36-seat hall.
  move('AI320-L1', 'SUN', 0 as Slot, smallHall)

  // 2. Room double-booking — SE330-L1 lands on CS310-L1's exact room & time
  //    (different groups, different lecturers → single conflict class).
  const cs310 = alloc('CS310-L1')
  move('SE330-L1', cs310.day, cs310.slot, cs310.roomId!)

  // 3. Lecturer clash — Prof. Ahmed Malek cannot teach CS201-L1 and CS301-L1
  //    at the same time (different rooms & groups → single conflict class).
  const cs201 = alloc('CS201-L1')
  move('CS301-L1', cs201.day, cs201.slot, bigHall)

  // 4. Student group overlap — group AI-2 has AI410-L1 while attending AI320-P1
  //    (different staff, different rooms → single conflict class).
  const ai320p = alloc('AI320-P1')
  move('AI410-L1', ai320p.day, ai320p.slot, bigHall)

  // 5. Room closure — CE350-L1 scheduled in Main Building room during its
  //    TUE maintenance closure.
  move('CE350-L1', 'TUE', 3 as Slot, room05)

  // 6. Missing equipment — CE240-P1 needs oscilloscopes; target hardware lab
  //    only has soldering stations (type matches → single conflict class).
  move('CE240-P1', 'WED', 4 as Slot, hwLabNoScopes)

  // 7. Room type mismatch — IS250-P1 is a practical lab that requires a
  //    Computer Lab, parked in a lecture hall (capacity & equipment fine).
  move('IS250-P1', 'THU', 5 as Slot, smallHall)

  // 8. Lecturer blocked window — Eng. Karim Adel marked THU 15:00 unavailable;
  //    NS420-L1 is parked exactly there.
  move('NS420-L1', 'THU', 7 as Slot, hallForTue)

  // 9. Unallocated sessions (drives the "Unallocated Sessions" KPI + grid chips).
  alloc('SE330-P1').roomId = null
  alloc('CE350-P1').roomId = null

  return draft
}

export function buildSeedDataset(): Dataset {
  const rooms = makeRooms()
  const staff = makeStaff()
  const courses = makeCourses()
  const groups = makeGroups()
  const sections = makeSections(courses)

  const publishedAllocs = packPublished(rooms, sections)
  const draftAllocs = makeDraftAllocations(publishedAllocs, rooms, sections)

  const versions: ScheduleVersion[] = [
    {
      id: 'ver-1-0',
      label: 'v1.0',
      status: 'published',
      createdAt: '2026-08-28T09:00:00Z',
      allocations: publishedAllocs,
    },
    {
      id: 'ver-1-2-draft',
      label: 'v1.2-draft',
      status: 'draft',
      createdAt: '2026-09-20T14:30:00Z',
      allocations: draftAllocs,
    },
  ]

  return { rooms, staff, courses, groups, sections, versions }
}

export const EMPTY_DATASET: Dataset = {
  rooms: [], staff: [], courses: [], groups: [], sections: [], versions: [],
}
