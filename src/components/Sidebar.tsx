import type { NavItem } from '../types';

import {
  CalendarDays,
  ListChecks,
  LayoutDashboard,
  BookOpen,
  Layers,
  Users,
  UsersRound,
  DoorOpen,
  Package,
  HelpCircle,
  Sparkles,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  allowedTabs?: string[];
  roleLabel?: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Scheduler Dashboard',
    icon: LayoutDashboard,
  },

  {
    id: 'courses',
    label: 'Courses',
    icon: BookOpen,
  },

  {
    id: 'sections',
    label: 'Sections',
    icon: Layers,
  },

  {
    id: 'student-groups',
    label: 'Student Groups',
    icon: UsersRound,
  },

  {
    id: 'staff',
    label: 'Staff',
    icon: Users,
  },

  {
    id: 'rooms',
    label: 'Rooms',
    icon: DoorOpen,
  },

  {
    id: 'equipment',
    label: 'Equipment',
    icon: Package,
  },

  {
    id: 'ai-recommendations',
    label: 'AI Recommendations',
    icon: Sparkles,
  },

  {
    id: 'my-timetable',
    label: 'My Timetable',
    icon: CalendarDays,
  },

  {
    id: 'my-sections',
    label: 'My Sections',
    icon: ListChecks,
  },

  {
    id: 'support',
    label: 'Support',
    icon: HelpCircle,
  },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  onSignOut,
  allowedTabs,
  roleLabel,
}: SidebarProps) {
  const visibleItems = allowedTabs
    ? navItems.filter((item) =>
        allowedTabs.includes(item.id)
      )
    : navItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 border-r border-slate-800">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-10 h-10 bg-white text-slate-900 rounded-xl flex items-center justify-center font-bold text-lg">
            st
          </div>

          <div>
            <h2 className="font-bold text-white text-base leading-tight">
              Smart Timetable
            </h2>

            <span className="text-xs text-slate-400">
              {roleLabel ?? 'Scheduler Dashboard'}
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() =>
                  onTabChange(item.id)
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <button
        onClick={onSignOut}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </aside>
  );
}
