import { create } from 'zustand'
import type { Role } from '@/types/sch'

export type GridViewMode =
  | 'room'
  | 'lecturer'
  | 'group'

export interface ConflictDrawerState {
  allocationId: string
}

export interface RecommendDrawerState {
  sectionId: string
  allocationId?: string
}

interface SchedulerState {
  role: Role
  setRole: (role: Role) => void

  activeVersionId: string | null
  setActiveVersionId: (
    id: string | null,
  ) => void

  viewMode: GridViewMode
  setViewMode: (
    mode: GridViewMode,
  ) => void

  roomFilter: string | 'all'
  staffFilter: string | 'all'
  groupFilter: string | 'all'

  setRoomFilter: (
    id: string | 'all',
  ) => void

  setStaffFilter: (
    id: string | 'all',
  ) => void

  setGroupFilter: (
    id: string | 'all',
  ) => void

  conflictDrawer:
    | ConflictDrawerState
    | null

  openConflictDrawer: (
    allocationId: string,
  ) => void

  closeConflictDrawer: () => void

  recommendDrawer:
    | RecommendDrawerState
    | null

  openRecommendDrawer: (
    state: RecommendDrawerState,
  ) => void

  closeRecommendDrawer: () => void

  commandPaletteOpen: boolean

  setCommandPaletteOpen: (
    open: boolean,
  ) => void

  publicSubjectId: string | null

  setPublicSubjectId: (
    id: string | null,
  ) => void
}

export const useSchedulerStore =
  create<SchedulerState>((set) => ({
    /* ========================================================
       USER ROLE
       ======================================================== */

    role: 'admin',

    setRole: (role) =>
      set({ role }),

    /* ========================================================
       ACTIVE SCHEDULE VERSION
       ======================================================== */

    /*
     * Backend client currently exposes:
     *
     * published
     * draft
     *
     * Start the scheduler on Draft so the timetable
     * can immediately display editable allocations.
     */
    activeVersionId: 'draft',

    setActiveVersionId: (
      activeVersionId,
    ) =>
      set({
        activeVersionId,
      }),

    /* ========================================================
       GRID VIEW
       ======================================================== */

    viewMode: 'room',

    setViewMode: (
      viewMode,
    ) =>
      set({
        viewMode,
      }),

    /* ========================================================
       FILTERS
       ======================================================== */

    roomFilter: 'all',
    staffFilter: 'all',
    groupFilter: 'all',

    setRoomFilter: (
      roomFilter,
    ) =>
      set({
        roomFilter,
      }),

    setStaffFilter: (
      staffFilter,
    ) =>
      set({
        staffFilter,
      }),

    setGroupFilter: (
      groupFilter,
    ) =>
      set({
        groupFilter,
      }),

    /* ========================================================
       CONFLICT DRAWER
       ======================================================== */

    conflictDrawer: null,

    openConflictDrawer: (
      allocationId,
    ) =>
      set({
        conflictDrawer: {
          allocationId,
        },
        recommendDrawer:
          null,
      }),

    closeConflictDrawer: () =>
      set({
        conflictDrawer: null,
      }),

    /* ========================================================
       AI RECOMMENDATION DRAWER
       ======================================================== */

    recommendDrawer: null,

    openRecommendDrawer: (
      recommendDrawer,
    ) =>
      set({
        recommendDrawer,
        conflictDrawer:
          null,
      }),

    closeRecommendDrawer: () =>
      set({
        recommendDrawer: null,
      }),

    /* ========================================================
       COMMAND PALETTE
       ======================================================== */

    commandPaletteOpen: false,

    setCommandPaletteOpen: (
      commandPaletteOpen,
    ) =>
      set({
        commandPaletteOpen,
      }),

    /* ========================================================
       PUBLIC TIMETABLE
       ======================================================== */

    publicSubjectId: null,

    setPublicSubjectId: (
      publicSubjectId,
    ) =>
      set({
        publicSubjectId,
      }),
  }))
