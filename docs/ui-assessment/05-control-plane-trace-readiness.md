# Control Plane, Trace, And Explainability Readiness Assessment

## Current observations with file paths

- `src/app/components/AgentsConfiguration.tsx` is the only visible agent/control-plane-like page.
- `AgentsConfiguration.tsx` includes static/local sections for agent selection, environment, prompt editing, prompt versions, tools, memory sources, guardrails, agent logs, performance metrics, and debug chat.
- The page does not call `src/shared/api/agenticCoreClient.ts`, `src/shared/api/endpoints.ts`, or any control-plane service. Agent, tool, guardrail, log, and metric data are local constants.
- `src/shared/api/endpoints.ts` defines endpoint constants for `/approvals` and `/traces`, but no current page or service uses them.
- `src/types/operationsWorkspace.ts` includes `TraceAuditMetadata` and attaches trace fields to insights, UI actions, dashboard patches, and copilot responses.
- `src/services/operationsWorkspaceCopilotApi.ts` normalizes trace metadata from Agentic Core preview responses.
- `src/services/operationsWorkspaceRuntime.ts` records applied or rejected UI actions in `appliedActionHistory`.
- `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx` renders compact action summaries and a collapsible workspace synchronization diagnostic panel.
- `src/types/maintenanceKb.ts` includes trace, retrieval metadata, audit metadata, safety flags, governance flags, evidence fields, and source references for maintenance KB responses.
- `src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx` stores and forwards `traceId` for KB assistant conversation continuity.
- `src/components/maintenance/DocumentManagementPanel.tsx` includes diagnostics dialogs and lifecycle confirmations for maintenance documents, but not agent trace timelines.

## Strengths

- The UI already carries trace metadata through multiple response contracts instead of discarding it.
- The operations workspace action history captures whether actions were applied or rejected locally.
- Maintenance KB response types include audit and governance fields that can support explainability.
- The static agent configuration page sketches many control-plane concepts that operators and admins will eventually need: prompts, tools, guardrails, memory, logs, performance, and debug behavior.
- Document lifecycle dialogs in the maintenance KB area show that the UI already has confirmation patterns for higher-impact operations.

## Weaknesses / gaps

- There is no production control-plane API service for agents, teams, workflows, skills, tools, policies, audit, traces, approvals, or executions.
- There is no trace route, trace drawer, run timeline, span tree, tool call panel, skill execution view, or approval queue.
- Static tool toggles and prompt editing controls in `AgentsConfiguration.tsx` can be interacted with locally but do not persist or audit changes.
- The UI exposes some internal runtime detail, such as raw UI action names, targets, and synchronization diagnostics, without a higher-level operator explanation.
- There is no human-in-the-loop approval rendering for proposed agent actions.
- There is no policy decision display showing why an action was allowed, rejected, or required approval.
- There is no evidence chain linking assistant text to insight evidence, tool calls, source documents, and final UI changes in one operator-readable view.

## Production risks

- A static control-plane screen with editable prompt and tool controls may be mistaken for a real production admin page.
- Adding backend mutations to the current `AgentsConfiguration.tsx` without stronger service contracts and audit UI would create governance risk.
- Operators cannot currently inspect why an agent produced an answer, which tools ran, which evidence was used, or which local UI actions changed state.
- Rejected actions are tracked but not explained enough for operational trust.
- Approval concepts exist only as endpoint constants and not as interaction design.

## Recommended next steps

- Treat `AgentsConfiguration.tsx` as a non-production UX sketch until it is backed by real control-plane contracts.
- Define read-only control-plane inventory pages first: agents, workflows, skills, tools, policies, traces, and audit.
- Add a trace viewer before adding control-plane mutations. Minimum trace view should include run summary, spans, tool calls, sources, generated insights, proposed UI actions, validation result, policy result, and timing.
- Convert raw action summaries into operator-facing explanations that include action intent, affected UI region, evidence, and safety result.
- Add approval queue concepts only after trace and policy views are in place.
- Keep prompt/tool/guardrail edits disabled or clearly non-persistent until backend update endpoints and audit logging are implemented.
