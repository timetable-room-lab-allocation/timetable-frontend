/* ============================================================
   ConflictResolutionDrawer.tsx — SCH-FR-05 + SCH-FR-06
   Right-side slide-over combining:
   1. Conflict Inspector — exact rejection reasons in plain words.
   2. Alternative Recommendation — ≥3 ranked feasible slots/rooms
      scored on Capacity Fit · Equipment Match · Staff Preference
      · Compactness, with a single-click deterministic "Apply Fix".
   ============================================================ */

import { useMemo } from 'react'
import {
  AlertTriangle, ArrowRightLeft, Ban, Boxes, CalendarClock, CheckCircle2,
  DoorClosed, FlaskConical, Gauge, Sparkles, UserRound, Users, Wrench,
} from 'lucide-react'
import { cn, slotLabel } from '@/lib/utils'
import { useApplyFix } from '@/api/client'
import { useSchedulerData } from '@/hooks/useSchedulerData'
import { useSchedulerStore } from '@/store/schedulerStore'
import { recommendAlternatives, conflictTypeHint } from '@/engine/conflicts'
import { DAY_LABELS, CONFLICT_TYPE_LABELS, ROOM_TYPE_LABELS, type AlternativeOption, type ConflictType } from '@/types/sch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody,
} from '@/components/ui/sheet'

const CONFLICT_ICONS: Record<ConflictType, typeof AlertTriangle> = {
  'room-double-booking': DoorClosed,
  'lecturer-clash': UserRound,
  'group-overlap': Users,
  'capacity-overflow': Boxes,
  'room-type-mismatch': FlaskConical,
  'missing-equipment': Wrench,
  'room-closure': Ban,
}

export default function ConflictResolutionDrawer() {
  const conflictDrawer = useSchedulerStore((s) => s.conflictDrawer)
  const recommendDrawer = useSchedulerStore((s) => s.recommendDrawer)
  const closeConflictDrawer = useSchedulerStore((s) => s.closeConflictDrawer)
  const closeRecommendDrawer = useSchedulerStore((s) => s.closeRecommendDrawer)

  const { dataset, version, conflictsByAllocation, lookups, isDraft } = useSchedulerData()
  const applyFix = useApplyFix()

  const open = conflictDrawer !== null || recommendDrawer !== null
  const allocationId = conflictDrawer?.allocationId ?? recommendDrawer?.allocationId
  const sectionId = conflictDrawer
    ? undefined
    : recommendDrawer?.sectionId

  const close = () => {
    closeConflictDrawer()
    closeRecommendDrawer()
  }

  const allocation = useMemo(
    () => version?.allocations.find((a) => a.id === allocationId) ?? null,
    [version, allocationId],
  )

  const resolvedSectionId = sectionId ?? (allocation ? dataset?.sections.find((s) => s.id === allocation.sectionId)?.id : undefined)

  const alternatives = useMemo(() => {
    if (!dataset || !version || !resolvedSectionId) return []
    return recommendAlternatives(dataset, version.allocations, resolvedSectionId, allocation?.id)
  }, [dataset, version, resolvedSectionId, allocation?.id])

  if (!dataset || !lookups || !version) return null

  const sec = resolvedSectionId ? lookups.sectionsById.get(resolvedSectionId) : undefined
  const course = sec ? lookups.coursesById.get(sec.courseId) : undefined
  const group = sec ? lookups.groupsById.get(sec.groupId) : undefined
  const staff = sec ? lookups.staffById.get(sec.staffId) : undefined
  const room = allocation?.roomId ? lookups.roomsById.get(allocation.roomId) : undefined
  const conflicts = allocation ? conflictsByAllocation.get(allocation.id) ?? [] : []

  const handleApply = (opt: AlternativeOption) => {
    if (!sec || !isDraft) return
    applyFix.mutate(
      {
        versionId: version.id,
        sectionId: sec.id,
        allocationId: allocation?.id,
        day: opt.day,
        slot: opt.slot,
        roomId: opt.roomId,
      },
      { onSuccess: close },
    )
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {conflicts.length > 0 ? (
              <><AlertTriangle className="h-4 w-4 text-red-600" /> Conflict Inspector</>
            ) : (
              <><Sparkles className="h-4 w-4 text-primary" /> Alternative Slots &amp; Rooms</>
            )}
          </SheetTitle>
          <SheetDescription>
            {course?.code} · {sec?.code} — {sec?.kind === 'practical' ? 'Practical Lab' : 'Lecture'} ·{' '}
            {group?.code} · {staff ? `${staff.title} ${staff.name}` : ''}
            {allocation && room && ` · ${DAY_LABELS[allocation.day]} ${slotLabel(allocation.slot, sec?.slotCount ?? 1)} · ${room.name}`}
            {allocation && !room && ` · ${DAY_LABELS[allocation.day]} ${slotLabel(allocation.slot, sec?.slotCount ?? 1)} · no room assigned`}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6">
          {/* ---------- Conflict Inspector (SCH-FR-05) ---------- */}
          {conflicts.length > 0 && (
            <section aria-labelledby="conflict-reasons">
              <h3 id="conflict-reasons" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                Why this placement is rejected
                <Badge variant="destructive">{conflicts.length} hard</Badge>
              </h3>
              <ul className="space-y-2">
                {conflicts.map((c) => {
                  const Icon = CONFLICT_ICONS[c.type]
                  return (
                    <li key={c.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
                        <Badge variant="destructive">{CONFLICT_TYPE_LABELS[c.type]}</Badge>
                      </div>
                      <p className="text-sm font-medium text-red-900">{c.message}</p>
                      <p className="mt-1 text-xs text-red-700/80">{conflictTypeHint(c.type)}</p>
                      {c.allocationIds.length > 1 && (
                        <p className="mt-1 text-xs text-red-700/80">
                          Involves {c.allocationIds.length} allocations — resolving either side clears the conflict.
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* ---------- Ranked alternatives (SCH-FR-06) ---------- */}
          <section aria-labelledby="alternatives">
            <h3 id="alternatives" className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <ArrowRightLeft className="h-4 w-4 text-primary" aria-hidden />
              Ranked feasible alternatives
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Deterministically scored on capacity fit, equipment match, lecturer preference and
              timetable compactness. Every “feasible” option passes all hard constraints.
            </p>

            {alternatives.length === 0 && (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No alternative slot satisfies every hard constraint right now. Try relaxing a room
                closure or lecturer availability in Master Data.
              </p>
            )}

            <ol className="space-y-3">
              {alternatives.map((opt, i) => {
                const optRoom = lookups.roomsById.get(opt.roomId)!
                return (
                  <li
                    key={`${opt.day}-${opt.slot}-${opt.roomId}`}
                    className={cn(
                      'rounded-xl border p-3 transition-shadow',
                      opt.feasible ? 'border-border bg-card shadow-sm hover:shadow-md' : 'border-dashed bg-muted/40 opacity-80',
                      i === 0 && opt.feasible && 'border-primary/50 ring-1 ring-primary/30',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {i === 0 && opt.feasible && (
                            <Badge variant="default" className="bg-primary">Best match</Badge>
                          )}
                          <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
                          {DAY_LABELS[opt.day]} · {slotLabel(opt.slot, sec?.slotCount ?? 1)}
                        </div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {optRoom.name} ({optRoom.code}) · {ROOM_TYPE_LABELS[optRoom.type]} · cap {optRoom.capacity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold',
                            opt.score.total >= 75 ? 'bg-emerald-100 text-emerald-800'
                              : opt.score.total >= 50 ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700',
                          )}
                          aria-label={`Total ranking score ${opt.score.total} of 100`}
                        >
                          <Gauge className="h-3.5 w-3.5" aria-hidden />
                          {opt.score.total}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <ScoreTag label="Capacity fit" value={opt.score.capacityFit} />
                      <ScoreTag label="Equipment" value={opt.score.equipmentMatch} />
                      <ScoreTag label="Staff pref." value={opt.score.staffPreference} />
                      <ScoreTag label="Compactness" value={opt.score.compactness} />
                      {opt.feasible ? (
                        <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Feasible</Badge>
                      ) : (
                        <Badge variant="warning">Partial — verify before applying</Badge>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant={opt.feasible ? 'default' : 'outline'}
                        disabled={!isDraft || applyFix.isPending}
                        onClick={() => handleApply(opt)}
                      >
                        <CheckCircle2 />
                        Apply Fix
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          {!isDraft && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              You are viewing the published version — switch to the draft to apply fixes.
            </p>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

function ScoreTag({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {label}
      <span className="inline-flex h-1.5 w-12 overflow-hidden rounded-full bg-slate-200" aria-hidden>
        <span
          className={cn(
            'h-full rounded-full',
            value >= 75 ? 'bg-emerald-500' : value >= 45 ? 'bg-amber-400' : 'bg-red-400',
          )}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="tabular-nums text-foreground">{value}</span>
    </span>
  )
}

export { CONFLICT_ICONS }
