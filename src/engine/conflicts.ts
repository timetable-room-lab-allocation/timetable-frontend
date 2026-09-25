/* ============================================================
   SCH deterministic conflict & recommendation engine
   Pure functions — same input always yields same output.
   ============================================================ */

import {
  DAYS, SLOTS,
  CONFLICT_TYPE_LABELS,
  type Allocation, type Conflict, type ConflictType, type Dataset, type Day,
  type Room, type Section, type Slot, type StaffMember, type AlternativeOption,
} from '@/types/sch'
import { slotLabel } from '@/lib/utils'

export function occupiedSlots(slot: Slot, slotCount: number): Slot[] {
  const out: Slot[] = []
  for (let i = 0; i < slotCount; i++) out.push((slot + i) as Slot)
  return out
}

export function daySlotLabel(day: Day, slot: number, count = 1): string {
  return `${day} ${slotLabel(slot, count)}`
}

interface Resolved {
  rooms: Map<string, Room>
  staff: Map<string, StaffMember>
  sections: Map<string, Section>
  courses: Map<string, string> // courseId -> code
  groups: Map<string, string>  // groupId -> code
}

function resolve(dataset: Dataset): Resolved {
  return {
    rooms: new Map(dataset.rooms.map((r) => [r.id, r])),
    staff: new Map(dataset.staff.map((s) => [s.id, s])),
    sections: new Map(dataset.sections.map((s) => [s.id, s])),
    courses: new Map(dataset.courses.map((c) => [c.id, c.code])),
    groups: new Map(dataset.groups.map((g) => [g.id, g.code])),
  }
}

function overlaps(aSlot: Slot, aCount: number, bSlot: Slot, bCount: number): boolean {
  return aSlot < bSlot + bCount && bSlot < aSlot + aCount
}

function roomLabel(r: Room): string {
  return `${r.name} (${r.code})`
}

function staffLabel(s: StaffMember): string {
  return `${s.title} ${s.name}`
}

/**
 * Detect every hard conflict in a set of allocations.
 * Deterministic: allocations are processed in id order, conflicts emitted in a
 * stable sequence keyed by sorted allocation id pairs.
 */
export function detectConflicts(dataset: Dataset, allocations: Allocation[]): Conflict[] {
  const r = resolve(dataset)
  const sorted = [...allocations].sort((a, b) => a.id.localeCompare(b.id))
  const conflicts: Conflict[] = []

  for (const alloc of sorted) {
    const sec = r.sections.get(alloc.sectionId)
    if (!sec) continue
    const course = r.courses.get(sec.courseId) ?? sec.courseId
    const group = r.groups.get(sec.groupId) ?? sec.groupId

    /* --- Static room-fit conflicts ------------------------------------ */
    if (alloc.roomId) {
      const room = r.rooms.get(alloc.roomId)
      if (room) {
        if (room.capacity < sec.expectedStudents) {
          conflicts.push({
            id: `cap-${alloc.id}`,
            type: 'capacity-overflow',
            severity: 'hard',
            allocationIds: [alloc.id],
            message: `${roomLabel(room)} has capacity ${room.capacity}, but ${course} section ${sec.code} (group ${group}) requires ${sec.expectedStudents} seats.`,
          })
        }
        if (sec.requiredRoomType && room.type !== sec.requiredRoomType) {
          conflicts.push({
            id: `type-${alloc.id}`,
            type: 'room-type-mismatch',
            severity: 'hard',
            allocationIds: [alloc.id],
            message: `${course} section ${sec.code} is a ${sec.kind === 'practical' ? 'Practical Lab' : 'Lecture'} session that must run in a ${labelRoomType(sec.requiredRoomType)}, but ${roomLabel(room)} is a ${labelRoomType(room.type)}.`,
          })
        }
        const missing = sec.requiredEquipment.filter((e) => !room.equipment.includes(e))
        if (missing.length > 0) {
          conflicts.push({
            id: `eq-${alloc.id}`,
            type: 'missing-equipment',
            severity: 'hard',
            allocationIds: [alloc.id],
            message: `${roomLabel(room)} is missing required equipment: ${missing.map(labelEquipment).join(', ')} — needed by ${course} section ${sec.code}.`,
          })
        }
        const closure = room.closures.find(
          (c) => c.day === alloc.day && occupiedSlots(alloc.slot, sec.slotCount).includes(c.slot),
        )
        if (closure) {
          conflicts.push({
            id: `clo-${alloc.id}`,
            type: 'room-closure',
            severity: 'hard',
            allocationIds: [alloc.id],
            message: `${roomLabel(room)} is closed on ${daySlotLabel(alloc.day, closure.slot as number)} (${closure.reason}), overlapping ${course} section ${sec.code}.`,
          })
        }
      }
    }

    /* --- Pairwise scheduling conflicts -------------------------------- */
    for (const other of sorted) {
      if (other.id <= alloc.id) continue
      const oSec = r.sections.get(other.sectionId)
      if (!oSec || other.day !== alloc.day) continue
      if (!overlaps(alloc.slot, sec.slotCount, other.slot, oSec.slotCount)) continue

      const oCourse = r.courses.get(oSec.courseId) ?? oSec.courseId
      const when = `on ${daySlotLabel(alloc.day, alloc.slot, sec.slotCount)}`
      const pair = [alloc.id, other.id].sort()

      if (alloc.roomId && other.roomId && alloc.roomId === other.roomId) {
        const room = r.rooms.get(alloc.roomId)!
        conflicts.push({
          id: `dbl-${pair.join('-')}`,
          type: 'room-double-booking',
          severity: 'hard',
          allocationIds: pair,
          message: `${roomLabel(room)} is double-booked ${when}: ${course} (${sec.code}) and ${oCourse} (${oSec.code}) are both assigned to it.`,
        })
      }
      if (sec.staffId === oSec.staffId) {
        const st = r.staff.get(sec.staffId)
        const name = st ? staffLabel(st) : sec.staffId
        const otherRoom = other.roomId ? r.rooms.get(other.roomId) : null
        conflicts.push({
          id: `lec-${pair.join('-')}`,
          type: 'lecturer-clash',
          severity: 'hard',
          allocationIds: pair,
          message: `${name} is already booked for ${oCourse} ${otherRoom ? `in ${roomLabel(otherRoom)} ` : ''}${when}, and cannot also teach ${course} (${sec.code}).`,
        })
      }
      if (sec.groupId === oSec.groupId) {
        conflicts.push({
          id: `grp-${pair.join('-')}`,
          type: 'group-overlap',
          severity: 'hard',
          allocationIds: pair,
          message: `Student group ${group} has two sessions at the same time ${when}: ${course} (${sec.code}) and ${oCourse} (${oSec.code}).`,
        })
      }
    }

    /* --- Staff blocked window ------------------------------------------ */
    if (alloc.roomId || true) {
      const st = r.staff.get(sec.staffId)
      if (st) {
        const blocked = occupiedSlots(alloc.slot, sec.slotCount).some(
          (s) => st.availability[alloc.day][s] === 'blocked',
        )
        if (blocked) {
          conflicts.push({
            id: `blk-${alloc.id}`,
            type: 'lecturer-clash',
            severity: 'hard',
            allocationIds: [alloc.id],
            message: `${staffLabel(st)} has marked ${daySlotLabel(alloc.day, alloc.slot, sec.slotCount)} as unavailable, but ${course} (${sec.code}) is scheduled for them then.`,
          })
        }
      }
    }
  }

  return conflicts
}

export function labelRoomType(t: string): string {
  return t.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function labelEquipment(e: string): string {
  return e.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function conflictsForAllocation(conflicts: Conflict[], allocationId: string): Conflict[] {
  return conflicts.filter((c) => c.allocationIds.includes(allocationId))
}

/* ============================================================
   Alternative recommendation engine (SCH-FR-06)
   ============================================================ */

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n))
}

function isFeasibleRoom(
  room: Room,
  sec: Section,
  day: Day,
  slots: Slot[],
): boolean {
  if (room.capacity < sec.expectedStudents) return false
  if (sec.requiredRoomType && room.type !== sec.requiredRoomType) return false
  if (sec.requiredEquipment.some((e) => !room.equipment.includes(e))) return false
  if (room.closures.some((c) => c.day === day && slots.includes(c.slot))) return false
  return true
}

/**
 * Rank every (day, slot, room) triple for moving `sectionId`.
 * Feasibility = zero hard conflicts after the move (verified by re-running the
 * full deterministic detector). Ranking score = weighted sum of
 * Capacity Fit · Equipment Match · Staff Preference · Compactness.
 */
export function recommendAlternatives(
  dataset: Dataset,
  allocations: Allocation[],
  sectionId: string,
  currentAllocationId?: string,
  maxResults = 6,
): AlternativeOption[] {
  const r = resolve(dataset)
  const sec = r.sections.get(sectionId)
  if (!sec) return []

  const base = allocations.filter((a) => a.id !== currentAllocationId)
  const staff = r.staff.get(sec.staffId)

  const groupAllocs = base.filter((a) => {
    const s = r.sections.get(a.sectionId)
    return s && s.groupId === sec.groupId
  })

  const options: AlternativeOption[] = []

  for (const day of DAYS) {
    for (const slot of SLOTS) {
      const slots = occupiedSlots(slot, sec.slotCount)
      if (slots.some((s) => s > SLOTS[SLOTS.length - 1])) continue

      // Lecturer hard availability (blocked windows) — skip cheaply before
      // the expensive full-detection pass.
      const staffBlocked = staff ? slots.some((s) => staff.availability[day][s] === 'blocked') : false

      for (const room of dataset.rooms) {
        if (!isFeasibleRoom(room, sec, day, slots)) continue

        const candidate: Allocation = {
          id: `__cand__`,
          sectionId,
          day,
          slot,
          roomId: room.id,
        }
        // Only conflicts involving the candidate matter — the rest of the
        // schedule may already contain unrelated hard conflicts.
        const trial = detectConflicts(dataset, [...base, candidate]).filter((c) =>
          c.allocationIds.includes('__cand__'),
        )
        const feasible = !staffBlocked && trial.length === 0
        if (!feasible && options.filter((o) => o.feasible).length >= maxResults) continue

        /* --- Scoring -------------------------------------------------- */
        const wasteRatio = (room.capacity - sec.expectedStudents) / Math.max(room.capacity, 1)
        const capacityFit = clamp(Math.round(100 - wasteRatio * 160))

        const requiredMatched = sec.requiredEquipment.every((e) => room.equipment.includes(e))
        const extras = room.equipment.length - sec.requiredEquipment.length
        const equipmentMatch = clamp((requiredMatched ? 80 : 0) + Math.max(0, 20 - extras * 5))

        const pref = staff ? staff.availability[day][slot] : 'allowed'
        const staffPreference = pref === 'preferred' ? 100 : pref === 'allowed' ? 60 : 0

        // Compactness: reward slots adjacent to the group's existing sessions,
        // penalise long idle gaps within the day.
        let compactness = 50
        const sameDay = groupAllocs.filter((a) => a.day === day)
        if (sameDay.length > 0) {
          const minGap = Math.min(
            ...sameDay.map((a) => {
              const oSec = r.sections.get(a.sectionId)!
              const dist = a.slot + oSec.slotCount <= slot
                ? slot - (a.slot + oSec.slotCount)
                : a.slot - (slot + sec.slotCount)
              return dist
            }),
          )
          compactness = clamp(100 - Math.max(0, minGap) * 25)
        }
        if (slot >= 2 && slot <= 5) compactness = clamp(compactness + 10)

        const total = Math.round(
          capacityFit * 0.35 + equipmentMatch * 0.25 + staffPreference * 0.2 + compactness * 0.2,
        )

        options.push({
          day, slot, roomId: room.id,
          score: { capacityFit, equipmentMatch, staffPreference, compactness, total },
          feasible,
        })
      }
    }
  }

  options.sort((a, b) =>
    a.feasible === b.feasible ? b.score.total - a.score.total : a.feasible ? -1 : 1,
  )

  // Deterministic tie-break, then de-duplicate near-identical rooms per slot so
  // the drawer shows varied choices.
  const seen = new Set<string>()
  const result: AlternativeOption[] = []
  for (const o of options) {
    const key = `${o.day}-${o.slot}`
    const roomsForSlot = result.filter((x) => `${x.day}-${x.slot}` === key).length
    if (roomsForSlot >= 1 && seen.has(key)) continue
    seen.add(key)
    result.push(o)
    if (result.filter((x) => x.feasible).length >= Math.max(3, maxResults)) break
  }
  return result.slice(0, Math.max(3, maxResults))
}

/** Human-readable reason a conflict type blocks publishing. */
export function conflictTypeHint(type: ConflictType): string {
  switch (type) {
    case 'room-double-booking': return 'Two sessions share one room at the same time.'
    case 'lecturer-clash': return 'A lecturer is booked twice, or teaching in a blocked window.'
    case 'group-overlap': return 'A student group has two sessions at the same time.'
    case 'capacity-overflow': return 'More students than the room can seat.'
    case 'room-type-mismatch': return 'Session needs a lab/hall type the room does not offer.'
    case 'missing-equipment': return 'Room lacks equipment the session requires.'
    case 'room-closure': return 'Room is closed during the scheduled slot.'
    default: return CONFLICT_TYPE_LABELS[type]
  }
}
