import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import CommandPalette from '@/components/CommandPalette'
import ConflictResolutionDrawer from '@/components/scheduler/ConflictResolutionDrawer'
import SchedulerGridView from '@/components/scheduler/SchedulerGridView'
import ConflictsPanel from '@/components/scheduler/ConflictsPanel'
import VersionBar from '@/components/scheduler/VersionBar'
import RoomInventoryTable from '@/components/master/RoomInventoryTable'
import AvailabilityMatrix from '@/components/master/AvailabilityMatrix'
import UtilizationDashboard from '@/components/dashboard/UtilizationDashboard'
import PublicTimetableView from '@/components/public/PublicTimetableView'
import { useSchedulerStore } from '@/store/schedulerStore'

/* ============================================================
   Information Architecture (Project SCH)

   /                        → role-based redirect
   /admin/schedule          → VersionBar + SchedulerGridView     (SCH-FR-04/05/06/07)
   /admin/conflicts         → VersionBar + ConflictsPanel        (SCH-FR-05)
   /admin/rooms             → RoomInventoryTable                 (SCH-FR-02)
   /admin/availability      → AvailabilityMatrix                 (SCH-FR-03)
   /admin/dashboard         → UtilizationDashboard               (SCH-FR-10)
   /timetable               → PublicTimetableView                (SCH-FR-08)

   ConflictResolutionDrawer + CommandPalette live at the root so
   they can be opened from any admin page (grid, triage list).
   ============================================================ */

function RoleRedirect() {
  const role = useSchedulerStore((s) => s.role)
  return <Navigate to={role === 'admin' || role === 'coordinator' ? '/admin/schedule' : '/timetable'} replace />
}

function ScheduleBuilderPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <VersionBar />
      <div className="min-h-0 flex-1">
        <SchedulerGridView />
      </div>
    </div>
  )
}

function ConflictsPage() {
  return (
    <div className="flex flex-col gap-3">
      <VersionBar />
      <ConflictsPanel />
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<RoleRedirect />} />
          <Route path="/admin/schedule" element={<ScheduleBuilderPage />} />
          <Route path="/admin/conflicts" element={<ConflictsPage />} />
          <Route path="/admin/rooms" element={<RoomInventoryTable />} />
          <Route path="/admin/availability" element={<AvailabilityMatrix />} />
          <Route path="/admin/dashboard" element={<UtilizationDashboard />} />
          <Route path="/timetable" element={<PublicTimetableView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {/* Global overlays */}
      <ConflictResolutionDrawer />
      <CommandPalette />
    </>
  )
}
