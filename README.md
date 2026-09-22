# Smart Timetable Dashboard

A modern, responsive scheduling dashboard built with React, TypeScript, and Tailwind CSS - matching the Figma design exactly.

## 🚀 Tech Stack

- **React 18** + **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **ESLint** for code quality

## 📁 Project Structure

```
smart-timetable/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── LoginForm.tsx    # Authentication screen
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   ├── StatCard.tsx     # Dashboard stat cards
│   │   ├── SectionsTable.tsx# Sections data table
│   │   ├── CoursesTable.tsx # Courses data table
│   │   ├── ConflictAlert.tsx# Room conflict warning
│   │   ├── DashboardContent.tsx
│   │   ├── CoursesContent.tsx
│   │   ├── SupportPage.tsx
│   │   └── EmptyState.tsx
│   ├── data/
│   │   └── mockData.ts      # Mock data (courses, sections, staff)
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles + Tailwind
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── tsconfig.node.json
```

## 🎨 Features Implemented

| Feature | Status |
|---------|--------|
| **Login Screen** | ✅ Matches Figma exactly |
| **Sidebar Navigation** | ✅ 7 tabs with icons |
| **Dashboard** | ✅ Stats cards, conflict alert, sections table |
| **Courses Page** | ✅ Table with add button |
| **Support Page** | ✅ Search + help categories |
| **Sections/Staff/Rooms/Equipment** | ✅ Placeholder pages |
| **Responsive Design** | ✅ Mobile-first, works on all screens |
| **RTL Support** | ✅ Arabic layout ready |

## 🛠️ Installation & Running

```bash
# 1. Navigate to project
cd smart-timetable

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000
```

## 🏗️ Build for Production

```bash
npm run build
# Output in ./dist folder
```

## 🔐 Demo Credentials

```
Email:    test@example.com
Password: any value (demo mode)
```

## 📱 Pages Overview

| Tab | Route | Description |
|-----|-------|-------------|
| Dashboard | `/` | Overview with stats, conflicts, schedule |
| Courses | `/courses` | Course management table |
| Sections | `/sections` | Section listings (placeholder) |
| Staff | `/staff` | Faculty directory (placeholder) |
| Rooms | `/rooms` | Room management (placeholder) |
| Equipment | `/equipment` | Equipment inventory (placeholder) |
| Support | `/support` | Help center & documentation |

## 🎯 Design System (from Figma)

### Colors
- **Primary**: Slate 900 (`#0f172a`) - Sidebar, buttons
- **Background**: Slate 50 (`#f8fafc`) - Main area
- **Cards**: White (`#ffffff`) - All containers
- **Accents**: Blue 600, Emerald 600, Amber 600, Red 600

### Typography
- **Font**: Inter (system fallback)
- **Headings**: 2xl, bold, slate-900
- **Body**: sm, slate-500/700
- **Labels**: xs, uppercase, slate-500

### Spacing
- **Base unit**: 4px (Tailwind default)
- **Container padding**: p-8 (32px)
- **Card padding**: p-4/p-5 (16-20px)
- **Gap**: 4 (16px) between grid items

### Border Radius
- **Inputs/Buttons**: xl (1rem / 16px)
- **Cards/Containers**: 2xl (1.5rem / 24px)

## 🔧 Customization

### Adding New Pages
1. Create component in `src/components/`
2. Add to `TabId` type in `src/types/index.ts`
3. Add nav item in `Sidebar.tsx`
4. Handle in `App.tsx`

### Updating Mock Data
Edit `src/data/mockData.ts` - all data is centralized there.

## 📝 License

MIT - Feel free to use for your projects!