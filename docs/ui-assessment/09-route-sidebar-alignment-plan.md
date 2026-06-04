# Route And Sidebar Alignment Plan

This plan documents route/sidebar drift before implementation. It does not recommend changing production behavior in Phase A1.

## Current route model

- `src/app/App.tsx` owns navigation state through `activePage`.
- `src/app/components/Sidebar.tsx` owns visible menu metadata separately.
- Sidebar navigation calls `window.history.pushState({}, '', item.href)` and then updates React state through `onNavigate(item.href)`.
- `App.tsx` initializes from `window.location.pathname === '/maintenance/workorders'`, then from `window.location.hash`, then defaults to `#overview`.
- There is no `popstate` listener, so browser back/forward can change the URL without updating `activePage`.

## Sidebar entries not handled in App.tsx

These links exist in `Sidebar.tsx` but have no matching `renderPage()` case in `App.tsx`. They currently fall through to the default overview component.

| href | sidebar label | current rendered behavior | risk |
| --- | --- | --- | --- |
| `#production-report` | Production Performance Report | renders `MainContent` through default case | Visible report link is misleading |
| `#workorder-report` | Workorder Performance Report | renders `MainContent` through default case | Visible report link is misleading |
| `#maintenance-report` | Maintenance Performance Report | renders `MainContent` through default case | Visible report link is misleading |
| `#system-config` | System Configuration | renders `MainContent` through default case | Visible admin link is misleading |
| `#production-flow-config` | Production Flow Configuration | renders `MainContent` through default case | Visible admin link is misleading |
| `#agents-debug-log` | Agents Debug Log | renders `MainContent` through default case | Visible debug/audit link is misleading |

## App.tsx pages not visible in Sidebar

| App route value | backing component | sidebar visibility | note |
| --- | --- | --- | --- |
| `#station-maintenance-tracking` | `StationMaintenanceTracking` | no direct sidebar href | Legacy alias; sidebar uses `/maintenance/workorders` and special-cases active state |

All other `App.tsx` cases have a visible sidebar entry or are the default overview.

## Hash routes versus real path routes

| route style | current entries | implication |
| --- | --- | --- |
| Hash-based page values | Most pages, including `#overview`, production pages, maintenance analysis, maintenance KB, engineering, and admin sketch pages | Works inside the SPA without a route library, but route IDs and browser URL semantics are mixed |
| Real path route | `/maintenance/workorders` | Stronger canonical URL for the agent workspace pilot, but it is the only path route and is special-cased |
| Legacy alias | `#station-maintenance-tracking` | Preserved in `App.tsx` for compatibility but not visible in sidebar |

## Browser back/forward limitation

The sidebar pushes URL history entries but `App.tsx` does not subscribe to `popstate`. As a result:

- clicking sidebar entries updates both the URL and rendered page;
- using browser back/forward can update the URL without updating `activePage`;
- the rendered page can become inconsistent with the address bar;
- adaptive UI or agent navigation commands would not have a reliable route state source.

## Recommended target route model

Use one route registry as the source of truth for:

- `surface_id`
- canonical path
- optional legacy hash aliases
- sidebar group and label
- icon key
- component binding
- availability state
- data mode
- permission requirement
- agent/adaptive eligibility

Recommended canonical model:

| surface_id | canonical route | aliases |
| --- | --- | --- |
| `overview.dashboard` | `/overview` | `#overview` |
| `production.performance` | `/production/performance` | `#production-performance` |
| `production.workorders` | `/production/workorders` | `#workorder-tracking` |
| `production.stations` | `/production/stations` | `#station-analysis` |
| `production.shift_operator` | `/production/shift-operator` | `#shift-operator-analysis` |
| `quality.scrap` | `/quality/scrap` | `#scrap-analysis` |
| `maintenance.workorders` | `/maintenance/workorders` | `#station-maintenance-tracking` |
| `maintenance.analysis` | `/maintenance/analysis` | `#station-maintenance-analysis` |
| `maintenance.cost_spares` | `/maintenance/cost-spares` | `#maintenance-cost-spare-parts` |
| `maintenance.knowledge_base` | `/maintenance/knowledge-base` | `#maintenance-kb` |
| `engineering.sandbox` | `/engineering/sandbox` | `#engineering-sandbox` |
| `engineering.raw_data` | `/engineering/raw-data` | `#raw-data-explorer` |
| `admin.agents_config` | `/admin/agents` | `#agents-config` |

Report and absent admin pages should be represented as unavailable route records until real components and API contracts exist.

## Low-risk migration sequence

1. Document route and surface metadata, as done in Phase A1.
2. Add a typed route registry that exports route records only; do not change rendering behavior.
3. Generate sidebar menu groups from registry records while preserving labels, order, hrefs, and active state behavior.
4. Generate `App.tsx` route matching from the same registry while preserving all current component bindings.
5. Add explicit unavailable route handling for visible links currently falling through to overview.
6. Add `popstate` synchronization so browser back/forward updates `activePage`.
7. Canonicalize `/maintenance/workorders` first and preserve legacy hash aliases.
8. Migrate remaining hash routes to path routes only after direct links and tests are stable.

