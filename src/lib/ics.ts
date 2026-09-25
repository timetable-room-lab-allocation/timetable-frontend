/* Minimal RFC 5545 ICS generator for personal timetables (SCH-FR-08). */

import { DAYS, DAY_START_HOUR, type Day } from '@/types/sch'

export interface IcsEvent {
  uid: string
  summary: string
  description?: string
  location?: string
  day: Day
  slot: number
  slotCount: number
  /** ISO date of the week's Sunday — events repeat weekly for 14 weeks. */
  weekStart: Date
}

const DAY_INDEX: Record<Day, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4 }

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toLocalBasic(date: Date, hour: number): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(hour)}0000`
  )
}

function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildIcs(events: IcsEvent[], calendarName: string): string {
  const now = new Date()
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BUA DevHub//Project SCH//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ]

  for (const ev of events) {
    const start = new Date(ev.weekStart)
    start.setDate(start.getDate() + DAY_INDEX[ev.day])
    const end = new Date(start)

    const dtStart = toLocalBasic(start, DAY_START_HOUR + ev.slot)
    const dtEnd = toLocalBasic(end, DAY_START_HOUR + ev.slot + ev.slotCount)

    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeText(ev.uid)}@sch.bua`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeText(ev.summary)}`,
      `RRULE:FREQ=WEEKLY;COUNT=14`,
    )
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`)
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

/** Next upcoming Sunday, used as the term's week start for exports. */
export function upcomingSunday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
  return d
}

export { DAYS }
