import { useMemo } from 'react'

import {
  useConflicts,
  useDataset,
  useVersion,
} from '@/api/client'

import { useSchedulerStore } from '@/store/schedulerStore'

import type { Conflict } from '@/types/sch'

/**
 * Joins:
 * dataset + active version + conflicts
 * and provides lookup maps for the scheduler UI.
 */
export function useSchedulerData() {
  // ---------------------------------------------------------
  // Dataset
  // ---------------------------------------------------------

  const {
    data: dataset,
    isLoading: datasetLoading,
    isError: datasetError,
    error: datasetErrorDetails,
  } = useDataset()

  // ---------------------------------------------------------
  // Active version
  // ---------------------------------------------------------

  const activeVersionId = useSchedulerStore(
    (state) => state.activeVersionId
  )

  const {
    data: version,
    isLoading: versionLoading,
    isError: versionError,
    error: versionErrorDetails,
  } = useVersion(activeVersionId)

  // ---------------------------------------------------------
  // Conflicts
  // ---------------------------------------------------------

  const {
    data: conflictsData,
    isLoading: conflictsLoading,
    isError: conflictsError,
    error: conflictsErrorDetails,
  } = useConflicts(activeVersionId)

  // ---------------------------------------------------------
  // Lookup maps
  // ---------------------------------------------------------

  const lookups = useMemo(() => {
    if (!dataset) {
      return null
    }

    return {
      roomsById: new Map(
        dataset.rooms.map((room) => [room.id, room])
      ),

      staffById: new Map(
        dataset.staff.map((staff) => [staff.id, staff])
      ),

      sectionsById: new Map(
        dataset.sections.map((section) => [section.id, section])
      ),

      coursesById: new Map(
        dataset.courses.map((course) => [course.id, course])
      ),

      groupsById: new Map(
        dataset.groups.map((group) => [group.id, group])
      ),
    }
  }, [dataset])

  // ---------------------------------------------------------
  // Conflicts grouped by allocation
  // ---------------------------------------------------------

  const conflicts = conflictsData ?? []

  const conflictsByAllocation = useMemo(() => {
    const map = new Map<string, Conflict[]>()

    for (const conflict of conflicts) {
      for (const allocationId of conflict.allocationIds) {
        const list = map.get(allocationId) ?? []

        list.push(conflict)

        map.set(allocationId, list)
      }
    }

    return map
  }, [conflicts])

  // ---------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------

  const isDraft = version?.status === 'draft'

  const isLoading =
    datasetLoading ||
    versionLoading ||
    conflictsLoading

  const isError =
    datasetError ||
    versionError ||
    conflictsError

  const error =
    datasetErrorDetails ??
    versionErrorDetails ??
    conflictsErrorDetails ??
    null

  return {
    // Raw data
    dataset,
    version,
    conflicts,

    // Loading / errors
    datasetLoading,
    versionLoading,
    conflictsLoading,
    isLoading,

    datasetError,
    versionError,
    conflictsError,
    isError,
    error,

    // Lookups
    lookups,
    conflictsByAllocation,

    // Scheduler state
    isDraft,
    activeVersionId,

    // Dataset state
    isEmpty:
      !!dataset &&
      dataset.rooms.length === 0,
  }
}
