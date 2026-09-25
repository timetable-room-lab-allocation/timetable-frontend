import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a slot index (e.g. 0 => "08:00") given the working day start hour. */
export function slotTime(slot: number, startHour = 8): string {
  const h = startHour + slot
  return `${String(h).padStart(2, '0')}:00`
}

export function slotRange(slot: number, startHour = 8): string {
  return `${slotTime(slot, startHour)}–${slotTime(slot + 1, startHour)}`
}

/** "09:00–11:00" for a session starting at `slot` lasting `count` hours. */
export function slotLabel(slot: number, count = 1): string {
  const f = (s: number) => `${String(DAY_START_HOUR + s).padStart(2, '0')}:00`
  return count > 1 ? `${f(slot)}–${f(slot + count)}` : `${f(slot)}–${f(slot + 1)}`
}

const DAY_START_HOUR = 8

export function downloadFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
