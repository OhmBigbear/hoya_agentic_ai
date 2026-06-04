# Navigation And Route Map Assessment

## Current observations with file paths

- `src/app/components/Sidebar.tsx` defines the visible menu groups:
  - Overview: `#overview`
  - Production: `#production-performance`, `#workorder-tracking`, `#station-analysis`, `#shift-operator-analysis`, `#scrap-analysis`
  - Maintenance: `/maintenance/workorders`, `#station-maintenance-analysis`, `#maintenance-cost-spare-parts`, `#maintenance-kb`
  - Reports: `#production-report`, `#workorder-report`, `#maintenance-report`
  - Engineering: `#engineering-sandbox`, `#raw-data-explorer`
  - Administration: `#system-config`, `#agents-config`, `#production-flow-config`, `#agents-debug-log`
- `src/app/App.tsx` renders only these route/page values:
  - `#overview`
  - `#production-performance`
  - `#workorder-tracking`
  - `#station-analysis`
  - `#shift-operator-analysis`
  - `#scrap-analysis`
  - `#station-maintenance-tracking`
  - `/maintenance/workorders`
  - `#station-maintenance-analysis`
  - `#maintenance-cost-spare-parts`
  - `#maintenance-kb`
  - `#engineering-sandbox`
  - `#agents-config`
  - `#raw-data-explorer`
- Sidebar links call `window.history.pushState({}, '', item.href)` and then set `activePage`. There is no listener for browser back/forward navigation in `src/app/App.tsx`.
- `/maintenance/workorders` is the only real path routed by the current app state initializer. Most other pages are hash-style page IDs.
- Hidden or partially wired sidebar entries currently fall back to the default overview page because they appear in `Sidebar.tsx` but not the `App.tsx` switch:
  - `#production-report`
  - `#workorder-report`
  - `#maintenance-report`
  - `#system-config`
  - `#production-flow-config`
  - `#agents-debug-log`
- The dashboard/copilot relationship is fragmented:
  - Overview dashboard has a local, static copilot panel in `src/app/components/MainContent.tsx`.
  - Maintenance workorder tracking has a structured Agentic Core preview copilot in `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx`.
  - Maintenance KB has an assistant panel in `src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx` and an older feature implementation in `src/features/maintenance-knowledge/`.
  - Agent configuration has a debug chat in `src/app/components/AgentsConfiguration.tsx`, but it is local-only.

## Strengths

- The sidebar provides a clear operator information architecture across overview, production, maintenance, reports, engineering, and administration.
- The main operational areas needed for a first adaptive UI pass are visible: dashboard, workorders, maintenance, knowledge base, engineering sandbox, raw data, and agent configuration.
- `/maintenance/workorders` is already a stable URL-like path for the newest operations workspace surface.
- The maintenance workorder page connects dashboard state, copilot, detail drawer, table, charts, insights, and local action history in one routed surface.

## Weaknesses / gaps

- Navigation is not declarative. Sidebar routes and rendered routes are maintained separately.
- Report and admin links are visible but not implemented, creating misleading navigation affordances.
- Browser navigation is incomplete because active page state is not synchronized from `popstate`.
- The relationship between `#station-maintenance-tracking` and `/maintenance/workorders` is special-cased in both `App.tsx` and `Sidebar.tsx`.
- There is no page metadata for adaptive UI placement, route-level context, required data capabilities, or agent target namespaces.
- There is no explicit route for traces, audit, approvals, workflows, skills, tools, teams, or policy.

## Production risks

- Operators can click visible sidebar entries and land on the overview page without a clear unavailable state.
- Future agent actions may need to navigate or open views, but the current route model has no safe route registry for validation.
- Adaptive widget rendering needs stable page and region identifiers; current pages have implicit JSX sections rather than registered regions.
- Admin/control-plane surfaces are visible enough to imply capability, but most are static or absent.

## Recommended next steps

- Create a route registry document first, then implement it in Phase A1 after this assessment phase.
- Remove ambiguity between hash routes and real paths by selecting a production route strategy.
- Mark currently unwired sidebar items as unavailable in documentation and decide whether to hide, implement, or route to explicit placeholder pages in a later code phase.
- Define stable route IDs and region IDs for dashboard, copilot, maintenance workorders, maintenance KB, control plane, traces, approvals, and settings.
- Make `/maintenance/workorders` the first canonical Agent Workspace route and use it as the pilot for registry-driven navigation.
