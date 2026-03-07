

## Current State

The project is still the default blank Lovable app. The previous plan was discussed but no code was implemented yet. The preview correctly shows the default "Welcome to Your Blank App" page.

## Implementation Plan

We need to build the full Business OS dashboard from scratch. Here's the plan:

### 1. Set up Supabase (Lovable Cloud)
- Create 3 tables: `daily_entries`, `daily_metrics`, `tasks`
- Enable RLS with public access (no auth yet)
- Seed with sample data from the HTML dashboard

### 2. Build the Dashboard UI
- **Theme**: Memphis/neo-brutalist style with bold borders, candy colors, Google Fonts (Fredoka, Space Grotesk)
- **Layout**: Header + 4-tab interface (Overview, Skool Metrics, Ad Performance, Tasks)
- **Components** (modular):
  - `DashboardHeader` — title, date display
  - `KpiCard` — reusable stat card with Memphis styling
  - `GoalBar` — MRR progress bar
  - `ChartCard` — wrapper for Recharts visualizations
  - `EntryForm` — date-based upsert form for metrics
  - `TaskList` / `TaskCategory` — categorized task management
  - `HeatmapGrid` — activity heatmap
  - `DataTable` — log/history tables

### 3. Data Layer
- Supabase client hooks using React Query for fetching/mutating
- Upsert logic for daily_entries and daily_metrics (one per date)
- Real-time task toggle updates
- Default task seeding per day

### 4. Tab Details
- **Overview**: KPI summary cards, MRR trend chart, conversion donut, spend vs revenue
- **Skool Metrics**: Entry form + KPI cards + 4 charts + daily log table
- **Ad Performance**: Entry form + period filter + KPI cards + 4 charts + weekly table
- **Tasks**: Day navigation, completion stats, categorized checklists, add task form, heatmap

Shall I proceed with implementation?

