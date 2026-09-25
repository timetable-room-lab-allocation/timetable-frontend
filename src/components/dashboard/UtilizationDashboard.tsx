/* ============================================================
   UtilizationDashboard.tsx — SCH-FR-10
   KPI cards · occupancy heatmap (day × slot) · conflict mix bar chart.
   Pure CSS visualisations — no chart dependency.
   ============================================================ */

import { useMemo } from 'react'
import { AlertTriangle, Armchair, Clock, Flame, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSchedulerData } from '@/hooks/useSchedulerData'
import { CONFLICT_ICONS } from '@/components/scheduler/ConflictResolutionDrawer'
import {
  DAYS, DAY_LABELS, SLOTS, DAY_START_HOUR, CONFLICT_TYPE_LABELS,
  type ConflictType,
} from '@/types/sch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'

export default function UtilizationDashboard() {
  const { dataset, version, conflicts, lookups, isEmpty } = useSchedulerData()

  const kpis = useMemo(() => {
    if (!dataset || !version || !lookups || dataset.rooms.length === 0) return null
    const allocs = version.allocations.filter((a) => a.roomId)

    const totalRoomSlots = dataset.rooms.length * DAYS.length * SLOTS.length
    const usedSlots = allocs.reduce((sum, a) => {
      const sec = lookups.sectionsById.get(a.sectionId)
      return sum + (sec?.slotCount ?? 1)
    }, 0)
    const utilization = totalRoomSlots ? (usedSlots / totalRoomSlots) * 100 : 0

    // Peak demand: (day, slot) with the most concurrent sessions.
    const demand = new Map<string, number>()
    for (const a of version.allocations) {
      const sec = lookups.sectionsById.get(a.sectionId)
      for (let i = 0; i < (sec?.slotCount ?? 1); i++) {
        const key = `${a.day}-${a.slot + i}`
        demand.set(key, (demand.get(key) ?? 0) + 1)
      }
    }
    let peak = { key: '—', count: 0 }
    for (const [key, count] of demand) if (count > peak.count) peak = { key, count }
    const [peakDay, peakSlot] = peak.key.split('-')

    // Capacity waste: average unused-seat ratio across room allocations.
    const waste = allocs.length
      ? allocs.reduce((sum, a) => {
          const room = lookups.roomsById.get(a.roomId!)
          const sec = lookups.sectionsById.get(a.sectionId)
          if (!room || !sec) return sum
          return sum + Math.max(0, (room.capacity - sec.expectedStudents) / room.capacity)
        }, 0) / allocs.length * 100
      : 0

    const unallocated = version.allocations.filter((a) => !a.roomId).length

    // Heatmap: session count per (day, slot).
    const heat = DAYS.map((d) =>
      SLOTS.map((s) => demand.get(`${d}-${s}`) ?? 0),
    )
    const heatMax = Math.max(1, ...heat.flat())

    // Conflict mix by type.
    const byType = new Map<ConflictType, number>()
    for (const c of conflicts) byType.set(c.type, (byType.get(c.type) ?? 0) + 1)

    return { utilization, peakDay, peakSlot, peakCount: peak.count, waste, unallocated, heat, heatMax, byType }
  }, [dataset, version, conflicts, lookups])

  if (isEmpty || !dataset) {
    return (
      <EmptyState
        title="No facilities data yet"
        description="Load the seed demo dataset to see room utilization KPIs, the weekly occupancy heatmap and the conflict breakdown."
        icon={TrendingDown}
      />
    )
  }
  if (!kpis) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Select a schedule version to view utilization.</p>
  }

  const conflictTypes = [...kpis.byType.entries()].sort((a, b) => b[1] - a[1])
  const maxConflict = Math.max(1, ...conflictTypes.map(([, n]) => n))

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------- KPI cards ---------------- */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          icon={Armchair}
          label="Overall Room Utilization"
          value={`${kpis.utilization.toFixed(1)}%`}
          hint={`${version?.label ?? ''} · all rooms, Sun–Thu 08:00–16:00`}
          tone={kpis.utilization > 65 ? 'success' : kpis.utilization > 40 ? 'default' : 'warning'}
        />
        <KpiCard
          icon={Flame}
          label="Peak Demand Time"
          value={kpis.peakDay !== '—' ? `${DAY_LABELS[kpis.peakDay as (typeof DAYS)[number]]} ${String(DAY_START_HOUR + Number(kpis.peakSlot)).padStart(2, '0')}:00` : '—'}
          hint={`${kpis.peakCount} concurrent sessions`}
          tone="warning"
        />
        <KpiCard
          icon={TrendingDown}
          label="Capacity Waste"
          value={`${kpis.waste.toFixed(1)}%`}
          hint="average unused-seat ratio"
          tone={kpis.waste > 40 ? 'warning' : 'success'}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Unallocated Sessions"
          value={String(kpis.unallocated)}
          hint="sections still without a room"
          tone={kpis.unallocated > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* ---------------- Occupancy heatmap ---------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Room Occupancy Heatmap</CardTitle>
            <CardDescription>Concurrent scheduled sessions per day and hour slot ({version?.label})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1" style={{ gridTemplateColumns: `88px repeat(${SLOTS.length}, minmax(0, 1fr))` }}>
              <div />
              {SLOTS.map((s) => (
                <div key={s} className="text-center text-[10px] font-medium tabular-nums text-muted-foreground">
                  {String(DAY_START_HOUR + s).padStart(2, '0')}:00
                </div>
              ))}
              {DAYS.map((d, di) => (
                <HeatRow key={d} day={d} values={kpis.heat[di]} heatMax={kpis.heatMax} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Low</span>
              {[0.15, 0.35, 0.55, 0.75, 1].map((f) => (
                <span key={f} className="h-3 w-6 rounded-sm" style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${f * 100}%, white)` }} />
              ))}
              <span>High</span>
            </div>
          </CardContent>
        </Card>

        {/* ---------------- Conflict mix ---------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Conflict Categorisation</CardTitle>
            <CardDescription>Hard conflicts by class ({version?.label})</CardDescription>
          </CardHeader>
          <CardContent>
            {conflictTypes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Badge variant="success">Zero hard conflicts</Badge>
                <p className="text-xs text-muted-foreground">This version is publishable.</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {conflictTypes.map(([type, count]) => {
                  const Icon = CONFLICT_ICONS[type]
                  return (
                    <li key={type}>
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                        <Icon className="h-3.5 w-3.5 text-red-600" aria-hidden />
                        {CONFLICT_TYPE_LABELS[type]}
                        <span className="ml-auto tabular-nums text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${CONFLICT_TYPE_LABELS[type]}: ${count}`}>
                        <div
                          className="h-full rounded-full bg-red-500/80"
                          style={{ width: `${(count / maxConflict) * 100}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function HeatRow({ day, values, heatMax }: { day: string; values: number[]; heatMax: number }) {
  return (
    <>
      <div className="flex items-center text-xs font-medium">{DAY_LABELS[day as (typeof DAYS)[number]]}</div>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex h-9 items-center justify-center rounded-md text-[10px] font-semibold tabular-nums"
          style={{
            backgroundColor: v === 0 ? 'var(--muted)' : `color-mix(in oklab, var(--primary) ${Math.min(100, (v / heatMax) * 100)}%, white)`,
            color: v / heatMax > 0.55 ? 'white' : undefined,
          }}
          title={`${day} ${String(DAY_START_HOUR + i).padStart(2, '0')}:00 — ${v} session(s)`}
        >
          {v > 0 ? v : ''}
        </div>
      ))}
    </>
  )
}

function KpiCard({
  icon: Icon, label, value, hint, tone,
}: {
  icon: typeof Clock
  label: string
  value: string
  hint: string
  tone: 'default' | 'success' | 'warning'
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4 pt-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            tone === 'success' ? 'bg-emerald-100 text-emerald-700'
              : tone === 'warning' ? 'bg-amber-100 text-amber-700'
              : 'bg-accent text-accent-foreground',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="truncate text-2xl font-bold tabular-nums">{value}</div>
          <div className="truncate text-[11px] text-muted-foreground">{hint}</div>
        </div>
      </CardContent>
    </Card>
  )
}
