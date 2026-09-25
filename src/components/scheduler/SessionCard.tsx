import { AlertTriangle, FlaskConical, Presentation, Sparkles, Users } from 'lucide-react'
import { cn, slotLabel } from '@/lib/utils'
import type { Conflict, Room, Section, StaffMember, StudentGroup } from '@/types/sch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SessionCardProps {
  section: Section
  courseCode: string
  group: StudentGroup
  staff?: StaffMember
  room?: Room | null
  /** Hide the room line (Room view already labels the row). */
  hideRoomName?: boolean
  day: string
  slot: number
  slotCount: number
  conflicts: Conflict[]
  editable: boolean
  onInspect?: () => void
  onRecommend?: () => void
  compact?: boolean
}

/**
 * A single scheduled session on the grid.
 * Visual language (design system):
 *  - indigo  = Lecture      (Presentation icon)
 *  - teal    = Practical Lab (FlaskConical icon)
 *  - red ring + AlertTriangle badge = deterministic hard conflict (SCH-FR-05)
 *  - dashed amber = unallocated (needs a room)
 */
export function SessionCard({
  section, courseCode, group, staff, room, hideRoomName, slot, slotCount,
  conflicts, editable, onInspect, onRecommend, compact,
}: SessionCardProps) {
  const hasConflict = conflicts.length > 0
  const isPractical = section.kind === 'practical'
  const unallocated = room === null

  return (
    <div
      role={hasConflict ? 'button' : undefined}
      tabIndex={hasConflict ? 0 : undefined}
      aria-label={
        hasConflict
          ? `${courseCode} ${section.code}, ${conflicts.length} conflict(s). Open conflict inspector.`
          : `${courseCode} ${section.code}`
      }
      onClick={hasConflict ? onInspect : undefined}
      onKeyDown={(e) => {
        if (hasConflict && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onInspect?.()
        }
      }}
      className={cn(
        'group relative flex h-full min-h-[52px] w-full cursor-default flex-col gap-0.5 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition-colors',
        isPractical
          ? 'border-teal-300 bg-teal-50 text-teal-950'
          : 'border-indigo-300 bg-indigo-50 text-indigo-950',
        hasConflict && 'cursor-pointer border-red-500 bg-red-50 ring-2 ring-red-400/70',
        unallocated && 'border-dashed border-amber-400 bg-amber-50',
        compact && 'min-h-[40px] px-1 py-0.5',
      )}
    >
      <div className="flex w-full items-center gap-1">
        {isPractical ? (
          <FlaskConical className="h-3 w-3 shrink-0 text-teal-600" aria-hidden />
        ) : (
          <Presentation className="h-3 w-3 shrink-0 text-indigo-600" aria-hidden />
        )}
        <span className="truncate font-bold">{courseCode}</span>
        <span className="truncate opacity-70">· {section.code}</span>
        {hasConflict && (
          <span
            className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full bg-red-600 px-1.5 py-px text-[10px] font-bold text-white"
            aria-hidden
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            {conflicts.length}
          </span>
        )}
      </div>

      {!compact && (
        <div className="flex items-center gap-1 truncate opacity-80">
          <Users className="h-2.5 w-2.5 shrink-0" aria-hidden />
          <span className="truncate">{group.code}</span>
          {staff && <span className="truncate">· {staff.title} {staff.name}</span>}
        </div>
      )}
      {!compact && (
        <div className="truncate opacity-70">
          {hideRoomName
            ? slotLabel(slot, slotCount)
            : room
              ? `${room.name} · ${slotLabel(slot, slotCount)}`
              : `No room · ${slotLabel(slot, slotCount)}`}
        </div>
      )}

      {editable && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Find alternative slot or room for ${courseCode} ${section.code}`}
              onClick={(e) => {
                e.stopPropagation()
                onRecommend?.()
              }}
              className={cn(
                'absolute bottom-1 right-1 hidden h-5 w-5 items-center justify-center rounded-md bg-white/80 text-primary shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:flex group-focus-within:flex',
              )}
            >
              <Sparkles className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Recommend alternative slot / room (SCH-FR-06)</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
