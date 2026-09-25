/* ============================================================
   VersionBar.tsx — SCH-FR-04 / SCH-FR-07 / SCH-FR-09
   Version switcher (Draft vs Published), publish gate and the
   pre-publish diff + post-publish Impact Preview modals.
   ============================================================ */

import { useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, FileDiff, Megaphone, Rocket, TriangleAlert,
} from 'lucide-react'
import { usePublishImpact, usePublishVersion } from '@/api/client'
import { useSchedulerData } from '@/hooks/useSchedulerData'
import { useSchedulerStore } from '@/store/schedulerStore'
import type { PublishImpact } from '@/types/sch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function VersionBar() {
  const { dataset, version, conflicts, isDraft, isEmpty } = useSchedulerData()
  const setActiveVersionId = useSchedulerStore((s) => s.setActiveVersionId)

  const [prePublishOpen, setPrePublishOpen] = useState(false)
  const [postPublishImpact, setPostPublishImpact] = useState<PublishImpact | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)

  const publish = usePublishVersion()
  const { data: impact } = usePublishImpact(isDraft && version ? version.id : null)

  const hardConflictCount = useMemo(
    () => new Set(conflicts.map((c) => c.id)).size,
    [conflicts],
  )

  if (isEmpty || !dataset || dataset.versions.length === 0) return null

  const publishBlocked = hardConflictCount > 0

  const handlePublish = () => {
    if (!version) return
    setPublishError(null)
    publish.mutate(version.id, {
      onSuccess: () => {
        setPrePublishOpen(false)
        if (impact) setPostPublishImpact(impact)
      },
      onError: (e: Error) => {
        setPublishError(e.message)
        setPrePublishOpen(false)
      },
    })
  }

  return (
    <>
      <Card className="flex flex-wrap items-center gap-3 p-2.5">
        {/* Version switcher */}
        <div className="flex items-center gap-2">
          <FileDiff className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Select value={version?.id ?? ''} onValueChange={setActiveVersionId}>
            <SelectTrigger className="w-44" aria-label="Schedule version">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {dataset.versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="flex items-center gap-2">
                    {v.label}
                    {v.status === 'published' ? (
                      <Badge variant="published">Published</Badge>
                    ) : (
                      <Badge variant="draft">Draft</Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conflict gate status */}
        {isDraft && (
          publishBlocked ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {hardConflictCount} hard conflict{hardConflictCount > 1 ? 's' : ''} — publishing blocked
            </Badge>
          ) : (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> All clear — ready to publish
            </Badge>
          )
        )}

        <div className="ml-auto flex items-center gap-2">
          {publishError && (
            <span className="text-xs font-medium text-red-600" role="alert">{publishError}</span>
          )}
          {isDraft && (
            publishBlocked ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled aria-disabled="true">
                      <Rocket /> Publish Version
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Resolve all {hardConflictCount} hard conflict(s) in the Schedule Builder first (SCH-FR-05 gate).
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button onClick={() => setPrePublishOpen(true)}>
                <Rocket /> Publish Version
              </Button>
            )
          )}
        </div>
      </Card>

      {/* ---------- Pre-publish confirmation (diff summary) ---------- */}
      <Dialog open={prePublishOpen} onOpenChange={setPrePublishOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Publish {version?.label.replace('-draft', '')}?</DialogTitle>
            <DialogDescription>
              Review the diff against the currently published version before notifying stakeholders.
            </DialogDescription>
          </DialogHeader>

          {impact && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <SummaryStat label="Changed sessions" value={impact.movedAllocations} />
                <SummaryStat label="Student groups affected" value={impact.affectedGroups.length} />
                <SummaryStat label="Staff affected" value={impact.affectedStaff.length} />
              </div>
              <div className="sch-scroll max-h-56 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                {impact.movedAllocations === 0 ? (
                  <p className="text-muted-foreground">No changes versus the published version.</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {impact.affectedGroups.flatMap((g) => g.changes).slice(0, 12).map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                    {impact.movedAllocations > 12 && <li>…and {impact.movedAllocations - 12} more</li>}
                  </ul>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrePublishOpen(false)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={publish.isPending}>
              <Megaphone /> {publish.isPending ? 'Publishing…' : 'Confirm & Notify Stakeholders'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Post-publish Impact Preview (SCH-FR-09) ---------- */}
      <Dialog open={postPublishImpact !== null} onOpenChange={(o) => !o && setPostPublishImpact(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Published — Impact Preview
            </DialogTitle>
            <DialogDescription>
              These stakeholders will receive change notices for the new published timetable.
            </DialogDescription>
          </DialogHeader>

          {postPublishImpact && (
            <div className="sch-scroll max-h-80 space-y-4 overflow-y-auto pr-1 text-sm">
              <section>
                <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <TriangleAlert className="h-3.5 w-3.5" /> Student groups ({postPublishImpact.affectedGroups.length})
                </h4>
                <ul className="space-y-2">
                  {postPublishImpact.affectedGroups.map((g) => (
                    <li key={g.groupId} className="rounded-lg border p-2.5">
                      <Badge variant="info">{g.groupCode}</Badge>
                      <ul className="mt-1.5 list-disc pl-4 text-xs text-muted-foreground">
                        {g.changes.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </li>
                  ))}
                  {postPublishImpact.affectedGroups.length === 0 && (
                    <li className="text-xs text-muted-foreground">None.</li>
                  )}
                </ul>
              </section>
              <section>
                <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Teaching staff ({postPublishImpact.affectedStaff.length})
                </h4>
                <ul className="space-y-2">
                  {postPublishImpact.affectedStaff.map((s) => (
                    <li key={s.staffId} className="rounded-lg border p-2.5">
                      <Badge variant="secondary">{s.staffName}</Badge>
                      <ul className="mt-1.5 list-disc pl-4 text-xs text-muted-foreground">
                        {s.changes.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </li>
                  ))}
                  {postPublishImpact.affectedStaff.length === 0 && (
                    <li className="text-xs text-muted-foreground">None.</li>
                  )}
                </ul>
              </section>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPostPublishImpact(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-lg border bg-muted/30 p-3 text-center">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}
