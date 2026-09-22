import { useState } from 'react';

import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';

import DashboardContent from './components/DashboardContent';
import CoursesContent from './components/CoursesContent';
import SectionsContent from './components/SectionsContent';
import RoomsContent from './components/RoomsContent';
import StaffContent from './components/StaffContent';
import EquipmentContent from './components/EquipmentContent';
import StudentGroupsContent from './components/StudentGroupsContent';

import SupportPage from './components/SupportPage';
import AIRecommendations from './components/AIRecommendations';

import MyTimetable from './components/MyTimetable';
import MySections from './components/MySections';

import type { Role, TabId } from './types';
import type { DemoUser } from './data/demoUsers';

import {
  canAccess,
  defaultTab,
  roleLabels,
  roleTabs,
} from './utils/permissions';

const STORAGE_KEY = 'smart-timetable-auth';

interface StoredAuth {
  role: Role;
  activeTab: TabId;
  studentGroupId?: number;
  lecturerId?: number;
}

function getStoredAuth(): StoredAuth | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as StoredAuth;
  } catch (error) {
    console.error('Failed to read stored auth:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function App() {
  const storedAuth = getStoredAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(
    storedAuth !== null
  );

  const [role, setRole] = useState<Role>(
    storedAuth?.role ?? 'admin'
  );

  const [studentGroupId, setStudentGroupId] = useState<number | undefined>(
    storedAuth?.studentGroupId
  );

  const [lecturerId, setLecturerId] = useState<number | undefined>(
    storedAuth?.lecturerId
  );

  const [activeTab, setActiveTab] = useState<TabId>(
    storedAuth?.activeTab ?? 'dashboard'
  );
  

  const handleLogin = (user: DemoUser) => {
    const nextTab = defaultTab(user.role);

    const authData: StoredAuth = {
      role: user.role,
      activeTab: nextTab,
      studentGroupId: user.studentGroupId,
      lecturerId: user.lecturerId,
    };

    setRole(user.role);
    setStudentGroupId(user.studentGroupId);
    setLecturerId(user.lecturerId);
    setActiveTab(nextTab);
    setIsAuthenticated(true);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(authData)
    );
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setRole('admin');
    setStudentGroupId(undefined);
    setLecturerId(undefined);
    setActiveTab('dashboard');

    localStorage.removeItem(STORAGE_KEY);
  };

  const handleTabChange = (tab: string) => {
    const nextTab = tab as TabId;

    setActiveTab(nextTab);

    const currentAuth = getStoredAuth();

    if (currentAuth) {
      const updatedAuth: StoredAuth = {
        ...currentAuth,
        activeTab: nextTab,
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedAuth)
      );
    }
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const currentTab: TabId = canAccess(role, activeTab)
    ? activeTab
    : defaultTab(role);

  const scheduleFilter =
    role === 'lecturer'
      ? { lecturerId }
      : { studentGroupId };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        activeTab={currentTab}
        onTabChange={handleTabChange}
        onSignOut={handleSignOut}
        allowedTabs={roleTabs[role]}
        roleLabel={roleLabels[role]}
      />

      <main className="flex-1 p-8 overflow-y-auto">
        {currentTab === 'ai-recommendations' && (
          <AIRecommendations canApprove={role === 'admin'} />
        )}

        {currentTab === 'dashboard' && (
          <DashboardContent />
        )}

        {currentTab === 'courses' && (
          <CoursesContent />
        )}

        {currentTab === 'sections' && (
          <SectionsContent />
        )}

        {currentTab === 'rooms' && (
          <RoomsContent />
        )}

        {currentTab === 'staff' && (
          <StaffContent />
        )}

        {currentTab === 'equipment' && (
          <EquipmentContent />
        )}

        {currentTab === 'my-timetable' && (
          <MyTimetable filter={scheduleFilter} />
        )}

        {currentTab === 'my-sections' && (
          <MySections filter={scheduleFilter} />
        )}

        {currentTab === 'support' && (
          <SupportPage />
        )}
        {currentTab === 'student-groups' && (
        <StudentGroupsContent />
        )}
      </main>
    </div>
  );
}

export default App;
