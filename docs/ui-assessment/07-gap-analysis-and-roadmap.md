# Gap Analysis And Roadmap

## Current observations with file paths

- Current UI foundation:
  - SPA shell and state routing: `src/app/App.tsx`
  - Sidebar/menu map: `src/app/components/Sidebar.tsx`
  - Shared primitives: `src/app/components/ui/*`
  - Static operational dashboards: `src/app/components/*`
  - Production-oriented maintenance workorders: `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx`
  - Maintenance runtime services/types: `src/services/maintenanceWorkorderApi.ts`, `src/types/maintenance.ts`
  - Production-oriented maintenance KB: `src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx`, `src/components/maintenance/*`, `src/services/maintenanceKbApi.ts`, `src/types/maintenanceKb.ts`
  - Operations workspace runtime: `src/services/operationsWorkspaceRuntime.ts`, `src/services/operationsWorkspaceContracts.ts`, `src/services/operationsWorkspaceCopilotApi.ts`, `src/types/operationsWorkspace.ts`, `src/hooks/useOperationsWorkspaceRuntime.ts`
  - Static control-plane sketch: `src/app/components/AgentsConfiguration.tsx`
- Current adaptive-agent capability is concentrated in maintenance workorder tracking. The rest of the product is closer to traditional dashboards plus local copilots.
- The UI can consume structured agent response objects, but only one surface has meaningful action application and synchronized visualization.
- There is no widget registry, route registry, control-plane API layer, trace viewer, approval queue, or generalized dynamic UI schema renderer.

## Recommended maturity level

**Current classification: Level 1 — Dashboard + Chat Copilot.**

The strongest surface, `/maintenance/workorders`, reaches early **Level 2 — Agent Workspace** behavior because it supports structured preview responses, insights, read-only local UI actions, synchronized chart/table/drawer state, and workspace payload rendering. The overall application should still be classified as Level 1 because most pages remain hardcoded dashboards or local mock copilots, and production control-plane/trace/workflow support is not yet present.

## Strengths

- Strong visual and component baseline for an operator-facing MES-style UI.
- Clear maintenance domain foundation with runtime APIs, normalized types, agent-ready data planning, and production-oriented KB workflows.
- Existing operations workspace contract is a credible starting point for structured agent responses.
- Read-only local action safety rules are already present.
- The codebase has enough shared UI primitives to build registry-driven widgets without new dependencies.

## Weaknesses / gaps

- Hardcoded page layouts dominate the product.
- Navigation and route metadata are not centralized.
- Structured agent behavior is not generalized beyond maintenance workorders.
- Control-plane pages are static/local and not production-backed.
- Trace, audit, approval, policy, skill execution, tool activity, and workflow execution views are missing.
- Evidence rendering is inconsistent between KB and operations workspace.
- No safe dynamic widget or UI schema registry exists.
- Several visible sidebar routes are unwired and fall back to overview.

## Production risks

- Users may confuse static mock dashboards and static agent configuration controls with production behavior.
- Agent-provided actions cannot be governed at scale without target registration, policy decisions, trace display, and approval handling.
- Adding adaptive UI directly into page components will increase duplication and make runtime safety harder to reason about.
- Domain package expansion could create inconsistent source/citation behavior unless evidence is standardized first.

## Recommended implementation phases

### Phase A1: cleanup / documentation / architecture alignment

- Create a route and sidebar registry document covering current routes, hidden routes, route IDs, permissions, and production/mock status.
- Decide the canonical ownership of maintenance KB and deprecate duplicate feature-level paths where appropriate in a later code phase.
- Inventory production-backed, mock-backed, and hybrid pages.
- Define stable surface IDs and region IDs for `/maintenance/workorders`.
- Document current operations workspace target IDs and action semantics.

### Phase B: widget registry foundation

- Build a frontend-owned allowlist registry for read-only widgets.
- Start with KPI card, insight card, evidence list, recommendation card, table preview, bar chart, line chart, action preview, and trace link.
- Register widgets with input shape, evidence requirements, max sizes, empty state, and fallback behavior.
- Register surface regions for the maintenance workorder page.

### Phase C: dynamic insight cards

- Convert maintenance workorder `insights` and `workspace_payload` rendering into registry-backed insight cards.
- Standardize severity, confidence, source tools, evidence, limitations, and trace links.
- Add operator-facing action explanations for applied, ignored, and rejected UI actions.
- Align maintenance KB source references with the same evidence card model.

### Phase D: agent workspace

- Promote `/maintenance/workorders` into the first full Agent Workspace.
- Add a trace drawer for copilot responses, UI actions, evidence, tool calls, policy results, and synchronization history.
- Add read-only workspace context panels for selected workorder, selected machine, active insight, focused chart, and time range.
- Add recommendation feedback states such as accepted, dismissed, escalated, and needs evidence.

### Phase E: adaptive intelligence UI

- Extend registry-backed widgets and insights to overview and production dashboards.
- Introduce domain package manifests for maintenance, production, quality, engineering, and inventory.
- Allow agents to propose contextual widgets within registered regions using safe schemas.
- Add route-aware and role-aware adaptive suggestions.

### Phase F: full agent-driven UI schema

- Introduce a broader UI schema only after traces, policies, approvals, widget registry, and domain packages are stable.
- Support nested layouts, cross-route navigation proposals, workflow panels, approval forms, and controlled writeback flows.
- Require schema validation, policy evaluation, provenance, trace linking, and human approval for any mutating action.

## Recommended next steps

- Proceed with **Phase A1** before implementing registry code.
- Keep `/maintenance/workorders` as the pilot surface.
- Avoid enabling writeback or approval actions until trace and policy explainability exist.
- Treat `AgentsConfiguration.tsx` as a UX reference, not a production control plane, until real APIs are added.
