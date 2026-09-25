/* ============================================================
   AvailabilityMatrix.tsx — SCH-FR-03

   Lecturer Management + Weekly Availability

   Features:
   - View all teaching staff
   - Search lecturers
   - Add / Edit / Delete lecturer
   - Availability summary per lecturer
   - Weekly Allowed / Preferred / Blocked matrix
   - Click a cell to cycle:
       Allowed → Preferred → Blocked → Allowed
   ============================================================ */

import {
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react'
import {
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import {
  createLecturer,
  dbKeys,
  deleteLecturer,
  updateLecturer,
  useDataset,
  useSetAvailability,
  type CreateLecturerInput,
} from '@/api/client'
import { useSchedulerStore } from '@/store/schedulerStore'
import {
  DAYS,
  DAY_LABELS,
  DAY_START_HOUR,
  SLOTS,
  type Availability,
} from '@/types/sch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/EmptyState'

const NEXT: Record<Availability, Availability> = {
  allowed: 'preferred',
  preferred: 'blocked',
  blocked: 'allowed',
}

const CELL_STYLE: Record<Availability, string> = {
  allowed: 'bg-card hover:bg-accent',
  preferred:
    'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
  blocked:
    'bg-red-100 text-red-900 hover:bg-red-200',
}

const EMPTY_FORM = {
  name: '',
  code: '',
  title: '',
  department: '',
  user_id: '',
}

type LecturerFormState = typeof EMPTY_FORM

export default function AvailabilityMatrix() {
  const { data: dataset } = useDataset()
  const setAvailability = useSetAvailability()
  const queryClient = useQueryClient()

  const role = useSchedulerStore((state) => state.role)
  const editable =
    role === 'admin' || role === 'coordinator'

  const [staffId, setStaffId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAllStaff, setShowAllStaff] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] =
    useState<LecturerFormState>(EMPTY_FORM)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const staff = dataset?.staff ?? []

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return staff

    return staff.filter((member) => {
      const values = [
        member.name,
        member.code,
        member.title,
        member.department,
      ]

      return values.some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(query),
      )
    })
  }, [staff, search])

  const active =
    staff.find((member) => member.id === staffId) ??
    staff[0]

  function getAvailabilityStats(
    lecturer: (typeof staff)[number],
  ) {
    const values = DAYS.flatMap(
      (day) => lecturer.availability[day],
    )

    return {
      allowed: values.filter(
        (value) => value === 'allowed',
      ).length,

      preferred: values.filter(
        (value) => value === 'preferred',
      ).length,

      blocked: values.filter(
        (value) => value === 'blocked',
      ).length,
    }
  }

  function selectLecturer(id: string) {
    setStaffId(id)
    setShowAllStaff(false)
  }

  function openAddForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEditForm(
    lecturer: (typeof staff)[number],
  ) {
    setEditingId(lecturer.id)

    setForm({
      name: lecturer.name ?? '',
      code: lecturer.code ?? '',
      title: lecturer.title ?? '',
      department: lecturer.department ?? '',
      user_id: '',
    })

    setFormOpen(true)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!form.name.trim()) {
      window.alert('Lecturer name is required.')
      return
    }

    setSaving(true)

    try {
      const payload: CreateLecturerInput = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        title: form.title.trim() || undefined,
        department:
          form.department.trim() || undefined,
        ...(form.user_id.trim()
          ? { user_id: Number(form.user_id) }
          : {}),
      }

      if (editingId) {
        await updateLecturer(editingId, payload)
      } else {
        const created =
          await createLecturer(payload)

        if (created?.id !== undefined) {
          setStaffId(String(created.id))
        }
      }

      await queryClient.invalidateQueries({
        queryKey: dbKeys.dataset(),
      })

      setFormOpen(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Failed to save lecturer.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(
    lecturer: (typeof staff)[number],
  ) {
    const confirmed = window.confirm(
      `Delete lecturer "${lecturer.name}"?\n\nThis action cannot be undone.`,
    )

    if (!confirmed) return

    setDeleting(true)

    try {
      await deleteLecturer(lecturer.id)

      await queryClient.invalidateQueries({
        queryKey: dbKeys.dataset(),
      })

      if (staffId === lecturer.id) {
        setStaffId(null)
        setShowAllStaff(true)
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete lecturer.',
      )
    } finally {
      setDeleting(false)
    }
  }

  if (!dataset) {
    return (
      <EmptyState
        title="Loading teaching staff"
        description="Loading lecturers and their availability."
        icon={Users}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Lecturer Availability
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage teaching staff and their weekly
            availability preferences.
          </p>
        </div>

        {editable && (
          <Button onClick={openAddForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lecturer
          </Button>
        )}
      </div>

      {/* ======================================================
          STAFF SUMMARY
          ====================================================== */}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={Users}
          label="Teaching Staff"
          value={staff.length}
          description="Total lecturers"
        />

        <SummaryCard
          icon={Check}
          label="Allowed Slots"
          value={staff.reduce(
            (total, lecturer) =>
              total +
              getAvailabilityStats(lecturer).allowed,
            0,
          )}
          description="Across all lecturers"
        />

        <SummaryCard
          icon={Heart}
          label="Preferred Slots"
          value={staff.reduce(
            (total, lecturer) =>
              total +
              getAvailabilityStats(lecturer).preferred,
            0,
          )}
          description="Across all lecturers"
        />

        <SummaryCard
          icon={Ban}
          label="Blocked Slots"
          value={staff.reduce(
            (total, lecturer) =>
              total +
              getAvailabilityStats(lecturer).blocked,
            0,
          )}
          description="Across all lecturers"
        />
      </div>

      {/* ======================================================
          LECTURER LIST
          ====================================================== */}

      <Card>
        <div className="border-b p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">
                Teaching Staff
              </h2>

              <p className="text-sm text-muted-foreground">
                Select a lecturer to manage their
                availability.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search lecturers..."
                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No teaching staff yet"
              description="Add a lecturer to start managing availability."
              icon={UserRound}
            />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-8 text-center">
            <UserRound className="mx-auto h-10 w-10 text-muted-foreground" />

            <p className="mt-3 font-medium">
              No lecturers found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Try another search term.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStaff.map((lecturer) => {
              const stats =
                getAvailabilityStats(lecturer)

              const selected =
                active?.id === lecturer.id

              return (
                <button
                  key={lecturer.id}
                  type="button"
                  onClick={() =>
                    selectLecturer(lecturer.id)
                  }
                  className={cn(
                    'group relative rounded-xl border p-4 text-left transition-all',
                    'hover:border-primary/50 hover:shadow-sm',
                    selected &&
                      'border-primary bg-primary/[0.03] ring-1 ring-primary/20',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {lecturer.title
                            ? `${lecturer.title} `
                            : ''}
                          {lecturer.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {lecturer.code ||
                            'No lecturer code'}
                        </p>
                      </div>
                    </div>

                    {selected && (
                      <Badge variant="secondary">
                        Selected
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="truncate text-sm">
                      {lecturer.department ||
                        'No department assigned'}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <AvailabilityStat
                      value={stats.allowed}
                      label="Allowed"
                      className="bg-muted"
                    />

                    <AvailabilityStat
                      value={stats.preferred}
                      label="Preferred"
                      className="bg-emerald-50 text-emerald-800"
                    />

                    <AvailabilityStat
                      value={stats.blocked}
                      label="Blocked"
                      className="bg-red-50 text-red-800"
                    />
                  </div>

                  {editable && (
                    <div
                      className="mt-4 flex gap-2"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          openEditForm(lecturer)
                        }
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={deleting}
                        onClick={() =>
                          handleDelete(lecturer)
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {filteredStaff.length > 0 && (
          <div className="border-t px-4 py-3">
            <button
              type="button"
              onClick={() =>
                setShowAllStaff((current) => !current)
              }
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {showAllStaff ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide lecturer list
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show lecturer list
                </>
              )}
            </button>
          </div>
        )}
      </Card>

      {/* ======================================================
          SELECTED LECTURER
          ====================================================== */}

      {active && (
        <Card>
          <div className="border-b p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-6 w-6" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {active.title
                        ? `${active.title} `
                        : ''}
                      {active.name}
                    </h2>

                    {active.code && (
                      <Badge variant="outline">
                        {active.code}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {active.department ||
                      'No department assigned'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <AvailabilityBadge
                  icon={Check}
                  label="Allowed"
                  value={
                    getAvailabilityStats(active)
                      .allowed
                  }
                  className="bg-muted"
                />

                <AvailabilityBadge
                  icon={Heart}
                  label="Preferred"
                  value={
                    getAvailabilityStats(active)
                      .preferred
                  }
                  className="bg-emerald-100 text-emerald-900"
                />

                <AvailabilityBadge
                  icon={Ban}
                  label="Blocked"
                  value={
                    getAvailabilityStats(active)
                      .blocked
                  }
                  className="bg-red-100 text-red-900"
                />
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">
                  Weekly Availability
                </h3>

                <p className="text-xs text-muted-foreground">
                  Click a cell to cycle Allowed → Preferred
                  → Blocked.
                </p>
              </div>

              <Select
                value={active.id}
                onValueChange={selectLecturer}
              >
                <SelectTrigger
                  className="w-full sm:w-72"
                  aria-label="Select lecturer"
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                    >
                      {member.title
                        ? `${member.title} `
                        : ''}
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="grid gap-1 overflow-x-auto"
              style={{
                gridTemplateColumns: `72px repeat(${DAYS.length}, minmax(100px, 1fr))`,
              }}
              role="grid"
              aria-label={`Weekly availability for ${active.name}`}
            >
              <div />

              {DAYS.map((day) => (
                <div
                  key={day}
                  className="rounded-md bg-muted py-2 text-center text-xs font-semibold"
                  role="columnheader"
                >
                  {DAY_LABELS[day]}
                </div>
              ))}

              {SLOTS.map((slot) => (
                <SlotRow
                  key={slot}
                  slot={slot}
                  staffId={active.id}
                  availability={active.availability}
                  editable={
                    editable &&
                    !setAvailability.isPending
                  }
                />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              <LegendItem
                icon={Check}
                label="Allowed"
                className="bg-muted"
              />

              <LegendItem
                icon={Heart}
                label="Preferred"
                className="bg-emerald-100 text-emerald-900"
              />

              <LegendItem
                icon={Ban}
                label="Blocked"
                className="bg-red-100 text-red-900"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================
          LECTURER FORM
          ====================================================== */}

      {formOpen && (
        <LecturerForm
          form={form}
          setForm={setForm}
          editingId={editingId}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Users
  label: string
  value: number
  description: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>

          <p className="text-xl font-bold">
            {value}
          </p>

          <p className="text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ============================================================
   AVAILABILITY STAT
   ============================================================ */

function AvailabilityStat({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-md px-2 py-2 text-center',
        className,
      )}
    >
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-75">
        {label}
      </p>
    </div>
  )
}

/* ============================================================
   AVAILABILITY BADGE
   ============================================================ */

function AvailabilityBadge({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Check
  label: string
  value: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {value} {label}
    </span>
  )
}

/* ============================================================
   LEGEND ITEM
   ============================================================ */

function LegendItem({
  icon: Icon,
  label,
  className,
}: {
  icon: typeof Check
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

/* ============================================================
   LECTURER FORM
   ============================================================ */

function LecturerForm({
  form,
  setForm,
  editingId,
  saving,
  onSubmit,
  onClose,
}: {
  form: LecturerFormState
  setForm: Dispatch<SetStateAction<LecturerFormState>>
  editingId: string | null
  saving: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">
              {editingId
                ? 'Edit Lecturer'
                : 'Add Lecturer'}
            </h2>

            <p className="text-sm text-muted-foreground">
              {editingId
                ? 'Update lecturer information.'
                : 'Add a new member of the teaching staff.'}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4 p-4">
            <FormField
              label="Name *"
              value={form.name}
              placeholder="e.g. Ahmed Hassan"
              required
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Code"
                value={form.code}
                placeholder="e.g. LEC001"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    code: value,
                  }))
                }
              />

              <FormField
                label="Title"
                value={form.title}
                placeholder="e.g. Dr."
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    title: value,
                  }))
                }
              />
            </div>

            <FormField
              label="Department"
              value={form.department}
              placeholder="e.g. Computer Science"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  department: value,
                }))
              }
            />

            <FormField
              label="User ID"
              type="number"
              value={form.user_id}
              placeholder="Optional"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  user_id: value,
                }))
              }
            />

            <p className="-mt-2 text-xs text-muted-foreground">
              User ID is optional and can be left empty.
            </p>
          </CardContent>

          <div className="flex justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Save Changes'
                  : 'Add Lecturer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

/* ============================================================
   FORM FIELD
   ============================================================ */

function FormField({
  label,
  value,
  placeholder,
  type = 'text',
  required = false,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  type?: string
  required?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        min={type === 'number' ? 1 : undefined}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}

/* ============================================================
   SLOT ROW
   ============================================================ */

function SlotRow({
  slot,
  staffId,
  availability,
  editable,
}: {
  slot: number
  staffId: string
  availability: Record<
    (typeof DAYS)[number],
    Availability[]
  >
  editable: boolean
}) {
  const setAvailability = useSetAvailability()

  return (
    <>
      <div
        className="flex items-center justify-end pr-2 text-[11px] font-medium tabular-nums text-muted-foreground"
        role="rowheader"
      >
        {String(
          DAY_START_HOUR + slot,
        ).padStart(2, '0')}
        :00
      </div>

      {DAYS.map((day) => {
        const value = availability[day][slot]

        return (
          <button
            key={day}
            type="button"
            role="gridcell"
            disabled={!editable}
            aria-label={`${DAY_LABELS[day]} ${String(
              DAY_START_HOUR + slot,
            ).padStart(
              2,
              '0',
            )}:00 — ${value}. Click to change.`}
            onClick={() =>
              setAvailability.mutate({
                staffId,
                day,
                slot:
                  slot as (typeof SLOTS)[number],
                value: NEXT[value],
              })
            }
            className={cn(
              'h-10 rounded-md border text-[10px] font-semibold uppercase tracking-wide transition-colors',
              CELL_STYLE[value],
              editable
                ? 'cursor-pointer'
                : 'cursor-default',
              editable &&
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {value === 'blocked'
              ? 'Blocked'
              : value === 'preferred'
                ? 'Preferred'
                : ''}
          </button>
        )
      })}
    </>
  )
}
