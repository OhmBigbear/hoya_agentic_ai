# Maintenance Database Design

This foundation keeps maintenance data in its own PostgreSQL schema, `maintenance`, separate from Agentic Core `control_plane` data. CSV rows land in staging first, then repeatable normalization upserts populate operational tables and Agent-ready views.

## Import Flow

1. `maintenance:profile` reads `./uploads`, detects headers, and writes `docs/maintenance-data-profile.md`.
2. `maintenance:db:rebuild` applies SQL migrations from `database/maintenance` in lexical order.
3. `maintenance:import` reloads staging tables by deleting prior rows for the same `source_file`, then copying parsed CSV rows into staging with `source_file`, `source_row_number`, and `raw_row`.
4. `maintenance:normalize` upserts normalized records from staging. Natural keys are used only where stable enough, such as `workorder_no`, `equipment_no`, and `catalogue_no`; UUID surrogate keys support joins and future references.

Dry-run mode is available for all maintenance scripts and does not require a live database for profiling or import validation.

## ERD-Style Model

`equipment` is the machine master. `work_order` references `equipment` when the equipment number exists in the master file, while also keeping the original equipment text from the work order export for traceability.

`part_catalog` is the spare part master keyed by `catalogue_no`. `warehouse` captures warehouse/location pairs observed in catalogue, stock, and transaction exports.

`work_order_task` belongs to `work_order` and stores the task checklist/inspection lines. `work_order_hold_history` belongs to `work_order` and optionally `equipment`; it tracks hold dates and hold reasons.

`work_order_part_transaction` links work orders, equipment, and parts for spare part movement tied to a maintenance job. `inventory_transaction_history` captures inventory movement whether or not a work order is present. `stock_balance` captures batch/bin/serial stock valuation snapshots.

All staging tables retain original text fields because exported maintenance data contains mixed date formats, report preambles, localized text, and occasionally unstable natural keys.

## Table Purpose

`maintenance.stg_equipment`: Raw equipment export after skipping the report preamble.

`maintenance.stg_workorder`: Raw work order export with costs, dates, status, job type, reason, failure, and action fields.

`maintenance.stg_task`: Raw work order task lines.

`maintenance.stg_transaction`: Raw work-order-linked spare part transactions.

`maintenance.stg_hold_workorder_history`: Raw hold history records.

`maintenance.stg_catalogue_items`: Raw catalogue/part master export.

`maintenance.stg_stock_valuation`: Raw stock valuation export.

`maintenance.stg_transaction_history`: Raw inventory transaction history export.

`maintenance.equipment`: Normalized machine master.

`maintenance.part_catalog`: Normalized spare part master and reorder attributes.

`maintenance.work_order`: Normalized maintenance job header and diagnosis/action fields.

`maintenance.work_order_task`: Normalized work order task/checklist rows.

`maintenance.work_order_hold_history`: Normalized hold reason history.

`maintenance.work_order_part_transaction`: Normalized spare part usage by work order.

`maintenance.inventory_transaction_history`: Normalized inventory movement history.

`maintenance.stock_balance`: Normalized stock valuation and risk inputs.

`maintenance.warehouse`: Warehouse/location reference table.

## Key Relationships

`work_order.equipment_id -> equipment.equipment_id`

`work_order_task.work_order_id -> work_order.work_order_id`

`work_order_hold_history.work_order_id -> work_order.work_order_id`

`work_order_hold_history.equipment_id -> equipment.equipment_id`

`work_order_part_transaction.work_order_id -> work_order.work_order_id`

`work_order_part_transaction.equipment_id -> equipment.equipment_id`

`work_order_part_transaction.part_id -> part_catalog.part_id`

`inventory_transaction_history.part_id -> part_catalog.part_id`

`stock_balance.part_id -> part_catalog.part_id`

## Agent-Ready Views

`maintenance.v_workorder_tracking`: Work order status, job timing, task counts, and part movement counts.

`maintenance.v_machine_maintenance_history`: Machine-level maintenance timeline for retrieval and summarization.

`maintenance.v_mtbf_mttr_base`: Breakdown-oriented base rows for MTBF/MTTR calculations.

`maintenance.v_spare_part_usage_by_workorder`: Spare part issue/movement aggregation by work order.

`maintenance.v_hold_reason_summary`: Hold reason counts by site, department, and equipment type.

`maintenance.v_repeat_failure_candidates`: Repeated failure signals by equipment number.

`maintenance.v_stock_risk_summary`: On-hand stock compared with min/reorder thresholds.

## Future Tools/Skills Mapping

Future Agentic Core tools can query views instead of raw tables:

`WorkorderTrackingTool`: `v_workorder_tracking`

`MachineHistoryTool`: `v_machine_maintenance_history`

`ReliabilityMetricsTool`: `v_mtbf_mttr_base`

`SparePartUsageTool`: `v_spare_part_usage_by_workorder`

`HoldReasonAnalysisTool`: `v_hold_reason_summary`

`RepeatFailureCandidateTool`: `v_repeat_failure_candidates`

`StockRiskTool`: `v_stock_risk_summary`

This round intentionally does not create Agentic Core tools or skills.

## Operational Commands

```bash
npm run maintenance:profile
npm run maintenance:db:rebuild -- --dry-run
DATABASE_URL='postgres://user:pass@host:5432/db' npm run maintenance:db:rebuild
```
