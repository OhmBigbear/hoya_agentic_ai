# Adaptive UI Readiness Assessment

## Current observations with file paths

- Most UI is hardcoded in page components. Examples include `src/app/components/MainContent.tsx`, `ProductionPerformance.tsx`, `WorkorderTracking.tsx`, `StationAnalysis.tsx`, `ShiftOperatorAnalysis.tsx`, `ScrapAnalysis.tsx`, and `AgentsConfiguration.tsx`.
- Reusable primitives exist in `src/app/components/ui/`, including `card.tsx`, `table.tsx`, `chart.tsx`, `tabs.tsx`, `dialog.tsx`, `sheet.tsx`, `button.tsx`, `badge.tsx`, `scroll-area.tsx`, `select.tsx`, and `switch.tsx`.
- Several page-level reusable components exist in maintenance:
  - `src/components/maintenance/AssistantPanel.tsx`
  - `src/components/maintenance/DocumentManagementPanel.tsx`
  - `src/components/maintenance/DocumentResultList.tsx`
  - `src/components/maintenance/FilterPanel.tsx`
  - `src/components/maintenance/SourceReferencePanel.tsx`
  - `src/components/maintenance/RelatedHistoryPanel.tsx`
  - `src/components/maintenance/DocumentCard.tsx`
- The operations workspace runtime in `src/services/operationsWorkspaceRuntime.ts` is state/action-driven, but not component-registry-driven.
- `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx` contains the only dynamic rendering of agent-provided structured blocks through `WorkspacePayloadInsight` and `WorkspacePayloadChartBlock`.
- There is no widget registry, component registry, layout registry, schema renderer, or dynamic component allowlist in the current codebase.
- Existing chart rendering uses Recharts directly in page components and in `src/app/components/ui/chart.tsx`.
- `workspace_payload` can describe summary, KPI cards, charts/tables, recommendations, evidence, and actions, but the UI maps that schema to one local renderer inside the maintenance workorder page.

## Strengths

- The project already has a strong primitive component inventory, which can support a registry without adding dependencies.
- The operations workspace runtime already separates action validation and state application from direct rendering, which is a useful foundation for adaptive UI.
- `WorkspacePayload` is a good production-minded starting point because it includes confidence, severity, limitations, evidence, recommendations, and actions.
- The current UI action whitelist is conservative and blocks write-like actions, which reduces risk while introducing dynamic behavior.
- Maintenance workorder tracking has stable enough domain targets to pilot a registry: table, drawer, dashboard, MTTR chart, delay reasons chart, maintenance frequency chart, and history signals.

## Weaknesses / gaps

- No component registry exists for safely mapping backend-provided widget types to approved frontend components.
- No schema validation library or local TypeScript runtime validator exists for generalized UI schema. Current normalization is manual and payload-specific.
- Page regions are not registered. The backend cannot safely ask to insert a widget into a known region such as `sidebar.insights`, `dashboard.primary`, or `drawer.evidence`.
- Chart payload support is minimal. The current workspace chart block renders up to five rows as a compact table-like preview rather than choosing chart components dynamically.
- Static dashboard components duplicate KPI card, insight card, chart card, table, assistant panel, and empty/loading patterns.
- Agent-provided actions are tied to hardcoded target IDs, not to registered UI capabilities with permissions, input schema, and explanation rules.

## Production risks

- Introducing a full agent-provided UI schema too early could create layout breakage, inaccessible controls, or unsafe action affordances.
- Without a registry, backend and frontend teams can create schema drift that is hard to debug in production.
- Without region constraints, adaptive UI could place important operational evidence in low-visibility or overflow-prone areas.
- Without a consistent evidence model, generated insight cards may look authoritative while lacking source backing.
- Dynamic rendering inside large page components will make testing and governance difficult as more domains are added.

## Recommended next steps

- Phase B should create a small widget registry foundation, not a full schema renderer. Start with read-only widgets only.
- Register a small set of approved widget kinds: KPI card, insight card, evidence list, recommendation card, table preview, bar chart, line chart, and action preview.
- Register surface regions for `/maintenance/workorders` before expanding to overview or production pages.
- Keep backend-provided UI schema declarative and data-only. Component implementation must remain frontend-owned.
- Define validation, size limits, empty states, loading states, evidence requirements, and graceful fallback rendering for every widget kind.
- Use the maintenance workorder page as the pilot and leave static dashboard pages unchanged until registry behavior is proven.
