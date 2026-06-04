# Agent And Copilot Integration Assessment

## Current observations with file paths

- `src/services/operationsWorkspaceCopilotApi.ts` calls `POST /api/operations-workspace/copilot/preview` using `VITE_AGENTIC_CORE_API_BASE_URL`.
- `src/types/operationsWorkspace.ts` defines the structured preview contract:
  - `assistant_text`
  - `insights`
  - `ui_actions`
  - `workspace_payload`
  - `trace`
  - `metadata`
  - `trace_id`
  - `generated_by_agent_id`
  - `source_tool_ids`
  - `confidence`
  - `created_at`
- `src/services/operationsWorkspaceContracts.ts` validates supported UI action types and blocks writeback-like action names such as create, update, delete, write, approve, commit, and mutate.
- `src/services/operationsWorkspaceRuntime.ts` applies read-only local actions to `OperationsWorkspaceState`, including filters, selected entities, focused charts, highlighted entities, open panels, time ranges, active insights, table sorts, and applied action history.
- `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx` is the main integration point. Its copilot sends the user message plus current filters and workspace context, receives structured preview output, applies known valid UI actions, and renders assistant text, insights, workspace payload blocks, and action result summaries.
- Agent execution results are represented mainly as chat messages plus local UI state changes. The UI records action status as applied, rejected, or ignored in `ActionResult` and `OperationsWorkspaceState.appliedActionHistory`.
- `workspace_payload` currently supports a narrow `workorder_insight` payload with summary, KPI cards, charts/tables, recommendations, evidence, actions, filters, confidence, severity, limitations, and generated time.
- Maintenance KB assistant integration in `src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx` calls `askMaintenanceKbAssistant()` from `src/services/maintenanceKbApi.ts` and handles answer, confidence, sources, related documents, suggested questions, warnings, trace ID, related history, similar cases, and governance flags from `src/types/maintenanceKb.ts`.
- The older feature-level maintenance knowledge copilot in `src/features/maintenance-knowledge/hooks/useMaintenanceCopilot.ts` calls `sendMaintenanceChatMessage()` when `APP_MODE` is not mock. That contract returns answer content, confidence, source citations, and trace metadata, but it is not the currently routed maintenance KB page.
- The overview dashboard copilot in `src/app/components/MainContent.tsx` is local state only and does not call an API.
- Agent debug chat in `src/app/components/AgentsConfiguration.tsx` is local state only and does not call an API.

## Strengths

- The backend can already return more than text for the operations workspace path: text, insights, UI actions, workspace payload, trace metadata, agent ID, source tool IDs, confidence, and timestamps.
- The operations workspace contract explicitly treats responses as previews and local read-only UI changes, which is a sound safety baseline.
- The UI action validator rejects unsupported and writeback-like actions before runtime application.
- The maintenance workorder page shows the beginnings of an Agent Workspace: contextual prompt filters, structured insights, local action application, synchronized chart/table/drawer context, and visible action status.
- Maintenance KB contracts support citations, confidence, warnings, governance flags, retrieval metadata, audit metadata, and related history.

## Weaknesses / gaps

- Structured agent integration is limited to maintenance workorder tracking. Most dashboard and admin pages remain static or local-only.
- `workspace_payload` is currently specific to `payload_type: 'workorder_insight'` and `intent: 'workorder_insight'`; there is no general UI schema or widget schema.
- The UI renders workspace payload charts as compact row previews in `WorkspacePayloadChartBlock`, not as dynamic chart components.
- There is no explicit agent execution object or run timeline in UI. Trace metadata exists, but operator-facing trace exploration is absent.
- Agent-provided actions are constrained to a fixed set of maintenance-specific targets in `src/services/operationsWorkspaceRuntime.ts` and duplicated in `MaintenanceWorkorderTrackingPage.tsx`.
- There is no human-in-the-loop approval rendering for agent actions. Writeback-like actions are blocked instead of routed to approval review.
- The overview dashboard copilot and agent debug chat can create user expectations that are not backed by real Agentic Core behavior.

## Production risks

- Operators may see action summaries such as `set_filter` or `focus_chart` that expose internal runtime vocabulary rather than operational explanations.
- Trace IDs and source tool IDs are captured but not rendered into a complete evidence chain, which weakens auditability.
- A backend returning a valid but unsupported workspace payload will be silently ignored by `normalizeWorkspacePayload()` if it does not match the current hardcoded payload type and intent.
- Duplicated target validation between service/runtime and page-level code can diverge.
- Expanding from preview actions to write actions without a formal approval and policy UI would be risky.

## Recommended next steps

- Promote the operations workspace response contract into the canonical Agent Workspace contract for Hoya UI, but keep it read-only for the next phase.
- Introduce a target registry so supported action targets are declared once per surface.
- Add operator-facing explanations for applied, ignored, and rejected actions using evidence and trace context rather than raw action names only.
- Define a generalized `insight_card` and `widget_ref` schema before accepting arbitrary backend UI schema.
- Connect trace metadata to a dedicated trace drawer or page before enabling any writeback or approval workflows.
- Align maintenance KB source citations with operations workspace evidence so the UI has one evidence rendering standard.
