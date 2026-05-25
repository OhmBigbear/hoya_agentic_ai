# Maintenance Agent Tool Plan

These are future Agentic Core tool mappings only. This round does not create tools, agents, or skills.

Policy baseline for every tool: read-only maintenance analytics access, normalized tables/views only, no raw staging table access, no writes, and audit logging required.

## maint_get_workorders

Input schema: `MaintenanceQueryFilters`.

Output schema: `MaintenanceApiResponse<MaintenanceWorkOrder[]>`.

Source API/service: `getWorkorderTracking` -> `GET /api/maintenance/workorders`.

Policy scope: maintenance workorder list and tracking evidence.

Risk level: low.

Audit event name: `maintenance.workorders.list`.

Related Agent/Skill: future Maintenance Workorder Analyst.

## maint_get_workorder_detail

Input schema: `{ workorder_no: string }`.

Output schema: `MaintenanceApiResponse<MaintenanceWorkOrderDetail>`.

Source API/service: `getWorkorderDetail` -> `GET /api/maintenance/workorders/{workorderNo}`.

Policy scope: single-workorder evidence retrieval.

Risk level: medium because maintenance history can influence operational decisions.

Audit event name: `maintenance.workorders.detail`.

Related Agent/Skill: future Maintenance Workorder Analyst.

## maint_get_machine_maintenance_history

Input schema: `{ equipment_no: string } & MaintenanceQueryFilters`.

Output schema: `MaintenanceApiResponse<MaintenanceWorkOrder[]>`.

Source API/service: `getMachineMaintenanceHistory` -> `GET /api/maintenance/equipment/{equipmentNo}/history`.

Policy scope: machine-level maintenance history retrieval.

Risk level: medium.

Audit event name: `maintenance.equipment.history`.

Related Agent/Skill: future Machine Reliability Analyst.

## maint_get_mtbf_mttr

Input schema: `MaintenanceQueryFilters`.

Output schema: `MaintenanceApiResponse<MaintenanceMtbfMttrSummary[]>`.

Source API/service: `getMtbfMttrSummary` -> `GET /api/maintenance/analytics/mtbf-mttr`.

Policy scope: reliability analytics only.

Risk level: medium.

Audit event name: `maintenance.analytics.mtbf_mttr`.

Related Agent/Skill: future Reliability Analytics.

## maint_get_spare_part_usage

Input schema: `{ workorder_no: string }`.

Output schema: `MaintenanceApiResponse<MaintenancePartUsage[]>`.

Source API/service: `getSparePartUsageByWorkorder` -> `GET /api/maintenance/workorders/{workorderNo}/parts`.

Policy scope: workorder-level spare part usage.

Risk level: low.

Audit event name: `maintenance.parts.workorder_usage`.

Related Agent/Skill: future Spare Parts Analyst.

## maint_get_hold_reason_summary

Input schema: `Pick<MaintenanceQueryFilters, "site" | "department" | "equipment_type" | "from" | "to" | "limit">`.

Output schema: `MaintenanceApiResponse<MaintenanceHoldHistory[]>`.

Source API/service: `getHoldReasonSummary` -> `GET /api/maintenance/analytics/hold-reasons`.

Policy scope: hold reason aggregate analytics.

Risk level: low.

Audit event name: `maintenance.analytics.hold_reasons`.

Related Agent/Skill: future Maintenance Flow Analyst.

## maint_get_repeat_failures

Input schema: `MaintenanceQueryFilters`.

Output schema: `MaintenanceApiResponse<MaintenanceRiskMachine[]>`.

Source API/service: `getRepeatFailureCandidates` -> `GET /api/maintenance/analytics/repeat-failures`.

Policy scope: repeated failure candidate discovery.

Risk level: medium.

Audit event name: `maintenance.analytics.repeat_failures`.

Related Agent/Skill: future Root Cause Assistant.

## maint_get_stock_risk_summary

Input schema: `Pick<MaintenanceQueryFilters, "catalogue_no" | "stock_risk" | "limit">`.

Output schema: `MaintenanceApiResponse<MaintenanceRiskMachine[]>`.

Source API/service: `getStockRiskSummary` -> `GET /api/maintenance/analytics/stock-risk`.

Policy scope: spare part stock risk analytics, read-only.

Risk level: medium because incorrect interpretation can affect procurement urgency.

Audit event name: `maintenance.analytics.stock_risk`.

Related Agent/Skill: future Spare Parts Analyst.

## maint_get_dashboard_summary

Input schema: `MaintenanceQueryFilters`.

Output schema: `MaintenanceApiResponse<MaintenanceDashboardSummary>`.

Source API/service: `getMaintenanceDashboardSummary` -> `GET /api/maintenance/dashboard-summary`.

Policy scope: summarized maintenance KPI retrieval.

Risk level: low.

Audit event name: `maintenance.dashboard.summary`.

Related Agent/Skill: future Maintenance Operations Assistant.
