# Current Architecture Assessment

## Current observations with file paths

- The UI is a Vite React SPA mounted from `src/main.tsx` into `src/app/App.tsx`.
- Routing is not handled by a route library. `src/app/App.tsx` keeps `activePage` in React state, initializes it from `window.location.pathname` or `window.location.hash`, and switches directly over page identifiers.
- The primary application shell lives in `src/app/App.tsx`, `src/app/components/Sidebar.tsx`, and `src/app/components/Header.tsx`.
- Most dashboard pages are large page-level components in `src/app/components/`, including `MainContent.tsx`, `ProductionPerformance.tsx`, `WorkorderTracking.tsx`, `StationAnalysis.tsx`, `ShiftOperatorAnalysis.tsx`, `ScrapAnalysis.tsx`, `StationMaintenanceAnalysis.tsx`, `MaintenanceCostSpareParts.tsx`, `EngineeringSandbox.tsx`, `AgentsConfiguration.tsx`, and `RawDataExplorer.tsx`.
- Maintenance workorder tracking is a newer page under `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx`, wrapped by `src/app/components/StationMaintenanceTracking.tsx`.
- Maintenance knowledge base is split between `src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx`, `src/components/maintenance/*`, and a wrapper in `src/app/components/MaintenanceKnowledgeBase.tsx`.
- There is an older feature-style maintenance knowledge implementation under `src/features/maintenance-knowledge/`, with its own components, hooks, DTOs, and API service. It appears separate from the currently routed `src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx`.
- Shared primitive UI components live in `src/app/components/ui/`. These include Radix-style primitives, cards, tables, tabs, dialogs, sheets, scroll areas, charts, badges, buttons, inputs, selects, switches, and tooltips.
- Service/API organization is partially layered:
  - Maintenance runtime API: `src/services/maintenanceWorkorderApi.ts`.
  - Maintenance KB API: `src/services/maintenanceKbApi.ts`.
  - Operations workspace copilot preview: `src/services/operationsWorkspaceCopilotApi.ts`.
  - Operations workspace contracts/runtime: `src/services/operationsWorkspaceContracts.ts` and `src/services/operationsWorkspaceRuntime.ts`.
  - Generic Agentic Core client and endpoints: `src/shared/api/agenticCoreClient.ts` and `src/shared/api/endpoints.ts`.
- Types are split across `src/types/maintenance.ts`, `src/types/maintenanceKb.ts`, `src/types/operationsWorkspace.ts`, `src/shared/types/api.ts`, and feature-local DTOs in `src/features/maintenance-knowledge/dto.ts`.
- The repo also contains a local Node/PostgreSQL maintenance runtime under `src/server/*`, with routes, repositories, services, DTOs, and database helpers.

## Strengths

- The newer maintenance workorder and maintenance KB areas have explicit service and type layers rather than embedding every API contract in page JSX.
- `src/app/components/ui/` provides a broad shared component base for production UI consistency.
- `src/services/operationsWorkspaceRuntime.ts` and `src/types/operationsWorkspace.ts` already define a local runtime state model for applying agent-suggested visualization changes.
- Maintenance runtime API normalizers in `src/services/maintenanceWorkorderApi.ts` make backend response shape drift less likely to break rendering immediately.
- The maintenance KB page has a production-oriented workflow for context loading, document listing, upload, process, diagnostics, archive, delete, grounded retrieval, assistant response, and error states.
- Existing docs such as `docs/spec020-hoya-ui-conversational-visualization.md`, `docs/spec020-visualization-synchronization.md`, `docs/maintenance-api-contract.md`, and `docs/maintenance-agent-tool-plan.md` document recent intent around read-only agent preview and maintenance agent-ready views.

## Weaknesses / gaps

- Route and navigation definitions are not centralized. `src/app/components/Sidebar.tsx` and `src/app/App.tsx` can drift because they duplicate page knowledge.
- The application mixes several organization styles: `src/app/components`, `src/pages`, `src/components/maintenance`, `src/features/maintenance-knowledge`, `src/services`, and `src/shared`. Feature ownership is not always obvious.
- Many operational dashboard components are large, hardcoded, page-specific components with local sample data and embedded layout, cards, charts, tables, and assistant panels.
- There is no route-level layout model, no nested routes, and no route metadata contract for titles, permissions, breadcrumbs, or agent workspace placement.
- The newer operations-workspace runtime is not yet generalized across pages. It is primarily integrated into `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx`.
- The generic endpoint constants in `src/shared/api/endpoints.ts` include control-plane concepts such as approvals and traces, but they are not matched by production UI pages.

## Production risks

- Adding adaptive UI behavior directly to the current page-level switch risks expanding `src/app/App.tsx` and sidebar coupling instead of creating a stable route and surface model.
- Agent-provided UI could accidentally target non-existent or stale page IDs because navigation, route IDs, and operations workspace target IDs are separate concepts today.
- Static dashboard screens may be mistaken for production data surfaces because many cards and charts use realistic sample values without visible data provenance.
- Feature duplication around maintenance knowledge can cause inconsistent API contracts, source citation rendering, and trace behavior if both implementations remain active.
- A production control plane cannot be safely built on the current static `AgentsConfiguration.tsx` model without a backend contract, role model, audit model, and mutation safeguards.

## Recommended next steps

- Establish a lightweight route/page registry that maps route ID, href, component, sidebar label, icon, permission, and agent workspace target namespace in one place.
- Document which surfaces are production-backed, mock-backed, and hybrid; make that distinction explicit before building adaptive features.
- Consolidate maintenance knowledge ownership between `src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx` and `src/features/maintenance-knowledge/`.
- Keep `src/services/operationsWorkspaceRuntime.ts` as the foundation for safe local actions, but separate target registration from runtime logic.
- Define a production UI domain model for agents, workflows, skills, tools, traces, approvals, insights, evidence, and widgets before implementing control-plane mutations.
