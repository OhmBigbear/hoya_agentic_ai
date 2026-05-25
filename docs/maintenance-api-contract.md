# Maintenance Workorder API Contract

This contract defines the backend surface consumed by `src/services/maintenanceWorkorderApi.ts`. The current UI repo is frontend-first, so these endpoints are contracts for the Agentic Core/API backend. Application services must read normalized `maintenance.*` tables or `maintenance.v_*` agent-ready views, never raw staging tables.

Common response envelope:

```ts
{
  data: T;
  total?: number;
  trace_id?: string;
  warnings?: string[];
}
```

Common filters:

`site`, `location`, `department`, `equipment_no`, `equipment_type`, `workorder_no`, `status`, `job_type`, `priority`, `catalogue_no`, `stock_risk`, `from`, `to`, `limit`.

## GET /api/maintenance/workorders

Purpose: Return trackable workorder rows for search, list pages, and future AI retrieval.

Query parameters: common filters. `from` and `to` filter planned/actual date windows. `limit` defaults should be backend-controlled.

Response schema: `MaintenanceApiResponse<MaintenanceWorkOrder[]>`.

Database source: `maintenance.v_workorder_tracking`.

Future Agentic Core Tool mapping: `maint_get_workorders`.

## GET /api/maintenance/workorders/{workorderNo}

Purpose: Return one workorder with equipment, tasks, spare parts, and hold history for drill-down and evidence grounding.

Query parameters: none.

Response schema: `MaintenanceApiResponse<MaintenanceWorkOrderDetail>`.

Database source: normalized tables `maintenance.work_order`, `maintenance.equipment`, `maintenance.work_order_task`, `maintenance.work_order_hold_history`, plus view `maintenance.v_spare_part_usage_by_workorder`.

Future Agentic Core Tool mapping: `maint_get_workorder_detail`.

## GET /api/maintenance/equipment/{equipmentNo}/history

Purpose: Return historical workorders for one machine/equipment number.

Query parameters: common date, status, job type, and limit filters.

Response schema: `MaintenanceApiResponse<MaintenanceWorkOrder[]>`.

Database source: `maintenance.v_machine_maintenance_history`.

Future Agentic Core Tool mapping: `maint_get_machine_maintenance_history`.

## GET /api/maintenance/analytics/mtbf-mttr

Purpose: Return reliability summary rows for MTBF and MTTR analysis.

Query parameters: common equipment, site, department, date, job type, and limit filters.

Response schema: `MaintenanceApiResponse<MaintenanceMtbfMttrSummary[]>`.

Database source: aggregate over `maintenance.v_mtbf_mttr_base`.

Future Agentic Core Tool mapping: `maint_get_mtbf_mttr`.

## GET /api/maintenance/workorders/{workorderNo}/parts

Purpose: Return spare part issue/movement summary for one workorder.

Query parameters: none.

Response schema: `MaintenanceApiResponse<MaintenancePartUsage[]>`.

Database source: `maintenance.v_spare_part_usage_by_workorder`.

Future Agentic Core Tool mapping: `maint_get_spare_part_usage`.

## GET /api/maintenance/analytics/hold-reasons

Purpose: Return hold reason frequency and affected workorder counts.

Query parameters: `site`, `department`, `equipment_type`, `from`, `to`, `limit`.

Response schema: `MaintenanceApiResponse<MaintenanceHoldHistory[]>`.

Database source: `maintenance.v_hold_reason_summary`.

Future Agentic Core Tool mapping: `maint_get_hold_reason_summary`.

## GET /api/maintenance/analytics/repeat-failures

Purpose: Return equipment/failure combinations that appear repeatedly and may need RCA.

Query parameters: common equipment, date, department, job type, and limit filters.

Response schema: `MaintenanceApiResponse<MaintenanceRiskMachine[]>`.

Database source: `maintenance.v_repeat_failure_candidates`.

Future Agentic Core Tool mapping: `maint_get_repeat_failures`.

## GET /api/maintenance/analytics/stock-risk

Purpose: Return spare parts with zero stock, below-min, or below-reorder-point risk.

Query parameters: `catalogue_no`, `stock_risk`, `site`, `limit`.

Response schema: `MaintenanceApiResponse<MaintenanceRiskMachine[]>`.

Database source: `maintenance.v_stock_risk_summary`.

Future Agentic Core Tool mapping: `maint_get_stock_risk_summary`.

## GET /api/maintenance/dashboard-summary

Purpose: Return compact dashboard metrics for future maintenance overview UI and executive summaries.

Query parameters: common site, department, equipment, date, and limit filters.

Response schema: `MaintenanceApiResponse<MaintenanceDashboardSummary>`.

Database source: aggregates over `maintenance.v_workorder_tracking`, `maintenance.v_hold_reason_summary`, `maintenance.v_repeat_failure_candidates`, `maintenance.v_stock_risk_summary`, and `maintenance.v_mtbf_mttr_base`.

Future Agentic Core Tool mapping: `maint_get_dashboard_summary`.
