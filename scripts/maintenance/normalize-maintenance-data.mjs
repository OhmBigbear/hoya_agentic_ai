import { parseArgs } from './maintenance-csv-lib.mjs';

const DUPLICATE_SAMPLE_LIMIT = 5;

function sourceKeyConflictDiagnostic(label, stage, keyColumns, sourceSql, whereSql = 'TRUE') {
  const keySelect = keyColumns.map(({ expression, alias }) => `${expression} AS ${alias}`).join(',\n    ');
  const keyList = keyColumns.map(({ alias }) => alias).join(', ');
  const keyJson = keyColumns.map(({ alias }) => `'${alias}', ${alias}`).join(', ');

  return {
    label,
    stage,
    sql: `
WITH source AS (
  ${sourceSql}
),
normalized AS (
  SELECT
    ${keySelect},
    source_file AS diagnostic_source_file,
    source_row_number AS diagnostic_source_row_number
  FROM source
  WHERE ${whereSql}
),
duplicate_groups AS (
  SELECT
    jsonb_build_object(${keyJson}) AS conflict_key,
    count(*)::int AS duplicate_rows,
    min(diagnostic_source_file) AS first_source_file,
    min(diagnostic_source_row_number) AS first_source_row_number,
    max(diagnostic_source_row_number) AS last_source_row_number
  FROM normalized
  GROUP BY ${keyList}
  HAVING count(*) > 1
)
SELECT
  (SELECT count(*)::int FROM duplicate_groups) AS duplicate_group_count,
  coalesce(jsonb_agg(duplicate_groups ORDER BY duplicate_rows DESC, conflict_key) FILTER (WHERE duplicate_groups.conflict_key IS NOT NULL), '[]'::jsonb) AS sample
FROM (
  SELECT *
  FROM duplicate_groups
  ORDER BY duplicate_rows DESC, conflict_key
  LIMIT ${DUPLICATE_SAMPLE_LIMIT}
) duplicate_groups;
`,
  };
}

export const NORMALIZE_STEPS = [
  {
    label: 'warehouse',
    target: 'maintenance.warehouse',
    stage: 'maintenance.stg_catalogue_items, maintenance.stg_transaction, maintenance.stg_transaction_history, maintenance.stg_stock_valuation',
    diagnostics: [
      sourceKeyConflictDiagnostic(
        'warehouse conflict key',
        'maintenance warehouse staging sources',
        [
          { alias: 'warehouse_code', expression: "NULLIF(TRIM(warehouse_code), '')" },
          { alias: 'warehouse_location_code', expression: "coalesce(NULLIF(TRIM(warehouse_location_code), ''), '')" },
        ],
        `
  SELECT source_file, source_row_number, warehouse, bin_location, NULLIF(TRIM(warehouse), '') AS warehouse_code, NULLIF(TRIM(bin_location), '') AS warehouse_location_code
  FROM maintenance.stg_catalogue_items
  UNION ALL
  SELECT source_file, source_row_number, warehouse_id, warehouse_location_id, NULLIF(TRIM(warehouse_id), ''), NULLIF(TRIM(warehouse_location_id), '')
  FROM maintenance.stg_transaction
  UNION ALL
  SELECT source_file, source_row_number, warehouse_id, warehouse_location_id, NULLIF(TRIM(warehouse_id), ''), NULLIF(TRIM(warehouse_location_id), '')
  FROM maintenance.stg_transaction_history
  UNION ALL
  SELECT source_file, source_row_number, textbox54, bin_location, NULLIF(TRIM(textbox54), ''), NULLIF(TRIM(bin_location), '')
  FROM maintenance.stg_stock_valuation
`,
        "NULLIF(TRIM(warehouse_code), '') IS NOT NULL",
      ),
    ],
    sql: `
WITH source AS (
  SELECT NULLIF(TRIM(warehouse), '') AS warehouse_code, NULLIF(TRIM(bin_location), '') AS warehouse_location_code
  FROM maintenance.stg_catalogue_items
  UNION ALL
  SELECT NULLIF(TRIM(warehouse_id), ''), NULLIF(TRIM(warehouse_location_id), '')
  FROM maintenance.stg_transaction
  UNION ALL
  SELECT NULLIF(TRIM(warehouse_id), ''), NULLIF(TRIM(warehouse_location_id), '')
  FROM maintenance.stg_transaction_history
  UNION ALL
  SELECT NULLIF(TRIM(textbox54), ''), NULLIF(TRIM(bin_location), '')
  FROM maintenance.stg_stock_valuation
),
deduped AS (
  SELECT DISTINCT ON (warehouse_code, warehouse_location_code)
    warehouse_code,
    warehouse_location_code
  FROM (
    SELECT warehouse_code, coalesce(warehouse_location_code, '') AS warehouse_location_code
    FROM source
    WHERE warehouse_code IS NOT NULL
  ) normalized
  ORDER BY warehouse_code, warehouse_location_code
)
INSERT INTO maintenance.warehouse (warehouse_code, warehouse_location_code, warehouse_name, source_system)
SELECT warehouse_code, warehouse_location_code, warehouse_code, 'maintenance_csv'
FROM deduped
ON CONFLICT (warehouse_code, warehouse_location_code) DO UPDATE
SET updated_at = now();
`,
  },
  {
    label: 'equipment',
    target: 'maintenance.equipment',
    stage: 'maintenance.stg_equipment',
    diagnostics: [
      sourceKeyConflictDiagnostic(
        'equipment equipment_no',
        'maintenance.stg_equipment',
        [{ alias: 'equipment_no', expression: "NULLIF(TRIM(equipment_no), '')" }],
        'SELECT source_file, source_row_number, equipment_no FROM maintenance.stg_equipment',
        "NULLIF(TRIM(equipment_no), '') IS NOT NULL",
      ),
    ],
    sql: `
WITH ranked AS (
  SELECT
    *,
    NULLIF(TRIM(equipment_no), '') AS normalized_equipment_no,
    CASE WHEN lower(active_text) IN ('yes', 'y', 'true', '1') THEN true WHEN lower(active_text) IN ('no', 'n', 'false', '0') THEN false ELSE NULL END AS normalized_is_active,
    maintenance.parse_maintenance_date(register_due_date_text)::date AS normalized_register_due_date,
    maintenance.parse_maintenance_date(disposal_date_text)::date AS normalized_disposal_date,
    ROW_NUMBER() OVER (
      PARTITION BY NULLIF(TRIM(equipment_no), '')
      ORDER BY
        CASE WHEN lower(active_text) IN ('yes', 'y', 'true', '1') THEN 0 WHEN lower(active_text) IN ('no', 'n', 'false', '0') THEN 1 ELSE 2 END,
        maintenance.parse_maintenance_date(register_due_date_text)::date DESC NULLS LAST,
        source_row_number DESC,
        source_file DESC
    ) AS row_rank
  FROM maintenance.stg_equipment
  WHERE NULLIF(TRIM(equipment_no), '') IS NOT NULL
)
INSERT INTO maintenance.equipment (
  equipment_no, equipment_desc, equipment_type, model_no, serial_no, register_no,
  register_due_date, manufacturer, department, site, location, is_active, disposal_date,
  source_file, source_row_number, raw_row
)
SELECT
  normalized_equipment_no,
  NULLIF(TRIM(equipment_desc), ''),
  NULLIF(TRIM(equipment_type), ''),
  NULLIF(TRIM(model_no), ''),
  NULLIF(TRIM(serial_no), ''),
  NULLIF(TRIM(register_no), ''),
  normalized_register_due_date,
  NULLIF(TRIM(manufacturer), ''),
  NULLIF(TRIM(department), ''),
  NULLIF(TRIM(site), ''),
  NULLIF(TRIM(location), ''),
  normalized_is_active,
  normalized_disposal_date,
  source_file,
  source_row_number,
  raw_row
FROM ranked
WHERE row_rank = 1
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
`,
  },
  {
    label: 'part_catalog',
    target: 'maintenance.part_catalog',
    stage: 'maintenance.stg_catalogue_items',
    diagnostics: [
      sourceKeyConflictDiagnostic(
        'part_catalog catalogue_no',
        'maintenance.stg_catalogue_items',
        [{ alias: 'catalogue_no', expression: "NULLIF(TRIM(catalogue_no), '')" }],
        'SELECT source_file, source_row_number, catalogue_no FROM maintenance.stg_catalogue_items',
        "NULLIF(TRIM(catalogue_no), '') IS NOT NULL",
      ),
    ],
    sql: `
WITH scored AS (
  SELECT
    *,
    NULLIF(TRIM(catalogue_no), '') AS normalized_catalogue_no,
    (
      (NULLIF(TRIM(part_name), '') IS NOT NULL)::int +
      (NULLIF(TRIM(catalogue_group), '') IS NOT NULL)::int +
      (NULLIF(TRIM(warehouse), '') IS NOT NULL)::int +
      (NULLIF(TRIM(bin_location), '') IS NOT NULL)::int +
      (maintenance.parse_maintenance_number(cost_text) IS NOT NULL)::int +
      (maintenance.parse_maintenance_number(on_hand_text) IS NOT NULL)::int +
      (maintenance.parse_maintenance_number(max_text) IS NOT NULL)::int +
      (maintenance.parse_maintenance_number(rop_text) IS NOT NULL)::int +
      (maintenance.parse_maintenance_number(min_text) IS NOT NULL)::int +
      (maintenance.parse_maintenance_number(roq_text) IS NOT NULL)::int
    ) AS completeness_score,
    ROW_NUMBER() OVER (
      PARTITION BY NULLIF(TRIM(catalogue_no), '')
      ORDER BY
        (
          (NULLIF(TRIM(part_name), '') IS NOT NULL)::int +
          (NULLIF(TRIM(catalogue_group), '') IS NOT NULL)::int +
          (NULLIF(TRIM(warehouse), '') IS NOT NULL)::int +
          (NULLIF(TRIM(bin_location), '') IS NOT NULL)::int +
          (maintenance.parse_maintenance_number(cost_text) IS NOT NULL)::int +
          (maintenance.parse_maintenance_number(on_hand_text) IS NOT NULL)::int +
          (maintenance.parse_maintenance_number(max_text) IS NOT NULL)::int +
          (maintenance.parse_maintenance_number(rop_text) IS NOT NULL)::int +
          (maintenance.parse_maintenance_number(min_text) IS NOT NULL)::int +
          (maintenance.parse_maintenance_number(roq_text) IS NOT NULL)::int
        ) DESC,
        maintenance.parse_maintenance_number(on_hand_text) DESC NULLS LAST,
        maintenance.parse_maintenance_number(cost_text) DESC NULLS LAST,
        source_row_number DESC,
        source_file DESC
    ) AS row_rank
  FROM maintenance.stg_catalogue_items
  WHERE NULLIF(TRIM(catalogue_no), '') IS NOT NULL
)
INSERT INTO maintenance.part_catalog (
  catalogue_no, part_name, catalogue_group, warehouse_code, bin_location, item_type,
  account_no, class_code, unit_cost, uom, on_hand, on_order, max_qty, reorder_point,
  min_qty, reorder_qty, source_file, source_row_number, raw_row
)
SELECT
  normalized_catalogue_no,
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
FROM scored
WHERE row_rank = 1
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
`,
  },
  {
    label: 'work_order',
    target: 'maintenance.work_order',
    stage: 'maintenance.stg_workorder',
    diagnostics: [
      sourceKeyConflictDiagnostic(
        'work_order workorder_no',
        'maintenance.stg_workorder',
        [{ alias: 'workorder_no', expression: "NULLIF(TRIM(workorder_no), '')" }],
        'SELECT source_file, source_row_number, workorder_no FROM maintenance.stg_workorder',
        "NULLIF(TRIM(workorder_no), '') IS NOT NULL",
      ),
    ],
    sql: `
WITH ranked AS (
  SELECT
    wo.*,
    NULLIF(TRIM(wo.workorder_no), '') AS normalized_workorder_no,
    ROW_NUMBER() OVER (
      PARTITION BY NULLIF(TRIM(wo.workorder_no), '')
      ORDER BY
        maintenance.parse_maintenance_date(wo.update_date_text) DESC NULLS LAST,
        maintenance.parse_maintenance_date(wo.act_work_end_text) DESC NULLS LAST,
        maintenance.parse_maintenance_date(wo.act_work_start_text) DESC NULLS LAST,
        source_row_number DESC,
        source_file DESC
    ) AS row_rank
  FROM maintenance.stg_workorder wo
  WHERE NULLIF(TRIM(wo.workorder_no), '') IS NOT NULL
)
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
SELECT
  ranked.normalized_workorder_no,
  equipment.equipment_id,
  NULLIF(TRIM(ranked.equipment_no), ''),
  NULLIF(TRIM(ranked.equipment_desc), ''),
  NULLIF(TRIM(ranked.site), ''),
  NULLIF(TRIM(ranked.site_desc), ''),
  NULLIF(TRIM(ranked.location), ''),
  NULLIF(TRIM(ranked.location_desc), ''),
  NULLIF(TRIM(ranked.department), ''),
  NULLIF(TRIM(ranked.department_desc), ''),
  NULLIF(TRIM(ranked.equipment_type), ''),
  NULLIF(TRIM(ranked.equipment_type_desc), ''),
  NULLIF(TRIM(ranked.status), ''),
  NULLIF(TRIM(ranked.priority), ''),
  NULLIF(TRIM(ranked.policy_no), ''),
  NULLIF(TRIM(ranked.policy_description), ''),
  NULLIF(TRIM(ranked.doc_id), ''),
  maintenance.parse_maintenance_date(ranked.plan_start_text),
  maintenance.parse_maintenance_date(ranked.plan_finish_text),
  maintenance.parse_maintenance_date(ranked.act_work_start_text),
  maintenance.parse_maintenance_date(ranked.act_work_end_text),
  maintenance.parse_maintenance_number(ranked.est_duration_text),
  maintenance.parse_maintenance_number(ranked.total_repair_time_text),
  maintenance.parse_maintenance_number(ranked.normal_hour_used_text),
  maintenance.parse_maintenance_number(ranked.down_time_text),
  NULLIF(TRIM(ranked.cause_id), ''),
  maintenance.parse_maintenance_number(ranked.plan_mat_cost_text),
  maintenance.parse_maintenance_number(ranked.plan_labor_cost_text),
  maintenance.parse_maintenance_number(ranked.plan_other_cost_text),
  maintenance.parse_maintenance_number(ranked.act_mat_cost_text),
  maintenance.parse_maintenance_number(ranked.act_labour_cost_text),
  maintenance.parse_maintenance_number(ranked.act_other_cost_text),
  NULLIF(TRIM(ranked.note), ''),
  NULLIF(TRIM(ranked.reason), ''),
  NULLIF(TRIM(ranked.solution), ''),
  NULLIF(TRIM(ranked.description), ''),
  NULLIF(TRIM(ranked.reference), ''),
  NULLIF(TRIM(ranked.account_code), ''),
  NULLIF(TRIM(ranked.customer_code), ''),
  NULLIF(TRIM(ranked.job_type), ''),
  NULLIF(TRIM(ranked.serial_no), ''),
  NULLIF(TRIM(ranked.hold_reason_code), ''),
  NULLIF(TRIM(ranked.warranty_no), ''),
  NULLIF(TRIM(ranked.satisfaction), ''),
  NULLIF(TRIM(ranked.satisfaction_note), ''),
  NULLIF(TRIM(ranked.request_no), ''),
  NULLIF(TRIM(ranked.request_by), ''),
  maintenance.parse_maintenance_date(ranked.request_date_text),
  NULLIF(TRIM(ranked.assign_employee), ''),
  NULLIF(TRIM(ranked.actual_employee), ''),
  NULLIF(TRIM(ranked.update_by), ''),
  maintenance.parse_maintenance_date(ranked.update_date_text),
  NULLIF(TRIM(ranked.cause_path), ''),
  NULLIF(TRIM(ranked.cause_description), ''),
  NULLIF(TRIM(ranked.failure_path), ''),
  NULLIF(TRIM(ranked.failure_description), ''),
  NULLIF(TRIM(ranked.action_path), ''),
  NULLIF(TRIM(ranked.action_description), ''),
  NULLIF(TRIM(ranked.func_location), ''),
  NULLIF(TRIM(ranked.equdf4), ''),
  NULLIF(TRIM(ranked.accepted_by), ''),
  ranked.source_file,
  ranked.source_row_number,
  ranked.raw_row
FROM ranked
LEFT JOIN maintenance.equipment equipment ON equipment.equipment_no = NULLIF(TRIM(ranked.equipment_no), '')
WHERE ranked.row_rank = 1
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
`,
  },
  {
    label: 'work_order_task',
    target: 'maintenance.work_order_task',
    stage: 'maintenance.stg_task',
    diagnostics: [
      sourceKeyConflictDiagnostic(
        'work_order_task workorder_no + task_no',
        'maintenance.stg_task',
        [
          { alias: 'workorder_no', expression: "NULLIF(TRIM(workorder_no), '')" },
          { alias: 'task_no', expression: "coalesce(NULLIF(TRIM(task_no), ''), '')" },
        ],
        'SELECT source_file, source_row_number, workorder_no, task_no FROM maintenance.stg_task',
        "NULLIF(TRIM(workorder_no), '') IS NOT NULL",
      ),
      sourceKeyConflictDiagnostic(
        'work_order_task conflict key',
        'maintenance.stg_task',
        [
          { alias: 'workorder_no', expression: "NULLIF(TRIM(workorder_no), '')" },
          { alias: 'task_no', expression: "coalesce(NULLIF(TRIM(task_no), ''), '')" },
          { alias: 'source_row_number', expression: 'source_row_number' },
        ],
        'SELECT source_file, source_row_number, workorder_no, task_no FROM maintenance.stg_task',
        "NULLIF(TRIM(workorder_no), '') IS NOT NULL",
      ),
    ],
    sql: `
WITH ranked AS (
  SELECT
    task.*,
    NULLIF(TRIM(task.workorder_no), '') AS normalized_workorder_no,
    NULLIF(TRIM(task.task_no), '') AS normalized_task_no,
    ROW_NUMBER() OVER (
      PARTITION BY NULLIF(TRIM(task.workorder_no), ''), coalesce(NULLIF(TRIM(task.task_no), ''), '')
      ORDER BY
        (NULLIF(TRIM(task.description_1), '') IS NOT NULL)::int DESC,
        (NULLIF(TRIM(task.description_2), '') IS NOT NULL)::int DESC,
        source_row_number DESC,
        source_file DESC
    ) AS row_rank
  FROM maintenance.stg_task task
  WHERE NULLIF(TRIM(task.workorder_no), '') IS NOT NULL
)
INSERT INTO maintenance.work_order_task (
  work_order_id, workorder_no, task_no, description_1, description_2, value_text,
  reference, authorizer, request_no, source_file, source_row_number, raw_row
)
SELECT
  work_order.work_order_id,
  ranked.normalized_workorder_no,
  ranked.normalized_task_no,
  NULLIF(TRIM(ranked.description_1), ''),
  NULLIF(TRIM(ranked.description_2), ''),
  NULLIF(TRIM(ranked.value_text), ''),
  NULLIF(TRIM(ranked.reference), ''),
  NULLIF(TRIM(ranked.authorizer), ''),
  NULLIF(TRIM(ranked.request_no), ''),
  ranked.source_file,
  ranked.source_row_number,
  ranked.raw_row
FROM ranked
LEFT JOIN maintenance.work_order ON work_order.workorder_no = ranked.normalized_workorder_no
WHERE ranked.row_rank = 1
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
`,
  },
  {
    label: 'work_order_hold_history',
    target: 'maintenance.work_order_hold_history',
    stage: 'maintenance.stg_hold_workorder_history',
    diagnostics: [
      sourceKeyConflictDiagnostic(
        'work_order_hold_history conflict key',
        'maintenance.stg_hold_workorder_history',
        [
          { alias: 'source_file', expression: 'source_file' },
          { alias: 'source_row_number', expression: 'source_row_number' },
        ],
        'SELECT source_file, source_row_number FROM maintenance.stg_hold_workorder_history',
      ),
    ],
    sql: `
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
`,
  },
  {
    label: 'work_order_part_transaction',
    target: 'maintenance.work_order_part_transaction',
    stage: 'maintenance.stg_transaction',
    diagnostics: [
      sourceKeyConflictDiagnostic(
        'work_order_part_transaction conflict key',
        'maintenance.stg_transaction',
        [
          { alias: 'source_file', expression: 'source_file' },
          { alias: 'source_row_number', expression: 'source_row_number' },
        ],
        'SELECT source_file, source_row_number FROM maintenance.stg_transaction',
      ),
    ],
    sql: `
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
`,
  },
  {
    label: 'inventory_transaction_history',
    target: 'maintenance.inventory_transaction_history',
    stage: 'maintenance.stg_transaction_history',
    diagnostics: [
      sourceKeyConflictDiagnostic(
        'inventory_transaction_history conflict key',
        'maintenance.stg_transaction_history',
        [
          { alias: 'source_file', expression: 'source_file' },
          { alias: 'source_row_number', expression: 'source_row_number' },
        ],
        'SELECT source_file, source_row_number FROM maintenance.stg_transaction_history',
      ),
    ],
    sql: `
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
`,
  },
  {
    label: 'stock_balance',
    target: 'maintenance.stock_balance',
    stage: 'maintenance.stg_stock_valuation',
    diagnostics: [
      sourceKeyConflictDiagnostic(
        'stock_balance stock identity',
        'maintenance.stg_stock_valuation',
        [
          { alias: 'catalogue_no', expression: "NULLIF(TRIM(catalogue_no), '')" },
          { alias: 'warehouse_code', expression: "coalesce(NULLIF(TRIM(textbox54), ''), '')" },
          { alias: 'bin_location', expression: "coalesce(NULLIF(TRIM(bin_location), ''), '')" },
          { alias: 'batch_no', expression: "coalesce(NULLIF(TRIM(batch_no), ''), '')" },
          { alias: 'serial_no', expression: "coalesce(NULLIF(TRIM(serial_no), ''), '')" },
        ],
        'SELECT source_file, source_row_number, catalogue_no, textbox54, bin_location, batch_no, serial_no FROM maintenance.stg_stock_valuation',
        "NULLIF(TRIM(catalogue_no), '') IS NOT NULL",
      ),
      sourceKeyConflictDiagnostic(
        'stock_balance conflict key',
        'maintenance.stg_stock_valuation',
        [
          { alias: 'source_file', expression: 'source_file' },
          { alias: 'source_row_number', expression: 'source_row_number' },
        ],
        'SELECT source_file, source_row_number FROM maintenance.stg_stock_valuation',
      ),
    ],
    sql: `
WITH grouped AS (
  SELECT
    NULLIF(TRIM(stock.catalogue_no), '') AS catalogue_no,
    max(NULLIF(TRIM(stock.part_name), '')) AS part_name,
    max(NULLIF(TRIM(stock.uom), '')) AS uom,
    NULLIF(TRIM(stock.textbox54), '') AS warehouse_code,
    NULLIF(TRIM(stock.bin_location), '') AS bin_location,
    NULLIF(TRIM(stock.batch_no), '') AS batch_no,
    NULLIF(TRIM(stock.serial_no), '') AS serial_no,
    max(maintenance.parse_maintenance_number(stock.min_text)) AS min_qty,
    max(maintenance.parse_maintenance_number(stock.max_text)) AS max_qty,
    max(maintenance.parse_maintenance_number(stock.rop_text)) AS reorder_point,
    sum(maintenance.parse_maintenance_number(stock.on_hand_text)) AS on_hand,
    sum(maintenance.parse_maintenance_number(stock.value_text)) AS stock_value,
    sum(maintenance.parse_maintenance_number(stock.qty_text)) AS qty,
    max(maintenance.parse_maintenance_number(stock.unit_price_text)) AS unit_price,
    min(stock.source_file) AS source_file,
    min(stock.source_row_number) AS source_row_number,
    jsonb_build_object(
      'aggregation', 'stock identity',
      'source_rows', jsonb_agg(
        jsonb_build_object(
          'source_file', stock.source_file,
          'source_row_number', stock.source_row_number,
          'raw_row', stock.raw_row
        )
        ORDER BY stock.source_file, stock.source_row_number
      )
    ) AS raw_row
  FROM maintenance.stg_stock_valuation stock
  WHERE NULLIF(TRIM(stock.catalogue_no), '') IS NOT NULL
  GROUP BY
    NULLIF(TRIM(stock.catalogue_no), ''),
    NULLIF(TRIM(stock.textbox54), ''),
    NULLIF(TRIM(stock.bin_location), ''),
    NULLIF(TRIM(stock.batch_no), ''),
    NULLIF(TRIM(stock.serial_no), '')
)
INSERT INTO maintenance.stock_balance (
  part_id, catalogue_no, part_name, uom, warehouse_code, bin_location, batch_no,
  serial_no, min_qty, max_qty, reorder_point, on_hand, stock_value, qty, unit_price,
  source_file, source_row_number, raw_row
)
SELECT
  part_catalog.part_id,
  grouped.catalogue_no,
  grouped.part_name,
  grouped.uom,
  grouped.warehouse_code,
  grouped.bin_location,
  grouped.batch_no,
  grouped.serial_no,
  grouped.min_qty,
  grouped.max_qty,
  grouped.reorder_point,
  grouped.on_hand,
  grouped.stock_value,
  grouped.qty,
  grouped.unit_price,
  grouped.source_file,
  grouped.source_row_number,
  grouped.raw_row
FROM grouped
LEFT JOIN maintenance.part_catalog ON part_catalog.catalogue_no = grouped.catalogue_no
ON CONFLICT (source_file, source_row_number) DO UPDATE SET
  part_id = EXCLUDED.part_id,
  part_name = EXCLUDED.part_name,
  on_hand = EXCLUDED.on_hand,
  stock_value = EXCLUDED.stock_value,
  qty = EXCLUDED.qty,
  unit_price = EXCLUDED.unit_price,
  raw_row = EXCLUDED.raw_row,
  updated_at = now();
`,
  },
];

function usage() {
  console.log('Usage: node scripts/maintenance/normalize-maintenance-data.mjs [--dry-run]');
}

function formatDiagnosticSample(sample) {
  if (!Array.isArray(sample) || sample.length === 0) return '[]';
  return JSON.stringify(sample);
}

async function runDiagnostics(client, step) {
  for (const diagnostic of step.diagnostics ?? []) {
    const result = await client.query(diagnostic.sql);
    const row = result.rows[0] ?? { duplicate_group_count: 0, sample: [] };
    const duplicateCount = Number(row.duplicate_group_count ?? 0);
    if (duplicateCount > 0) {
      console.warn(`[normalize][duplicates] ${diagnostic.label} (${diagnostic.stage}): ${duplicateCount} duplicate key group(s); sample=${formatDiagnosticSample(row.sample)}`);
    }
  }
}

async function runNormalize() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for database operations.');
  }

  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS ?? 5000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS ?? 120000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS ?? 120000),
    application_name: 'hoya-ui-maintenance-normalize',
  });

  const client = await pool.connect();
  const counts = [];
  try {
    for (const step of NORMALIZE_STEPS) {
      try {
        await runDiagnostics(client, step);
        await client.query(step.sql);
        const countResult = await client.query(`SELECT count(*)::bigint AS rows_affected FROM ${step.target}`);
        counts.push({ label: step.label, rows_affected: countResult.rows[0]?.rows_affected ?? '0' });
      } catch (error) {
        const context = [
          `target=${step.target}`,
          `stage=${step.stage}`,
          `label=${step.label}`,
          `message=${error.message}`,
        ].join(' ');
        throw new Error(`Normalize SQL failed: ${context}`, { cause: error });
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.table(counts);
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

  await runNormalize();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    if (error.cause?.message) console.error(`Original database error: ${error.cause.message}`);
    process.exit(1);
  });
}
