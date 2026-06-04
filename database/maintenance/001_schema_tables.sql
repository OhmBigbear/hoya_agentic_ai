CREATE SCHEMA IF NOT EXISTS maintenance;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION maintenance.parse_maintenance_number(value text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN NULLIF(TRIM(value), '') IS NULL THEN NULL
    WHEN TRIM(value) ~ '^-?[0-9,]+(\.[0-9]+)?$' THEN REPLACE(TRIM(value), ',', '')::numeric
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION maintenance.parse_maintenance_date(value text)
RETURNS timestamp without time zone
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned text := NULLIF(TRIM(value), '');
  match text[];
  parsed_year integer;
  parsed timestamp without time zone;
BEGIN
  IF cleaned IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    match := regexp_match(cleaned, '^(\d{1,2})/(\d{1,2})/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$');
    IF match IS NULL THEN
      match := regexp_match(cleaned, '^(\d{1,2})/(\d{1,2})/(\d{2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$');
      IF match IS NULL THEN
        RETURN NULL;
      END IF;
      parsed_year := CASE WHEN match[3]::integer <= 69 THEN 2000 + match[3]::integer ELSE 1900 + match[3]::integer END;
    ELSE
      parsed_year := match[3]::integer;
    END IF;

    parsed := make_timestamp(
      parsed_year,
      match[2]::integer,
      match[1]::integer,
      coalesce(match[4]::integer, 0),
      coalesce(match[5]::integer, 0),
      coalesce(match[6]::double precision, 0)
    );

    IF extract(year FROM parsed)::integer = parsed_year
      AND extract(month FROM parsed)::integer = match[2]::integer
      AND extract(day FROM parsed)::integer = match[1]::integer
      AND extract(hour FROM parsed)::integer = coalesce(match[4]::integer, 0)
      AND extract(minute FROM parsed)::integer = coalesce(match[5]::integer, 0)
      AND floor(extract(second FROM parsed))::integer = coalesce(match[6]::integer, 0)
    THEN
      RETURN parsed;
    END IF;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;

  RETURN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS maintenance.stg_equipment (
  staging_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb NOT NULL,
  equipment_no text,
  equipment_desc text,
  equipment_type text,
  model_no text,
  serial_no text,
  register_no text,
  register_due_date_text text,
  manufacturer text,
  department text,
  site text,
  location text,
  active_text text,
  disposal_date_text text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.stg_workorder (
  staging_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb NOT NULL,
  site text,
  site_desc text,
  location text,
  location_desc text,
  department text,
  department_desc text,
  equipment_type text,
  equipment_type_desc text,
  equipment_no text,
  equipment_desc text,
  workorder_no text,
  status text,
  priority text,
  policy_no text,
  policy_description text,
  doc_id text,
  plan_start_text text,
  plan_finish_text text,
  act_work_start_text text,
  act_work_end_text text,
  est_duration_text text,
  total_repair_time_text text,
  normal_hour_used_text text,
  down_time_text text,
  cause_id text,
  plan_mat_cost_text text,
  plan_labor_cost_text text,
  plan_other_cost_text text,
  act_mat_cost_text text,
  act_labour_cost_text text,
  act_other_cost_text text,
  note text,
  reason text,
  solution text,
  description text,
  reference text,
  account_code text,
  customer_code text,
  job_type text,
  serial_no text,
  hold_reason_code text,
  warranty_no text,
  satisfaction text,
  satisfaction_note text,
  request_no text,
  request_by text,
  request_date_text text,
  udfrq1 text,
  udfrq2 text,
  udfrq3 text,
  udfrq4 text,
  udfrq6 text,
  assign_employee text,
  actual_employee text,
  update_by text,
  update_date_text text,
  cause_path text,
  cause_description text,
  failure_path text,
  failure_description text,
  action_path text,
  action_description text,
  func_location text,
  equdf4 text,
  accepted_by text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.stg_task (
  staging_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb NOT NULL,
  workorder_no text,
  task_no text,
  description_1 text,
  description_2 text,
  value_text text,
  reference text,
  authorizer text,
  request_no text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.stg_transaction (
  staging_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb NOT NULL,
  transaction_date_text text,
  workorder_no text,
  equipment_no text,
  equipment_desc text,
  catalogue_no text,
  part_name text,
  transaction_type text,
  tran_qty_text text,
  uom text,
  serial_no text,
  warehouse_id text,
  warehouse_location_id text,
  comment1 text,
  comment2 text,
  comment3 text,
  user_id text,
  first_name text,
  last_name text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.stg_hold_workorder_history (
  staging_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb NOT NULL,
  hold_date_text text,
  workorder_no text,
  func_location text,
  equipment_no text,
  equipment_desc text,
  hold_reason_description text,
  plan_start_text text,
  plan_finish_text text,
  hold_by text,
  site text,
  location text,
  department text,
  equipment_type text,
  operator_id text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.stg_catalogue_items (
  staging_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb NOT NULL,
  textbox34 text,
  textbox32 text,
  catalogue_no text,
  part_name text,
  catalogue_group text,
  warehouse text,
  bin_location text,
  item_type text,
  account_no text,
  class_code text,
  cost_text text,
  uom text,
  on_hand_text text,
  on_order_text text,
  max_text text,
  rop_text text,
  min_text text,
  roq_text text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.stg_stock_valuation (
  staging_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb NOT NULL,
  textbox34 text,
  catalogue_no text,
  part_name text,
  uom text,
  bin_location text,
  min_text text,
  max_text text,
  rop_text text,
  on_hand_text text,
  value_text text,
  batch_no text,
  serial_no text,
  qty_text text,
  unit_price_text text,
  textbox13 text,
  textbox2 text,
  textbox17 text,
  textbox54 text,
  textbox51 text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.stg_transaction_history (
  staging_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb NOT NULL,
  transaction_date_text text,
  catalogue_no text,
  part_name text,
  transaction_type text,
  batch_no text,
  tran_qty_text text,
  tran_value_text text,
  run_total_text text,
  uom text,
  serial_no text,
  warehouse_id text,
  warehouse_location_id text,
  workorder_no text,
  comment1 text,
  user_id text,
  textbox38 text,
  textbox47 text,
  textbox61 text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.equipment (
  equipment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_no text NOT NULL UNIQUE,
  equipment_desc text,
  equipment_type text,
  model_no text,
  serial_no text,
  register_no text,
  register_due_date date,
  manufacturer text,
  department text,
  site text,
  location text,
  is_active boolean,
  disposal_date date,
  source_file text,
  source_row_number integer,
  raw_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance.warehouse (
  warehouse_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_code text NOT NULL,
  warehouse_location_code text NOT NULL DEFAULT '',
  warehouse_name text,
  source_system text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (warehouse_code, warehouse_location_code)
);

CREATE TABLE IF NOT EXISTS maintenance.part_catalog (
  part_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogue_no text NOT NULL UNIQUE,
  part_name text,
  catalogue_group text,
  warehouse_code text,
  bin_location text,
  item_type text,
  account_no text,
  class_code text,
  unit_cost numeric(18, 4),
  uom text,
  on_hand numeric(18, 4),
  on_order numeric(18, 4),
  max_qty numeric(18, 4),
  reorder_point numeric(18, 4),
  min_qty numeric(18, 4),
  reorder_qty numeric(18, 4),
  source_file text,
  source_row_number integer,
  raw_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance.work_order (
  work_order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workorder_no text NOT NULL UNIQUE,
  equipment_id uuid REFERENCES maintenance.equipment(equipment_id),
  equipment_no text,
  equipment_desc text,
  site text,
  site_desc text,
  location text,
  location_desc text,
  department text,
  department_desc text,
  equipment_type text,
  equipment_type_desc text,
  status text,
  priority text,
  policy_no text,
  policy_description text,
  doc_id text,
  plan_start timestamp,
  plan_finish timestamp,
  act_work_start timestamp,
  act_work_end timestamp,
  est_duration_hours numeric(18, 4),
  total_repair_time_hours numeric(18, 4),
  normal_hour_used numeric(18, 4),
  down_time_hours numeric(18, 4),
  cause_id text,
  plan_mat_cost numeric(18, 4),
  plan_labor_cost numeric(18, 4),
  plan_other_cost numeric(18, 4),
  act_mat_cost numeric(18, 4),
  act_labour_cost numeric(18, 4),
  act_other_cost numeric(18, 4),
  note text,
  reason text,
  solution text,
  description text,
  reference text,
  account_code text,
  customer_code text,
  job_type text,
  serial_no text,
  hold_reason_code text,
  warranty_no text,
  satisfaction text,
  satisfaction_note text,
  request_no text,
  request_by text,
  request_date timestamp,
  assign_employee text,
  actual_employee text,
  update_by text,
  update_date timestamp,
  cause_path text,
  cause_description text,
  failure_path text,
  failure_description text,
  action_path text,
  action_description text,
  func_location text,
  equdf4 text,
  accepted_by text,
  source_file text,
  source_row_number integer,
  raw_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance.work_order_task (
  task_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES maintenance.work_order(work_order_id),
  workorder_no text NOT NULL,
  task_no text,
  description_1 text,
  description_2 text,
  value_text text,
  reference text,
  authorizer text,
  request_no text,
  source_file text,
  source_row_number integer NOT NULL,
  raw_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workorder_no, task_no, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.work_order_hold_history (
  hold_history_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES maintenance.work_order(work_order_id),
  workorder_no text NOT NULL,
  equipment_id uuid REFERENCES maintenance.equipment(equipment_id),
  equipment_no text,
  equipment_desc text,
  hold_date timestamp,
  hold_reason_description text,
  plan_start timestamp,
  plan_finish timestamp,
  hold_by text,
  site text,
  location text,
  department text,
  equipment_type text,
  operator_id text,
  func_location text,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.work_order_part_transaction (
  part_transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES maintenance.work_order(work_order_id),
  workorder_no text,
  equipment_id uuid REFERENCES maintenance.equipment(equipment_id),
  equipment_no text,
  equipment_desc text,
  part_id uuid REFERENCES maintenance.part_catalog(part_id),
  catalogue_no text,
  part_name text,
  transaction_date timestamp,
  transaction_type text,
  tran_qty numeric(18, 4),
  uom text,
  serial_no text,
  warehouse_code text,
  warehouse_location_code text,
  comment1 text,
  comment2 text,
  comment3 text,
  user_id text,
  first_name text,
  last_name text,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.inventory_transaction_history (
  inventory_transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid REFERENCES maintenance.part_catalog(part_id),
  catalogue_no text,
  part_name text,
  transaction_date timestamp,
  transaction_type text,
  batch_no text,
  tran_qty numeric(18, 4),
  tran_value numeric(18, 4),
  run_total numeric(18, 4),
  uom text,
  serial_no text,
  warehouse_code text,
  warehouse_location_code text,
  workorder_no text,
  comment1 text,
  user_id text,
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE TABLE IF NOT EXISTS maintenance.stock_balance (
  stock_balance_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid REFERENCES maintenance.part_catalog(part_id),
  catalogue_no text NOT NULL,
  part_name text,
  uom text,
  warehouse_code text,
  bin_location text,
  batch_no text,
  serial_no text,
  min_qty numeric(18, 4),
  max_qty numeric(18, 4),
  reorder_point numeric(18, 4),
  on_hand numeric(18, 4),
  stock_value numeric(18, 4),
  qty numeric(18, 4),
  unit_price numeric(18, 4),
  source_file text NOT NULL,
  source_row_number integer NOT NULL,
  raw_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_file, source_row_number)
);

CREATE INDEX IF NOT EXISTS idx_stg_workorder_workorder_no ON maintenance.stg_workorder(workorder_no);
CREATE INDEX IF NOT EXISTS idx_stg_workorder_equipment_no ON maintenance.stg_workorder(equipment_no);
CREATE INDEX IF NOT EXISTS idx_stg_transaction_catalogue_no ON maintenance.stg_transaction(catalogue_no);
CREATE INDEX IF NOT EXISTS idx_stg_transaction_transaction_date_text ON maintenance.stg_transaction(transaction_date_text);

CREATE INDEX IF NOT EXISTS idx_equipment_equipment_no ON maintenance.equipment(equipment_no);
CREATE INDEX IF NOT EXISTS idx_part_catalog_catalogue_no ON maintenance.part_catalog(catalogue_no);
CREATE INDEX IF NOT EXISTS idx_work_order_workorder_no ON maintenance.work_order(workorder_no);
CREATE INDEX IF NOT EXISTS idx_work_order_equipment_no ON maintenance.work_order(equipment_no);
CREATE INDEX IF NOT EXISTS idx_work_order_status ON maintenance.work_order(status);
CREATE INDEX IF NOT EXISTS idx_work_order_job_type ON maintenance.work_order(job_type);
CREATE INDEX IF NOT EXISTS idx_work_order_plan_start ON maintenance.work_order(plan_start);
CREATE INDEX IF NOT EXISTS idx_work_order_part_transaction_workorder_no ON maintenance.work_order_part_transaction(workorder_no);
CREATE INDEX IF NOT EXISTS idx_work_order_part_transaction_catalogue_no ON maintenance.work_order_part_transaction(catalogue_no);
CREATE INDEX IF NOT EXISTS idx_work_order_part_transaction_transaction_date ON maintenance.work_order_part_transaction(transaction_date);
CREATE INDEX IF NOT EXISTS idx_work_order_part_transaction_warehouse_code ON maintenance.work_order_part_transaction(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_inventory_transaction_history_catalogue_no ON maintenance.inventory_transaction_history(catalogue_no);
CREATE INDEX IF NOT EXISTS idx_inventory_transaction_history_transaction_date ON maintenance.inventory_transaction_history(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transaction_history_warehouse_code ON maintenance.inventory_transaction_history(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_stock_balance_catalogue_no ON maintenance.stock_balance(catalogue_no);
CREATE INDEX IF NOT EXISTS idx_stock_balance_warehouse_code ON maintenance.stock_balance(warehouse_code);
