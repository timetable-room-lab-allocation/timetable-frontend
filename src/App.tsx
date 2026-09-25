import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import LandingPage from '@/pages/LandingPage'
import LoginForm from '@/components/LoginForm'
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

import {
  getAuth,
  logout,
  type AuthUser,
} from '@/auth/auth'

type AppRole =
  | 'Admin'
  | 'Coordinator'
  | 'Lecturer'
  | 'Student'

interface ProtectedRouteProps {
  user: AuthUser
  allowedRoles: AppRole[]
  children: React.ReactNode
}

function ProtectedRoute({
  user,
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/timetable" replace />
  }

  return <>{children}</>
}

function RoleRedirect({
  user,
}: {
  user: AuthUser
}) {
  if (
    user.role === 'Admin' ||
    user.role === 'Coordinator'
  ) {
    return (
      <Navigate
        to="/admin/schedule"
        replace
      />
    )
  }

  return (
    <Navigate
      to="/timetable"
      replace
    />
  )
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
  const [user, setUser] = useState<AuthUser | null>(
    () => getAuth()
  )

  const handleLogin = (
    loggedInUser: AuthUser,
  ) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    logout()
    setUser(null)
  }

  /*
   * ================================
   * NOT AUTHENTICATED
   * ================================
   */

  if (!user) {
    return (
      <Routes>
        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={
            <LoginForm
              onLogin={handleLogin}
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    )
  }

  /*
   * ================================
   * AUTHENTICATED
   * ================================
   */

  return (
    <>
      <Routes>
        <Route
          element={
            <AppShell
              user={user}
              onLogout={handleLogout}
            />
          }
        >

          {/* Default page */}
          <Route
            index
            element={
              <RoleRedirect
                user={user}
              />
            }
          />

          {/* =================================
              ADMIN + COORDINATOR
              ================================= */}

          <Route
            path="/admin/schedule"
            element={
              <ProtectedRoute
                user={user}
                allowedRoles={[
                  'Admin',
                  'Coordinator',
                ]}
              >
                <ScheduleBuilderPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/conflicts"
            element={
              <ProtectedRoute
                user={user}
                allowedRoles={[
                  'Admin',
                  'Coordinator',
                ]}
              >
                <ConflictsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute
                user={user}
                allowedRoles={[
                  'Admin',
                  'Coordinator',
                ]}
              >
                <RoomInventoryTable />
              </ProtectedRoute>
            }
          />

          {/* =================================
              ADMIN + COORDINATOR + LECTURER
              ================================= */}

          <Route
            path="/admin/availability"
            element={
              <ProtectedRoute
                user={user}
                allowedRoles={[
                  'Admin',
                  'Coordinator',
                  'Lecturer',
                ]}
              >
                <AvailabilityMatrix />
              </ProtectedRoute>
            }
          />

          {/* =================================
              ADMIN ONLY
              ================================= */}

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute
                user={user}
                allowedRoles={[
                  'Admin',
                ]}
              >
                <UtilizationDashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================
              ALL AUTHENTICATED USERS
              ================================= */}

          <Route
            path="/timetable"
            element={
              <ProtectedRoute
                user={user}
                allowedRoles={[
                  'Admin',
                  'Coordinator',
                  'Lecturer',
                  'Student',
                ]}
              >
                <PublicTimetableView />
              </ProtectedRoute>
            }
          />

          {/* Unknown route */}
          <Route
            path="*"
            element={
              <RoleRedirect
                user={user}
              />
            }
          />
        </Route>
      </Routes>

      <ConflictResolutionDrawer />
      <CommandPalette />
    </>
  )
}