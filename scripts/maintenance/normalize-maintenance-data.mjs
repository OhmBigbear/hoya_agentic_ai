import { parseArgs, runPsqlSql } from './maintenance-csv-lib.mjs';

const NORMALIZE_SQL = `
CREATE TEMP TABLE maintenance_normalize_counts(label text primary key, rows_affected bigint);

INSERT INTO maintenance.warehouse (warehouse_code, warehouse_location_code, warehouse_name, source_system)
SELECT DISTINCT warehouse_code, coalesce(warehouse_location_code, ''), warehouse_code, 'maintenance_csv'
FROM (
  SELECT NULLIF(TRIM(warehouse), '') AS warehouse_code, NULLIF(TRIM(bin_location), '') AS warehouse_location_code
  FROM maintenance.stg_catalogue_items
  UNION
  SELECT NULLIF(TRIM(warehouse_id), ''), NULLIF(TRIM(warehouse_location_id), '')
  FROM maintenance.stg_transaction
  UNION
  SELECT NULLIF(TRIM(warehouse_id), ''), NULLIF(TRIM(warehouse_location_id), '')
  FROM maintenance.stg_transaction_history
  UNION
  SELECT NULLIF(TRIM(textbox54), ''), NULLIF(TRIM(bin_location), '')
  FROM maintenance.stg_stock_valuation
) source
WHERE warehouse_code IS NOT NULL
ON CONFLICT (warehouse_code, warehouse_location_code) DO UPDATE
SET updated_at = now();
INSERT INTO maintenance_normalize_counts VALUES ('warehouse', (SELECT count(*) FROM maintenance.warehouse))
ON CONFLICT (label) DO UPDATE SET rows_affected = EXCLUDED.rows_affected;

INSERT INTO maintenance.equipment (
  equipment_no, equipment_desc, equipment_type, model_no, serial_no, register_no,
  register_due_date, manufacturer, department, site, location, is_active, disposal_date,
  source_file, source_row_number, raw_row
)
SELECT DISTINCT ON (equipment_no)
  NULLIF(TRIM(equipment_no), ''),
  NULLIF(TRIM(equipment_desc), ''),
  NULLIF(TRIM(equipment_type), ''),
  NULLIF(TRIM(model_no), ''),
  NULLIF(TRIM(serial_no), ''),
  NULLIF(TRIM(register_no), ''),
  maintenance.parse_maintenance_date(register_due_date_text)::date,
  NULLIF(TRIM(manufacturer), ''),
  NULLIF(TRIM(department), ''),
  NULLIF(TRIM(site), ''),
  NULLIF(TRIM(location), ''),
  CASE WHEN lower(active_text) IN ('yes', 'y', 'true', '1') THEN true WHEN lower(active_text) IN ('no', 'n', 'false', '0') THEN false ELSE NULL END,
  maintenance.parse_maintenance_date(disposal_date_text)::date,
  source_file,
  source_row_number,
  raw_row
FROM maintenance.stg_equipment
WHERE NULLIF(TRIM(equipment_no), '') IS NOT NULL
ORDER BY equipment_no, source_row_number DESC
ON CONFLICT (equipment_no) DO UPDATE SET
  equipment_desc = EXCLUDED.equipment_desc,
  equipment_type = EXCLUDED.equipment_type,
  model_no = EXCLUDED.model_no,
  serial_no = EXCLUDED.serial_no,
  register_no = EXCLUDED.register_no,
  register_due_date = EXCLUDED.register_due_date,
  manufacturer = EXCLUDED.manufacturer,
  department = EXCLUDED.department,
  site = EXCLUDED.site,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active,
  disposal_date = EXCLUDED.disposal_date,
  source_file = EXCLUDED.source_file,
  source_row_number = EXCLUDED.source_row_number,
  raw_row = EXCLUDED.raw_row,
  updated_at = now();
INSERT INTO maintenance_normalize_counts VALUES ('equipment', (SELECT count(*) FROM maintenance.equipment))
ON CONFLICT (label) DO UPDATE SET rows_affected = EXCLUDED.rows_affected;

INSERT INTO maintenance.part_catalog (
  catalogue_no, part_name, catalogue_group, warehouse_code, bin_location, item_type,
  account_no, class_code, unit_cost, uom, on_hand, on_order, max_qty, reorder_point,
  min_qty, reorder_qty, source_file, source_row_number, raw_row
)
SELECT DISTINCT ON (catalogue_no)
  NULLIF(TRIM(catalogue_no), ''),
  NULLIF(TRIM(part_name), ''),
  NULLIF(TRIM(catalogue_group), ''),
  NULLIF(TRIM(warehouse), ''),
  NULLIF(TRIM(bin_location), ''),
  NULLIF(TRIM(item_type), ''),
  NULLIF(TRIM(account_no), ''),
  NULLIF(TRIM(class_code), ''),
  maintenance.parse_maintenance_number(cost_text),
  NULLIF(TRIM(uom), ''),
  maintenance.parse_maintenance_number(on_hand_text),
  maintenance.parse_maintenance_number(on_order_text),
  maintenance.parse_maintenance_number(max_text),
  maintenance.parse_maintenance_number(rop_text),
  maintenance.parse_maintenance_number(min_text),
  maintenance.parse_maintenance_number(roq_text),
  source_file,
  source_row_number,
  raw_row
FROM maintenance.stg_catalogue_items
WHERE NULLIF(TRIM(catalogue_no), '') IS NOT NULL
ORDER BY catalogue_no, source_row_number DESC
ON CONFLICT (catalogue_no) DO UPDATE SET
  part_name = EXCLUDED.part_name,
  catalogue_group = EXCLUDED.catalogue_group,
  warehouse_code = EXCLUDED.warehouse_code,
  bin_location = EXCLUDED.bin_location,
  item_type = EXCLUDED.item_type,
  account_no = EXCLUDED.account_no,
  class_code = EXCLUDED.class_code,
  unit_cost = EXCLUDED.unit_cost,
  uom = EXCLUDED.uom,
  on_hand = EXCLUDED.on_hand,
  on_order = EXCLUDED.on_order,
  max_qty = EXCLUDED.max_qty,
  reorder_point = EXCLUDED.reorder_point,
  min_qty = EXCLUDED.min_qty,
  reorder_qty = EXCLUDED.reorder_qty,
  source_file = EXCLUDED.source_file,
  source_row_number = EXCLUDED.source_row_number,
  raw_row = EXCLUDED.raw_row,
  updated_at = now();
INSERT INTO maintenance_normalize_counts VALUES ('part_catalog', (SELECT count(*) FROM maintenance.part_catalog))
ON CONFLICT (label) DO UPDATE SET rows_affected = EXCLUDED.rows_affected;

INSERT INTO maintenance.work_order (
  workorder_no, equipment_id, equipment_no, equipment_desc, site, site_desc, location,
  location_desc, department, department_desc, equipment_type, equipment_type_desc, status,
  priority, policy_no, policy_description, doc_id, plan_start, plan_finish, act_work_start,
  act_work_end, est_duration_hours, total_repair_time_hours, normal_hour_used, down_time_hours,
  cause_id, plan_mat_cost, plan_labor_cost, plan_other_cost, act_mat_cost, act_labour_cost,
  act_other_cost, note, reason, solution, description, reference, account_code, customer_code,
  job_type, serial_no, hold_reason_code, warranty_no, satisfaction, satisfaction_note,
  request_no, request_by, request_date, assign_employee, actual_employee, update_by,
  update_date, cause_path, cause_description, failure_path, failure_description, action_path,
  action_description, func_location, equdf4, accepted_by, source_file, source_row_number, raw_row
)
SELECT DISTINCT ON (wo.workorder_no)
  NULLIF(TRIM(wo.workorder_no), ''),
  equipment.equipment_id,
  NULLIF(TRIM(wo.equipment_no), ''),
  NULLIF(TRIM(wo.equipment_desc), ''),
  NULLIF(TRIM(wo.site), ''),
  NULLIF(TRIM(wo.site_desc), ''),
  NULLIF(TRIM(wo.location), ''),
  NULLIF(TRIM(wo.location_desc), ''),
  NULLIF(TRIM(wo.department), ''),
  NULLIF(TRIM(wo.department_desc), ''),
  NULLIF(TRIM(wo.equipment_type), ''),
  NULLIF(TRIM(wo.equipment_type_desc), ''),
  NULLIF(TRIM(wo.status), ''),
  NULLIF(TRIM(wo.priority), ''),
  NULLIF(TRIM(wo.policy_no), ''),
  NULLIF(TRIM(wo.policy_description), ''),
  NULLIF(TRIM(wo.doc_id), ''),
  maintenance.parse_maintenance_date(wo.plan_start_text),
  maintenance.parse_maintenance_date(wo.plan_finish_text),
  maintenance.parse_maintenance_date(wo.act_work_start_text),
  maintenance.parse_maintenance_date(wo.act_work_end_text),
  maintenance.parse_maintenance_number(wo.est_duration_text),
  maintenance.parse_maintenance_number(wo.total_repair_time_text),
  maintenance.parse_maintenance_number(wo.normal_hour_used_text),
  maintenance.parse_maintenance_number(wo.down_time_text),
  NULLIF(TRIM(wo.cause_id), ''),
  maintenance.parse_maintenance_number(wo.plan_mat_cost_text),
  maintenance.parse_maintenance_number(wo.plan_labor_cost_text),
  maintenance.parse_maintenance_number(wo.plan_other_cost_text),
  maintenance.parse_maintenance_number(wo.act_mat_cost_text),
  maintenance.parse_maintenance_number(wo.act_labour_cost_text),
  maintenance.parse_maintenance_number(wo.act_other_cost_text),
  NULLIF(TRIM(wo.note), ''),
  NULLIF(TRIM(wo.reason), ''),
  NULLIF(TRIM(wo.solution), ''),
  NULLIF(TRIM(wo.description), ''),
  NULLIF(TRIM(wo.reference), ''),
  NULLIF(TRIM(wo.account_code), ''),
  NULLIF(TRIM(wo.customer_code), ''),
  NULLIF(TRIM(wo.job_type), ''),
  NULLIF(TRIM(wo.serial_no), ''),
  NULLIF(TRIM(wo.hold_reason_code), ''),
  NULLIF(TRIM(wo.warranty_no), ''),
  NULLIF(TRIM(wo.satisfaction), ''),
  NULLIF(TRIM(wo.satisfaction_note), ''),
  NULLIF(TRIM(wo.request_no), ''),
  NULLIF(TRIM(wo.request_by), ''),
  maintenance.parse_maintenance_date(wo.request_date_text),
  NULLIF(TRIM(wo.assign_employee), ''),
  NULLIF(TRIM(wo.actual_employee), ''),
  NULLIF(TRIM(wo.update_by), ''),
  maintenance.parse_maintenance_date(wo.update_date_text),
  NULLIF(TRIM(wo.cause_path), ''),
  NULLIF(TRIM(wo.cause_description), ''),
  NULLIF(TRIM(wo.failure_path), ''),
  NULLIF(TRIM(wo.failure_description), ''),
  NULLIF(TRIM(wo.action_path), ''),
  NULLIF(TRIM(wo.action_description), ''),
  NULLIF(TRIM(wo.func_location), ''),
  NULLIF(TRIM(wo.equdf4), ''),
  NULLIF(TRIM(wo.accepted_by), ''),
  wo.source_file,
  wo.source_row_number,
  wo.raw_row
FROM maintenance.stg_workorder wo
LEFT JOIN maintenance.equipment equipment ON equipment.equipment_no = NULLIF(TRIM(wo.equipment_no), '')
WHERE NULLIF(TRIM(wo.workorder_no), '') IS NOT NULL
ORDER BY wo.workorder_no, wo.source_row_number DESC
ON CONFLICT (workorder_no) DO UPDATE SET
  equipment_id = EXCLUDED.equipment_id,
  equipment_no = EXCLUDED.equipment_no,
  equipment_desc = EXCLUDED.equipment_desc,
  status = EXCLUDED.status,
  job_type = EXCLUDED.job_type,
  plan_start = EXCLUDED.plan_start,
  plan_finish = EXCLUDED.plan_finish,
  act_work_start = EXCLUDED.act_work_start,
  act_work_end = EXCLUDED.act_work_end,
  total_repair_time_hours = EXCLUDED.total_repair_time_hours,
  down_time_hours = EXCLUDED.down_time_hours,
  reason = EXCLUDED.reason,
  solution = EXCLUDED.solution,
  description = EXCLUDED.description,
  failure_description = EXCLUDED.failure_description,
  action_description = EXCLUDED.action_description,
  source_file = EXCLUDED.source_file,
  source_row_number = EXCLUDED.source_row_number,
  raw_row = EXCLUDED.raw_row,
  updated_at = now();
INSERT INTO maintenance_normalize_counts VALUES ('work_order', (SELECT count(*) FROM maintenance.work_order))
ON CONFLICT (label) DO UPDATE SET rows_affected = EXCLUDED.rows_affected;

INSERT INTO maintenance.work_order_task (
  work_order_id, workorder_no, task_no, description_1, description_2, value_text,
  reference, authorizer, request_no, source_file, source_row_number, raw_row
)
SELECT
  work_order.work_order_id,
  NULLIF(TRIM(task.workorder_no), ''),
  NULLIF(TRIM(task.task_no), ''),
  NULLIF(TRIM(task.description_1), ''),
  NULLIF(TRIM(task.description_2), ''),
  NULLIF(TRIM(task.value_text), ''),
  NULLIF(TRIM(task.reference), ''),
  NULLIF(TRIM(task.authorizer), ''),
  NULLIF(TRIM(task.request_no), ''),
  task.source_file,
  task.source_row_number,
  task.raw_row
FROM maintenance.stg_task task
LEFT JOIN maintenance.work_order ON work_order.workorder_no = NULLIF(TRIM(task.workorder_no), '')
WHERE NULLIF(TRIM(task.workorder_no), '') IS NOT NULL
ON CONFLICT (workorder_no, task_no, source_row_number) DO UPDATE SET
  work_order_id = EXCLUDED.work_order_id,
  description_1 = EXCLUDED.description_1,
  description_2 = EXCLUDED.description_2,
  value_text = EXCLUDED.value_text,
  reference = EXCLUDED.reference,
  authorizer = EXCLUDED.authorizer,
  request_no = EXCLUDED.request_no,
  raw_row = EXCLUDED.raw_row,
  updated_at = now();
INSERT INTO maintenance_normalize_counts VALUES ('work_order_task', (SELECT count(*) FROM maintenance.work_order_task))
ON CONFLICT (label) DO UPDATE SET rows_affected = EXCLUDED.rows_affected;

INSERT INTO maintenance.work_order_hold_history (
  work_order_id, workorder_no, equipment_id, equipment_no, equipment_desc, hold_date,
  hold_reason_description, plan_start, plan_finish, hold_by, site, location, department,
  equipment_type, operator_id, func_location, source_file, source_row_number, raw_row
)
SELECT
  work_order.work_order_id,
  NULLIF(TRIM(hold.workorder_no), ''),
  equipment.equipment_id,
  NULLIF(TRIM(hold.equipment_no), ''),
  NULLIF(TRIM(hold.equipment_desc), ''),
  maintenance.parse_maintenance_date(hold.hold_date_text),
  NULLIF(TRIM(hold.hold_reason_description), ''),
  maintenance.parse_maintenance_date(hold.plan_start_text),
  maintenance.parse_maintenance_date(hold.plan_finish_text),
  NULLIF(TRIM(hold.hold_by), ''),
  NULLIF(TRIM(hold.site), ''),
  NULLIF(TRIM(hold.location), ''),
  NULLIF(TRIM(hold.department), ''),
  NULLIF(TRIM(hold.equipment_type), ''),
  NULLIF(TRIM(hold.operator_id), ''),
  NULLIF(TRIM(hold.func_location), ''),
  hold.source_file,
  hold.source_row_number,
  hold.raw_row
FROM maintenance.stg_hold_workorder_history hold
LEFT JOIN maintenance.work_order ON work_order.workorder_no = NULLIF(TRIM(hold.workorder_no), '')
LEFT JOIN maintenance.equipment ON equipment.equipment_no = NULLIF(TRIM(hold.equipment_no), '')
WHERE NULLIF(TRIM(hold.workorder_no), '') IS NOT NULL
ON CONFLICT (source_file, source_row_number) DO UPDATE SET
  work_order_id = EXCLUDED.work_order_id,
  equipment_id = EXCLUDED.equipment_id,
  hold_reason_description = EXCLUDED.hold_reason_description,
  raw_row = EXCLUDED.raw_row,
  updated_at = now();
INSERT INTO maintenance_normalize_counts VALUES ('work_order_hold_history', (SELECT count(*) FROM maintenance.work_order_hold_history))
ON CONFLICT (label) DO UPDATE SET rows_affected = EXCLUDED.rows_affected;

INSERT INTO maintenance.work_order_part_transaction (
  work_order_id, workorder_no, equipment_id, equipment_no, equipment_desc, part_id,
  catalogue_no, part_name, transaction_date, transaction_type, tran_qty, uom, serial_no,
  warehouse_code, warehouse_location_code, comment1, comment2, comment3, user_id,
  first_name, last_name, source_file, source_row_number, raw_row
)
SELECT
  work_order.work_order_id,
  NULLIF(TRIM(tx.workorder_no), ''),
  equipment.equipment_id,
  NULLIF(TRIM(tx.equipment_no), ''),
  NULLIF(TRIM(tx.equipment_desc), ''),
  part_catalog.part_id,
  NULLIF(TRIM(tx.catalogue_no), ''),
  NULLIF(TRIM(tx.part_name), ''),
  maintenance.parse_maintenance_date(tx.transaction_date_text),
  NULLIF(TRIM(tx.transaction_type), ''),
  maintenance.parse_maintenance_number(tx.tran_qty_text),
  NULLIF(TRIM(tx.uom), ''),
  NULLIF(TRIM(tx.serial_no), ''),
  NULLIF(TRIM(tx.warehouse_id), ''),
  NULLIF(TRIM(tx.warehouse_location_id), ''),
  NULLIF(TRIM(tx.comment1), ''),
  NULLIF(TRIM(tx.comment2), ''),
  NULLIF(TRIM(tx.comment3), ''),
  NULLIF(TRIM(tx.user_id), ''),
  NULLIF(TRIM(tx.first_name), ''),
  NULLIF(TRIM(tx.last_name), ''),
  tx.source_file,
  tx.source_row_number,
  tx.raw_row
FROM maintenance.stg_transaction tx
LEFT JOIN maintenance.work_order ON work_order.workorder_no = NULLIF(TRIM(tx.workorder_no), '')
LEFT JOIN maintenance.equipment ON equipment.equipment_no = NULLIF(TRIM(tx.equipment_no), '')
LEFT JOIN maintenance.part_catalog ON part_catalog.catalogue_no = NULLIF(TRIM(tx.catalogue_no), '')
WHERE NULLIF(TRIM(tx.catalogue_no), '') IS NOT NULL
ON CONFLICT (source_file, source_row_number) DO UPDATE SET
  work_order_id = EXCLUDED.work_order_id,
  equipment_id = EXCLUDED.equipment_id,
  part_id = EXCLUDED.part_id,
  transaction_date = EXCLUDED.transaction_date,
  transaction_type = EXCLUDED.transaction_type,
  tran_qty = EXCLUDED.tran_qty,
  raw_row = EXCLUDED.raw_row,
  updated_at = now();
INSERT INTO maintenance_normalize_counts VALUES ('work_order_part_transaction', (SELECT count(*) FROM maintenance.work_order_part_transaction))
ON CONFLICT (label) DO UPDATE SET rows_affected = EXCLUDED.rows_affected;

INSERT INTO maintenance.inventory_transaction_history (
  part_id, catalogue_no, part_name, transaction_date, transaction_type, batch_no,
  tran_qty, tran_value, run_total, uom, serial_no, warehouse_code, warehouse_location_code,
  workorder_no, comment1, user_id, source_file, source_row_number, raw_row
)
SELECT
  part_catalog.part_id,
  NULLIF(TRIM(hist.catalogue_no), ''),
  NULLIF(TRIM(hist.part_name), ''),
  maintenance.parse_maintenance_date(hist.transaction_date_text),
  NULLIF(TRIM(hist.transaction_type), ''),
  NULLIF(TRIM(hist.batch_no), ''),
  maintenance.parse_maintenance_number(hist.tran_qty_text),
  maintenance.parse_maintenance_number(hist.tran_value_text),
  maintenance.parse_maintenance_number(hist.run_total_text),
  NULLIF(TRIM(hist.uom), ''),
  NULLIF(TRIM(hist.serial_no), ''),
  NULLIF(TRIM(hist.warehouse_id), ''),
  NULLIF(TRIM(hist.warehouse_location_id), ''),
  NULLIF(TRIM(hist.workorder_no), ''),
  NULLIF(TRIM(hist.comment1), ''),
  NULLIF(TRIM(hist.user_id), ''),
  hist.source_file,
  hist.source_row_number,
  hist.raw_row
FROM maintenance.stg_transaction_history hist
LEFT JOIN maintenance.part_catalog ON part_catalog.catalogue_no = NULLIF(TRIM(hist.catalogue_no), '')
WHERE NULLIF(TRIM(hist.catalogue_no), '') IS NOT NULL
ON CONFLICT (source_file, source_row_number) DO UPDATE SET
  part_id = EXCLUDED.part_id,
  transaction_date = EXCLUDED.transaction_date,
  transaction_type = EXCLUDED.transaction_type,
  tran_qty = EXCLUDED.tran_qty,
  tran_value = EXCLUDED.tran_value,
  run_total = EXCLUDED.run_total,
  raw_row = EXCLUDED.raw_row,
  updated_at = now();
INSERT INTO maintenance_normalize_counts VALUES ('inventory_transaction_history', (SELECT count(*) FROM maintenance.inventory_transaction_history))
ON CONFLICT (label) DO UPDATE SET rows_affected = EXCLUDED.rows_affected;

INSERT INTO maintenance.stock_balance (
  part_id, catalogue_no, part_name, uom, warehouse_code, bin_location, batch_no,
  serial_no, min_qty, max_qty, reorder_point, on_hand, stock_value, qty, unit_price,
  source_file, source_row_number, raw_row
)
SELECT
  part_catalog.part_id,
  NULLIF(TRIM(stock.catalogue_no), ''),
  NULLIF(TRIM(stock.part_name), ''),
  NULLIF(TRIM(stock.uom), ''),
  NULLIF(TRIM(stock.textbox54), ''),
  NULLIF(TRIM(stock.bin_location), ''),
  NULLIF(TRIM(stock.batch_no), ''),
  NULLIF(TRIM(stock.serial_no), ''),
  maintenance.parse_maintenance_number(stock.min_text),
  maintenance.parse_maintenance_number(stock.max_text),
  maintenance.parse_maintenance_number(stock.rop_text),
  maintenance.parse_maintenance_number(stock.on_hand_text),
  maintenance.parse_maintenance_number(stock.value_text),
  maintenance.parse_maintenance_number(stock.qty_text),
  maintenance.parse_maintenance_number(stock.unit_price_text),
  stock.source_file,
  stock.source_row_number,
  stock.raw_row
FROM maintenance.stg_stock_valuation stock
LEFT JOIN maintenance.part_catalog ON part_catalog.catalogue_no = NULLIF(TRIM(stock.catalogue_no), '')
WHERE NULLIF(TRIM(stock.catalogue_no), '') IS NOT NULL
ON CONFLICT (source_file, source_row_number) DO UPDATE SET
  part_id = EXCLUDED.part_id,
  part_name = EXCLUDED.part_name,
  on_hand = EXCLUDED.on_hand,
  stock_value = EXCLUDED.stock_value,
  qty = EXCLUDED.qty,
  unit_price = EXCLUDED.unit_price,
  raw_row = EXCLUDED.raw_row,
  updated_at = now();
INSERT INTO maintenance_normalize_counts VALUES ('stock_balance', (SELECT count(*) FROM maintenance.stock_balance))
ON CONFLICT (label) DO UPDATE SET rows_affected = EXCLUDED.rows_affected;

SELECT label, rows_affected FROM maintenance_normalize_counts ORDER BY label;
`;

function usage() {
  console.log('Usage: node scripts/maintenance/normalize-maintenance-data.mjs [--dry-run]');
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    usage();
    return;
  }

  if (args.dryRun) {
    console.log('[dry-run] normalization SQL validated locally; DATABASE_URL not required.');
    console.log('Would upsert warehouse, equipment, part catalog, work orders, tasks, holds, transactions, history, and stock balances.');
    return;
  }

  await runPsqlSql(NORMALIZE_SQL);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
