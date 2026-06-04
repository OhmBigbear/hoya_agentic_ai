# Domain Intelligence Readiness Assessment

## Current observations with file paths

- Maintenance workorder tracking is production-oriented and API-backed through `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx` and `src/services/maintenanceWorkorderApi.ts`.
- Maintenance runtime endpoints used by the workorder page include:
  - `/api/maintenance/workorders`
  - `/api/maintenance/workorders/:workorderNo`
  - `/api/maintenance/equipment/:equipmentNo/history`
  - `/api/maintenance/analytics/hold-reasons`
  - `/api/maintenance/analytics/repeat-failures`
  - `/api/maintenance/analytics/stock-risk`
  - `/api/maintenance/dashboard-summary`
  - `/api/maintenance/workorders/:workorderNo/parts`
- Maintenance workorder types in `src/types/maintenance.ts` cover workorders, equipment, tasks, parts, hold history, MTBF/MTTR, risk machines, dashboard summary, query filters, trace ID, totals, and warnings.
- Maintenance workorder UI includes KPI cards, filters, pagination, table, drawer detail, parts, history, MTTR trend chart, delay/hold reasons chart, maintenance frequency chart, inventory/history signal chart, copilot insights, recommendations, evidence, and local action summaries.
- Maintenance KB in `src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx` supports context filters, document management, search results, grounded assistant responses, selected document grounding, upload, process, diagnostics, archive, delete, related history, source references, and lifecycle notices.
- Maintenance KB response types in `src/types/maintenanceKb.ts` include confidence labels, source references, evidence flags, safety/governance flags, retrieval metadata, audit metadata, related history, similar cases, and warnings.
- `database/maintenance/002_agent_ready_views.sql`, `docs/maintenance-database-design.md`, `docs/maintenance-api-contract.md`, and `docs/maintenance-agent-tool-plan.md` describe normalized maintenance tables, agent-ready views, and future Agentic Core tools.
- Production, quality, station, shift/operator, and engineering dashboard components contain operational KPIs, charts, and insight cards, but many appear to use hardcoded sample data inside page components.

## Strengths

- Maintenance workorders are the strongest domain intelligence foundation in the current UI.
- The maintenance API contract is broad enough to support workorder triage, equipment history, hold analysis, repeat failure detection, stock risk, and dashboard summaries.
- Maintenance KB has a credible evidence and citation model with source references, selected document grounding, diagnostics, and document lifecycle operations.
- The operations workspace `WorkspacePayload` already supports insight summaries, KPI cards, chart/table data, recommendations, evidence, limitations, and actions.
- Existing maintenance docs provide a clear path from normalized operational data to future Agentic Core tools and skills.

## Weaknesses / gaps

- Domain intelligence is not uniform across modules. Maintenance workorders and KB are API-backed, while most production dashboard intelligence is static.
- Source/citation rendering is stronger in maintenance KB than in operations workspace insight cards.
- Recommendations are displayed, but there is no approval workflow, ownership assignment, SLA tracking, or outcome feedback loop.
- The maintenance workorder workspace payload supports evidence but not rich citations, source excerpts, span links, or trace drilldown.
- Spec 022/domain package expansion readiness is partial: the maintenance domain has data contracts, but there is no domain package registry, capability manifest, widget registry, or agent skill binding visible in UI.
- There is no shared domain intelligence model for production, maintenance, quality, inventory, and engineering views.

## Production risks

- Operators could over-trust generated recommendations if evidence, confidence, source age, and limitations are not consistently visible.
- Static production insights may be confused with live intelligence because they visually match the API-backed maintenance UI.
- Maintenance KB document actions can affect retrieval behavior, so lifecycle actions need strong audit and trace integration before broader governance use.
- Domain expansion without a registry may duplicate contracts and rendering logic for every new domain.

## Recommended next steps

- Use maintenance workorders plus maintenance KB as the pilot domain package.
- Define a domain package manifest with domain ID, entities, tools, skills, supported widgets, evidence requirements, route targets, and safe actions.
- Standardize evidence rendering between maintenance KB source references and operations workspace insight evidence.
- Add outcome feedback for recommendations: accepted, dismissed, escalated, needs evidence, or converted to work order.
- Separate static sample dashboards from production-backed domain intelligence in documentation and later in UI labels/config.
- For Spec 022 expansion, prioritize read-only domain intelligence packages before enabling actions that mutate operational systems.
