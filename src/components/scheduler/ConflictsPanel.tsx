/* ============================================================
   ConflictsPanel.tsx — SCH-FR-05 triage list
   All hard conflicts of the active version; click to open the
   Conflict Inspector drawer on the offending allocation.
   ============================================================ */

import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { slotLabel } from '@/lib/utils'
import { useSchedulerData } from '@/hooks/useSchedulerData'
import { useSchedulerStore } from '@/store/schedulerStore'
import { CONFLICT_ICONS } from '@/components/scheduler/ConflictResolutionDrawer'
import { DAY_LABELS, CONFLICT_TYPE_LABELS } from '@/types/sch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'

export default function ConflictsPanel() {
  const { dataset, version, conflicts, lookups, isDraft, isEmpty } = useSchedulerData()
  const openConflictDrawer = useSchedulerStore((s) => s.openConflictDrawer)
  const openRecommendDrawer = useSchedulerStore((s) => s.openRecommendDrawer)

  if (isEmpty || !dataset || !lookups) {
    return (
      <EmptyState
        title="No conflicts to review"
        description="Load the seed demo dataset — its draft version contains one scripted example of every hard-conflict class."
        icon={AlertTriangle}
      />
    )
  }

  const unallocated = version?.allocations.filter((a) => !a.roomId) ?? []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold">Conflict Triage</h1>
        {conflicts.length > 0 ? (
          <Badge variant="destructive">{conflicts.length} hard conflicts</Badge>
        ) : (
          <Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" /> All clear</Badge>
        )}
        {version && <Badge variant="secondary">{version.label}</Badge>}
      </div>

      {conflicts.length === 0 && unallocated.length === 0 && (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          This version has no hard conflicts. {isDraft && 'It can be published immediately.'}
        </Card>
      )}

      <ul className="space-y-2">
        {conflicts.map((c) => {
          const Icon = CONFLICT_ICONS[c.type]
          const primary = version?.allocations.find((a) => a.id === c.allocationIds[0])
          const sec = primary ? lookups.sectionsById.get(primary.sectionId) : undefined
          return (
            <li key={c.id}>
              <Card className="flex flex-wrap items-center gap-3 border-red-200 bg-red-50/50 p-3">
                <Icon className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
                <div className="min-w-60 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{CONFLICT_TYPE_LABELS[c.type]}</Badge>
                    {primary && (
                      <span className="text-xs text-muted-foreground">
                        {DAY_LABELS[primary.day]} {slotLabel(primary.slot, sec?.slotCount ?? 1)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-red-900">{c.message}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openConflictDrawer(c.allocationIds[0])}>
                    Inspect
                  </Button>
                  {isDraft && sec && (
                    <Button size="sm" onClick={() => openRecommendDrawer({ sectionId: sec.id, allocationId: c.allocationIds[0] })}>
                      Auto-fix
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      {unallocated.length > 0 && (
        <>
          <h2 className="mt-2 text-sm font-semibold text-amber-700">Unallocated sessions ({unallocated.length})</h2>
          <ul className="space-y-2">
            {unallocated.map((a) => {
              const sec = lookups.sectionsById.get(a.sectionId)
              const course = sec ? lookups.coursesById.get(sec.courseId) : undefined
              if (!sec) return null
              return (
                <li key={a.id}>
                  <Card className="flex flex-wrap items-center gap-3 border-dashed border-amber-300 bg-amber-50/60 p-3">
                    <Badge variant="warning">Needs room</Badge>
                    <span className="text-sm font-medium">
                      {course?.code} · {sec.code} — {DAY_LABELS[a.day]} {slotLabel(a.slot, sec.slotCount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {sec.expectedStudents} students · {sec.requiredRoomType ?? 'any room type'}
                    </span>
                    <Button
                      size="sm"
                      className="ml-auto"
                      disabled={!isDraft}
                      onClick={() => openRecommendDrawer({ sectionId: sec.id, allocationId: a.id })}
                    >
                      Find room
                    </Button>
                  </Card>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
