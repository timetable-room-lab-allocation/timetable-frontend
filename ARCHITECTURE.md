# Project SCH — Frontend Architecture & Design System
**Timetable, Room & Lab Allocation · BUA DevHub**

Stack: React 19 + Vite 8 + TypeScript · Tailwind CSS v4 · Shadcn-style primitives (Radix) · Lucide icons · TanStack Query (server state) · Zustand (scheduler UI state) · React Router 7.

---

## 1. Information Architecture & Route Structure

```
<BrowserRouter>
 └─ <QueryClientProvider> ─ <TooltipProvider>
     └─ App.tsx
         ├─ Routes (layout: AppShell — sidebar + topbar + <Outlet/>)
         │   ├─ /                     → RoleRedirect (admin|coordinator → /admin/schedule, staff|student → /timetable)
         │   ├─ /admin/schedule       → VersionBar + SchedulerGridView          (SCH-FR-04/05/06/07)
         │   ├─ /admin/conflicts      → VersionBar + ConflictsPanel             (SCH-FR-05 triage)
         │   ├─ /admin/rooms          → RoomInventoryTable                      (SCH-FR-02)
         │   ├─ /admin/availability   → AvailabilityMatrix                      (SCH-FR-03)
         │   ├─ /admin/dashboard      → UtilizationDashboard                    (SCH-FR-10)
         │   ├─ /timetable            → PublicTimetableView                     (SCH-FR-08)
         │   └─ *                     → Navigate /
         └─ Global overlays (mounted once, openable from any admin page)
             ├─ ConflictResolutionDrawer   (Conflict Inspector + ranked alternatives)
             └─ CommandPalette             (Ctrl/Cmd+K)
```

**Role-based navigation** (AppShell sidebar):

| Role | Visible nav |
|---|---|
| Scheduler / Admin | Schedule Builder · Conflicts · Rooms & Labs · Lecturer Availability · Facilities Dashboard |
| Dept. Coordinator | same as admin (availability editing enabled; publish gated identically) |
| Lecturer / Student | My Timetable only — lands directly on the clean personal calendar |

Role switching is demoed via the "View as" selector in the sidebar footer; it also redirects to the role's home route.

**Directory layout**

```
src/
├─ types/sch.ts              # Domain model (Room, Staff, Section, Allocation, Conflict, Version…)
├─ data/seed.ts              # Deterministic seed generator: 20 rooms · 15 staff · 25 sections · 2 versions
├─ engine/conflicts.ts       # Pure deterministic conflict detection + alternative ranking (SCH-FR-05/06)
├─ api/client.ts             # In-memory mock API + TanStack Query hooks & mutations
├─ store/schedulerStore.ts   # Zustand: view mode, filters, drawers, role, active version
├─ lib/utils.ts · lib/ics.ts # cn(), slot formatting, file download · RFC 5545 ICS generator
├─ hooks/useSchedulerData.ts # Joins dataset + version + conflicts into lookup maps
└─ components/
   ├─ ui/                    # Shadcn-style primitives (button, badge, card, dialog, sheet, select, tabs, table, tooltip)
   ├─ layout/AppShell.tsx
   ├─ scheduler/             # SchedulerGridView · ConflictResolutionDrawer · VersionBar · ConflictsPanel · SessionCard
   ├─ master/                # RoomInventoryTable · AvailabilityMatrix
   ├─ dashboard/             # UtilizationDashboard (KPIs, CSS heatmap, conflict bar chart)
   ├─ public/                # PublicTimetableView (week calendar ⇄ agenda, ICS/print)
   ├─ CommandPalette.tsx · EmptyState.tsx
```

**State ownership**

- *Server state* (dataset, versions, allocations, conflicts, impact): TanStack Query over `api/client.ts`. Every mutation bumps a revision counter in the query keys, so conflicts/KPIs refetch automatically.
- *Interactive scheduler state* (view mode, row filters, open drawer + target allocation, role, active version): Zustand (`store/schedulerStore.ts`).
- *Conflict logic*: pure functions in `engine/conflicts.ts` — same input ⇒ same output (deterministic requirement).

---

## 2. Design System

### Palette (OKLCH tokens, `src/index.css`)

| Token | Role | Value (approx.) |
|---|---|---|
| `--primary` | Academic indigo — actions, active nav, heatmap scale | `oklch(0.40 0.13 266)` |
| `--background` / `--card` | Cool near-white canvas / pure-white cards | `0.985` / `1.0` |
| `--destructive` | Hard conflicts | red `oklch(0.55 0.21 27)` |
| `--success` | Feasible / published / all-clear | emerald `oklch(0.60 0.14 155)` |
| `--warning` | Unallocated / draft / partial scores | amber `oklch(0.72 0.16 75)` |
| `--muted` / `--muted-foreground` | Dense secondary text, table headers | slate |

### Badge & status language

| Concept | Style |
|---|---|
| Lecture session | indigo-50 card, indigo-300 border, `Presentation` icon, `badge variant="lecture"` |
| Practical lab session | teal-50 card, teal-300 border, `FlaskConical` icon, `badge variant="practical"` |
| Hard conflict | red ring + `AlertTriangle` count pill on the card; clicking opens the Conflict Inspector |
| Unallocated (needs room) | dashed amber border, amber-50 fill |
| Version: Draft | dashed amber outline badge · Published: solid emerald badge |
| Conflict classes | 7 dedicated icons (`DoorClosed`, `UserRound`, `Users`, `Boxes`, `FlaskConical`, `Wrench`, `Ban`) reused in grid, triage list, drawer & dashboard |
| Room types | Lecture Hall = indigo · Computer Lab = sky · Hardware Lab = teal · Seminar = slate |

### Density & accessibility

- Grid rows are 64px min; cards use 11px type with tabular numerals — high density without clutter.
- Sticky resource column + sticky day header; thin custom scrollbars (`.sch-scroll`).
- WCAG AA: focus-visible rings everywhere, `aria-label`s on icon buttons, conflict cards are keyboard-operable (`role="button"`, Enter/Space), drawer is a Radix Dialog (focus trap, Esc).
- Print stylesheet: `.print-hide` chrome removal, `.print-area` landscape layout with exact colors.

---

## 3. Component Hierarchy (key flows)

```
ScheduleBuilderPage
├─ VersionBar                      # version switcher · publish gate · pre-publish diff dialog · impact preview dialog
└─ SchedulerGridView
   ├─ toolbar: Tabs(room|lecturer|group) · ResourceFilterSelect · search · conflict/unallocated badges
   ├─ unallocated tray (non-room views) → opens recommendation drawer
   └─ resource rows × days × 8 hourly cells → SessionCard (span = slotCount)
        ├─ click on conflicted card → ConflictResolutionDrawer (inspector)
        └─ hover ✨ "recommend"      → ConflictResolutionDrawer (alternatives)

ConflictResolutionDrawer (Sheet, right)
├─ Conflict Inspector: every hard conflict with icon, type badge, plain-language sentence
└─ Ranked alternatives (≥3): day/slot/room + ScoreTags (Capacity Fit · Equipment · Staff Pref · Compactness)
   └─ "Apply Fix" → useApplyFix → deterministic move → queries invalidate → grid re-renders conflict-free
```

### Conflict engine (SCH-FR-05) — 7 deterministic hard classes

`room-double-booking` · `lecturer-clash` (incl. blocked availability windows) · `group-overlap` · `capacity-overflow` · `room-type-mismatch` · `missing-equipment` · `room-closure`. Each produces a plain-human sentence, e.g. *"Main Building · 105 has capacity 36, but AI320-L1 (group AI-2) requires 45 seats."* Publishing is hard-gated: `usePublishVersion` re-runs detection server-side and rejects any draft with conflicts.

### Recommendation engine (SCH-FR-06)

Enumerates every (day, slot, room) triple → filters by static feasibility → re-runs the **full** detector with the candidate placed (guaranteeing zero resulting hard conflicts) → scores `total = 0.35·capacityFit + 0.25·equipmentMatch + 0.20·staffPreference + 0.20·compactness` → dedupes to one best room per time slot → returns the top ranked options. "Apply Fix" applies option #1 semantics deterministically (exact day/slot/room written to the draft).

### Seed demo data

One click ("Load Seed Demo Dataset", shown in every empty state) generates 20 rooms / 15 staff / 25 sections / 8 groups / 12 courses and two versions:
- **v1.0 (published)** — conflict-free greedy packing.
- **v1.2-draft** — published plan + 8 scripted edits, one per conflict class (capacity overflow, double-booking, lecturer clash, group overlap, room closure, missing equipment, blocked window) + 2 unallocated sessions, so every UI state is demoable.
