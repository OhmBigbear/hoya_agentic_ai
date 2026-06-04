# Static, Mock, And Production Inventory

This inventory separates production-backed surfaces from static or local-only screens before adaptive UI work starts.

## Production-backed

| page/component | route | basis | notes |
| --- | --- | --- | --- |
| `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx` via `src/app/components/StationMaintenanceTracking.tsx` | `/maintenance/workorders` | Calls Maintenance Runtime API through `src/services/maintenanceWorkorderApi.ts`; copilot preview uses `src/services/operationsWorkspaceCopilotApi.ts` | Strongest production candidate; still has hardcoded surface targets and route aliasing |

## Partially production-backed

| page/component | route | basis | notes |
| --- | --- | --- | --- |
| `src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx` via `src/app/components/MaintenanceKnowledgeBase.tsx` | `#maintenance-kb` | Calls `src/services/maintenanceKbApi.ts`, which has API paths and mock fallback behavior | Production-adjacent; trace/evidence fields exist, but mock fallback and duplicate older feature code need clear ownership |
| `src/components/maintenance/*` | used by `#maintenance-kb` | Receives page/service state from maintenance KB page | Reusable evidence, filters, document lifecycle, and assistant components are useful for future registry patterns |

## Static/sample/local-only

| page/component | route | reason | recommended classification |
| --- | --- | --- | --- |
| `src/app/components/MainContent.tsx` | `#overview` | local sample dashboard and local copilot messages | Static dashboard/copilot sketch |
| `src/app/components/ProductionPerformance.tsx` | `#production-performance` | hardcoded production metrics and charts | Static production dashboard |
| `src/app/components/WorkorderTracking.tsx` | `#workorder-tracking` | hardcoded workorder and process data | Static production workorder dashboard |
| `src/app/components/StationAnalysis.tsx` | `#station-analysis` | hardcoded station metrics | Static station analytics |
| `src/app/components/ShiftOperatorAnalysis.tsx` | `#shift-operator-analysis` | hardcoded shift/operator metrics | Static labor analytics |
| `src/app/components/ScrapAnalysis.tsx` | `#scrap-analysis` | hardcoded scrap metrics | Static quality analytics |
| `src/app/components/StationMaintenanceAnalysis.tsx` | `#station-maintenance-analysis` | hardcoded maintenance analytics | Static maintenance analytics |
| `src/app/components/MaintenanceCostSpareParts.tsx` | `#maintenance-cost-spare-parts` | hardcoded cost and inventory risk data | Static maintenance cost/spares analytics |
| `src/app/components/EngineeringSandbox.tsx` | `#engineering-sandbox` | local sample analysis data and chat messages | Local exploratory sandbox |
| `src/app/components/RawDataExplorer.tsx` | `#raw-data-explorer` | local sample chat/messages and data exploration UI | Local exploratory data UI |
| `src/app/components/AgentsConfiguration.tsx` | `#agents-config` | local constants for agents, prompts, tools, logs, metrics, debug chat | Static control-plane sketch, not production admin |
| `src/app/components/SignIn.tsx` | unauthenticated state | local authentication state only | Local shell gate |

## Deprecated or duplicate candidates

| area | files | reason | recommended action |
| --- | --- | --- | --- |
| Older maintenance knowledge feature | `src/features/maintenance-knowledge/*` | Separate feature-style implementation with mock data and optional Agentic Core client usage; not the routed `#maintenance-kb` page | Decide ownership before Phase B evidence/widget work |
| Legacy maintenance workorder hash alias | `#station-maintenance-tracking` in `src/app/App.tsx` | Sidebar uses `/maintenance/workorders`; alias remains in render switch and active-state special case | Preserve until route registry migration, then document alias behavior |
| Report sidebar entries | `#production-report`, `#workorder-report`, `#maintenance-report` | Visible links without page cases | Hide or add explicit unavailable routes later |
| Admin placeholder sidebar entries | `#system-config`, `#production-flow-config`, `#agents-debug-log` | Visible links without page cases | Hide or add explicit unavailable routes later |

## Needs API contract

| surface | missing contract |
| --- | --- |
| `overview.dashboard` | operational KPI summary, alerts, constraints, downtime, maintenance impact, assistant context |
| `production.performance` | production throughput, target attainment, downtime, bottleneck, trend, alert APIs |
| `production.workorders` | production workorder state, station progress, blockers, operator assignment, recovery recommendation APIs |
| `production.stations` | station capacity, utilization, cycle time, queue, defect, maintenance impact APIs |
| `production.shift_operator` | shift performance, operator assignment, attendance, productivity, safety, audit APIs |
| `quality.scrap` | scrap event, defect taxonomy, process attribution, cost, trend APIs |
| `maintenance.analysis` | reliability analytics, downtime, maintenance frequency, root cause APIs if not folded into current maintenance runtime |
| `maintenance.cost_spares` | spare part inventory, cost, supplier, stock risk, consumption, workorder impact APIs |
| `engineering.raw_data` | secure query API, dataset catalog, export policy, lineage, permission model |
| `engineering.sandbox` | analysis session API, approved compute actions, result persistence, traceability |
| Reports | report catalog, generation, filters, export, audit, and permission APIs |

## Needs control-plane integration

| surface | required integration before production |
| --- | --- |
| `admin.agents_config` | agent inventory, prompt versions, tools, guardrails, environment, RBAC, audit log, immutable version history, trace links |
| `admin.agents_debug_log` | trace/run log API, span timeline, tool calls, errors, policy decisions, evidence references |
| `admin.system_config` | configuration schema, permission checks, audit trail, validation, rollback |
| `admin.production_flow_config` | production flow model API, approvals, validation, versioning, audit |
| `maintenance.workorders` | trace/evidence viewer and registered read-only action target map |
| `maintenance.knowledge_base` | unified evidence contract, trace drawer/linking, document lifecycle audit integration |

