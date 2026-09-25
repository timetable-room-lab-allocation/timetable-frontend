import { useMemo, useState } from 'react'
import {
  Accessibility,
  Building2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import {
  createRoom,
  deleteRoom,
  updateRoom,
  useDataset,
  dbKeys,
  type CreateRoomInput,
} from '@/api/client'

import {
  EQUIPMENT_LABELS,
  ROOM_TYPE_LABELS,
  type EquipmentTag,
  type RoomType,
} from '@/types/sch'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { EmptyState } from '@/components/EmptyState'

const ROOM_TYPE_BADGE: Record<
  RoomType,
  'default' | 'info' | 'practical' | 'secondary'
> = {
  'lecture-hall': 'default',
  'computer-lab': 'info',
  'hardware-lab': 'practical',
  'seminar-room': 'secondary',
}

const ROOM_TYPE_API_VALUES: Record<RoomType, string> = {
  'lecture-hall': 'Lecture',
  'computer-lab': 'Computer Lab',
  'hardware-lab': 'Hardware Lab',
  'seminar-room': 'Seminar Room',
}

interface RoomFormState {
  name: string
  room_type: RoomType
  capacity: string
  is_available: boolean
}

const EMPTY_FORM: RoomFormState = {
  name: '',
  room_type: 'lecture-hall',
  capacity: '',
  is_available: true,
}

export default function RoomInventoryTable() {
  const { data: dataset } = useDataset()
  const queryClient = useQueryClient()

  const [building, setBuilding] = useState<string>('all')
  const [type, setType] = useState<string>('all')
  const [minCapacity, setMinCapacity] = useState(0)
  const [accessibleOnly, setAccessibleOnly] = useState(false)
  const [equipment, setEquipment] = useState<EquipmentTag[]>([])
  const [search, setSearch] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [form, setForm] = useState<RoomFormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const buildings = useMemo(
    () =>
      [...new Set((dataset?.rooms ?? []).map((r) => r.building))]
        .filter(Boolean)
        .sort(),
    [dataset],
  )

  const rooms = useMemo(() => {
    if (!dataset) return []

    const q = search.trim().toLowerCase()

    return dataset.rooms.filter((r) => {
      if (building !== 'all' && r.building !== building) return false
      if (type !== 'all' && r.type !== type) return false
      if (r.capacity < minCapacity) return false
      if (accessibleOnly && !r.accessible) return false

      if (equipment.some((e) => !r.equipment.includes(e))) {
        return false
      }

      if (
        q &&
        !`${r.name} ${r.code} ${r.building}`
          .toLowerCase()
          .includes(q)
      ) {
        return false
      }

      return true
    })
  }, [
    dataset,
    building,
    type,
    minCapacity,
    accessibleOnly,
    equipment,
    search,
  ])

  const toggleEquipment = (tag: EquipmentTag) => {
    setEquipment((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag],
    )
  }

  const openAddForm = () => {
    setEditingRoomId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (room: (typeof rooms)[number]) => {
    setEditingRoomId(String(room.id))

    setForm({
      name: room.name,
      room_type: room.type,
      capacity: String(room.capacity),
      is_available: true,
    })

    setError(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (isSaving) return

    setIsFormOpen(false)
    setEditingRoomId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      setError('Room name is required.')
      return
    }

    const capacity = Number(form.capacity)

    if (!Number.isFinite(capacity) || capacity <= 0) {
      setError('Capacity must be greater than 0.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const payload: CreateRoomInput = {
        name: form.name.trim(),
        room_type: ROOM_TYPE_API_VALUES[form.room_type],
        capacity,
        is_available: form.is_available,
      }

      if (editingRoomId) {
        await updateRoom(editingRoomId, payload)
      } else {
        await createRoom(payload)
      }

      await queryClient.invalidateQueries({
        queryKey: dbKeys.dataset(),
      })

      setIsFormOpen(false)
      setEditingRoomId(null)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save room.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (
    roomId: string,
    roomName: string,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${roomName}"?`,
    )

    if (!confirmed) return

    setDeletingRoomId(roomId)
    setError(null)

    try {
      await deleteRoom(roomId)

      await queryClient.invalidateQueries({
        queryKey: dbKeys.dataset(),
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete room.',
      )
    } finally {
      setDeletingRoomId(null)
    }
  }

  if (!dataset) {
    return (
      <EmptyState
        title="Loading rooms"
        description="Loading the room & lab inventory..."
        icon={Building2}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Room & Lab Inventory
          </h2>

          <p className="text-sm text-muted-foreground">
            Manage rooms, labs, capacity and availability.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded p-1 hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card className="flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-44 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms…"
            aria-label="Search rooms"
            className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Select
          value={building}
          onValueChange={setBuilding}
        >
          <SelectTrigger
            className="w-44"
            aria-label="Building filter"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All buildings
            </SelectItem>

            {buildings.map((b) => (
              <SelectItem
                key={b}
                value={b}
              >
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={type}
          onValueChange={setType}
        >
          <SelectTrigger
            className="w-44"
            aria-label="Room type filter"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All types
            </SelectItem>

            {(Object.keys(
              ROOM_TYPE_LABELS,
            ) as RoomType[]).map((t) => (
              <SelectItem
                key={t}
                value={t}
              >
                {ROOM_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(minCapacity)}
          onValueChange={(v) =>
            setMinCapacity(Number(v))
          }
        >
          <SelectTrigger
            className="w-40"
            aria-label="Minimum capacity"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {[0, 20, 30, 45, 60, 90, 120].map(
              (c) => (
                <SelectItem
                  key={c}
                  value={String(c)}
                >
                  {c === 0
                    ? 'Any capacity'
                    : `≥ ${c} seats`}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        <button
          type="button"
          role="switch"
          aria-checked={accessibleOnly}
          onClick={() =>
            setAccessibleOnly((v) => !v)
          }
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium shadow-sm transition-colors',
            accessibleOnly
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-card hover:bg-accent',
          )}
        >
          <Accessibility className="h-4 w-4" />
          Accessible only
        </button>
      </Card>

      <Card className="flex flex-wrap items-center gap-1.5 p-2.5">
        <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Wrench className="h-3.5 w-3.5" />
          Equipment:
        </span>

        {(Object.keys(
          EQUIPMENT_LABELS,
        ) as EquipmentTag[]).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() =>
              toggleEquipment(tag)
            }
            aria-pressed={equipment.includes(tag)}
          >
            <Badge
              variant={
                equipment.includes(tag)
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer font-medium hover:bg-accent"
            >
              {EQUIPMENT_LABELS[tag]}
            </Badge>
          </button>
        ))}

        {equipment.length > 0 && (
          <button
            type="button"
            className="ml-1 text-xs text-primary underline-offset-2 hover:underline"
            onClick={() => setEquipment([])}
          >
            clear
          </button>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">
                Capacity
              </TableHead>
              <TableHead className="text-center">
                Accessible
              </TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Closures</TableHead>
              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">
                  {r.code}
                </TableCell>

                <TableCell className="font-medium">
                  {r.name}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {r.building}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={ROOM_TYPE_BADGE[r.type]}
                  >
                    {ROOM_TYPE_LABELS[r.type]}
                  </Badge>
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {r.capacity}
                </TableCell>

                <TableCell className="text-center">
                  {r.accessible ? (
                    <Accessibility
                      className="mx-auto h-4 w-4 text-emerald-600"
                      aria-label="Accessible"
                    />
                  ) : (
                    <span
                      className="text-muted-foreground"
                      aria-label="Not accessible"
                    >
                      —
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex max-w-64 flex-wrap gap-1">
                    {r.equipment.map((e) => (
                      <Badge
                        key={e}
                        variant="secondary"
                        className="font-normal"
                      >
                        {EQUIPMENT_LABELS[e]}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                <TableCell>
                  {r.closures.length === 0 ? (
                    <span className="text-muted-foreground">
                      —
                    </span>
                  ) : (
                    <div className="flex flex-col gap-0.5 text-xs">
                      {r.closures.map((c, i) => (
                        <Badge
                          key={i}
                          variant="warning"
                          className="w-fit font-normal"
                        >
                          {c.day}{' '}
                          {String(8 + c.slot).padStart(
                            2,
                            '0',
                          )}
                          :00 · {c.reason}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(r)
                      }
                      disabled={
                        deletingRoomId ===
                        String(r.id)
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                      title="Edit room"
                      aria-label={`Edit ${r.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          String(r.id),
                          r.name,
                        )
                      }
                      disabled={
                        deletingRoomId ===
                        String(r.id)
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-card text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      title="Delete room"
                      aria-label={`Delete ${r.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {rooms.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="p-8 text-center text-muted-foreground"
                >
                  {dataset.rooms.length === 0
                    ? 'No rooms registered yet.'
                    : 'No rooms match the current filters.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <p className="text-xs text-muted-foreground">
        {rooms.length} of {dataset.rooms.length} rooms shown
      </p>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-form-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3
                  id="room-form-title"
                  className="text-lg font-semibold"
                >
                  {editingRoomId
                    ? 'Edit Room'
                    : 'Add Room'}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {editingRoomId
                    ? 'Update room information.'
                    : 'Add a new room to the inventory.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="room-name"
                  className="text-sm font-medium"
                >
                  Room Name
                </label>

                <input
                  id="room-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Room 4"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="room-type"
                  className="text-sm font-medium"
                >
                  Room Type
                </label>

                <select
                  id="room-type"
                  value={form.room_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      room_type:
                        e.target.value as RoomType,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {(Object.keys(
                    ROOM_TYPE_LABELS,
                  ) as RoomType[]).map((roomType) => (
                    <option
                      key={roomType}
                      value={roomType}
                    >
                      {ROOM_TYPE_LABELS[roomType]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="room-capacity"
                  className="text-sm font-medium"
                >
                  Capacity
                </label>

                <input
                  id="room-capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      capacity: e.target.value,
                    }))
                  }
                  placeholder="50"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_available:
                        e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />

                <div>
                  <div className="text-sm font-medium">
                    Room available
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Allow this room to be used for allocations.
                  </div>
                </div>
              </label>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="h-9 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving
                    ? 'Saving...'
                    : editingRoomId
                      ? 'Save Changes'
                      : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
