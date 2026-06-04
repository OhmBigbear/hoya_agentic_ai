CREATE OR REPLACE VIEW maintenance.v_workorder_tracking AS
SELECT
  wo.work_order_id,
  wo.workorder_no,
  wo.status,
  wo.job_type,
  wo.priority,
  wo.equipment_no,
  wo.equipment_desc,
  wo.site,
  wo.location,
  wo.department,
  wo.plan_start,
  wo.plan_finish,
  wo.act_work_start,
  wo.act_work_end,
  wo.total_repair_time_hours,
  wo.down_time_hours,
  wo.reason,
  wo.solution,
  wo.failure_description,
  wo.action_description,
  count(DISTINCT task.task_id) AS task_count,
  count(DISTINCT part_tx.part_transaction_id) AS part_transaction_count,
  coalesce(sum(part_tx.tran_qty) FILTER (WHERE upper(part_tx.transaction_type) = 'ISSUE'), 0) AS issued_qty
FROM maintenance.work_order wo
LEFT JOIN maintenance.work_order_task task ON task.work_order_id = wo.work_order_id
LEFT JOIN maintenance.work_order_part_transaction part_tx ON part_tx.work_order_id = wo.work_order_id
GROUP BY wo.work_order_id;

CREATE OR REPLACE VIEW maintenance.v_machine_maintenance_history AS
SELECT
  wo.equipment_no,
  coalesce(equipment.equipment_desc, wo.equipment_desc) AS equipment_desc,
  coalesce(equipment.equipment_type, wo.equipment_type) AS equipment_type,
  wo.workorder_no,
  wo.status,
  wo.job_type,
  wo.plan_start,
  wo.act_work_start,
  wo.act_work_end,
  wo.total_repair_time_hours,
  wo.down_time_hours,
  wo.reason,
  wo.solution,
  wo.failure_description,
  wo.action_description
FROM maintenance.work_order wo
LEFT JOIN maintenance.equipment equipment ON equipment.equipment_id = wo.equipment_id;

CREATE OR REPLACE VIEW maintenance.v_mtbf_mttr_base AS
SELECT
  equipment_no,
  equipment_desc,
  workorder_no,
  job_type,
  status,
  coalesce(act_work_start, plan_start) AS failure_start,
  coalesce(act_work_end, plan_finish) AS repair_end,
  total_repair_time_hours,
  down_time_hours,
  lag(coalesce(act_work_end, plan_finish)) OVER (
    PARTITION BY equipment_no
    ORDER BY coalesce(act_work_start, plan_start), workorder_no
  ) AS previous_repair_end,
  extract(epoch FROM (
    coalesce(act_work_start, plan_start)
    - lag(coalesce(act_work_end, plan_finish)) OVER (
      PARTITION BY equipment_no
      ORDER BY coalesce(act_work_start, plan_start), workorder_no
    )
  )) / 3600 AS hours_since_previous_repair
FROM maintenance.work_order
WHERE equipment_no IS NOT NULL
  AND (job_type ILIKE '%breakdown%' OR down_time_hours > 0 OR total_repair_time_hours > 0);

CREATE OR REPLACE VIEW maintenance.v_spare_part_usage_by_workorder AS
SELECT
  tx.workorder_no,
  wo.equipment_no,
  wo.equipment_desc,
  wo.job_type,
  wo.status,
  tx.catalogue_no,
  coalesce(part.part_name, tx.part_name) AS part_name,
  tx.uom,
  sum(tx.tran_qty) FILTER (WHERE upper(tx.transaction_type) = 'ISSUE') AS issued_qty,
  sum(abs(tx.tran_qty)) AS movement_qty,
  count(*) AS transaction_count,
  min(tx.transaction_date) AS first_transaction_at,
  max(tx.transaction_date) AS last_transaction_at
FROM maintenance.work_order_part_transaction tx
LEFT JOIN maintenance.work_order wo ON wo.work_order_id = tx.work_order_id
LEFT JOIN maintenance.part_catalog part ON part.part_id = tx.part_id
GROUP BY tx.workorder_no, wo.equipment_no, wo.equipment_desc, wo.job_type, wo.status, tx.catalogue_no, coalesce(part.part_name, tx.part_name), tx.uom;

CREATE OR REPLACE VIEW maintenance.v_hold_reason_summary AS
SELECT
  hold_reason_description,
  site,
  department,
  equipment_type,
  count(*) AS hold_count,
  count(DISTINCT workorder_no) AS affected_workorder_count,
  min(hold_date) AS first_hold_at,
  max(hold_date) AS last_hold_at
FROM maintenance.work_order_hold_history
GROUP BY hold_reason_description, site, department, equipment_type;

CREATE OR REPLACE VIEW maintenance.v_repeat_failure_candidates AS
SELECT
  equipment_no,
  coalesce(failure_description, reason, description) AS failure_signal,
  count(*) AS workorder_count,
  min(coalesce(act_work_start, plan_start)) AS first_seen_at,
  max(coalesce(act_work_start, plan_start)) AS last_seen_at,
  array_agg(workorder_no ORDER BY coalesce(act_work_start, plan_start) DESC) AS workorders
FROM maintenance.work_order
WHERE equipment_no IS NOT NULL
  AND coalesce(failure_description, reason, description) IS NOT NULL
GROUP BY equipment_no, coalesce(failure_description, reason, description)
HAVING count(*) >= 2;

CREATE OR REPLACE VIEW maintenance.v_stock_risk_summary AS
SELECT
  stock.catalogue_no,
  coalesce(part.part_name, stock.part_name) AS part_name,
  stock.uom,
  stock.warehouse_code,
  stock.bin_location,
  sum(stock.on_hand) AS on_hand,
  max(coalesce(stock.reorder_point, part.reorder_point)) AS reorder_point,
  max(coalesce(stock.min_qty, part.min_qty)) AS min_qty,
  sum(stock.stock_value) AS stock_value,
  CASE
    WHEN sum(stock.on_hand) = 0 THEN 'zero_stock'
    WHEN sum(stock.on_hand) <= coalesce(max(coalesce(stock.min_qty, part.min_qty)), 0) THEN 'below_min'
    WHEN sum(stock.on_hand) <= coalesce(max(coalesce(stock.reorder_point, part.reorder_point)), 0) THEN 'below_reorder_point'
    ELSE 'ok'
  END AS stock_risk
FROM maintenance.stock_balance stock
LEFT JOIN maintenance.part_catalog part ON part.part_id = stock.part_id
GROUP BY stock.catalogue_no, coalesce(part.part_name, stock.part_name), stock.uom, stock.warehouse_code, stock.bin_location;
