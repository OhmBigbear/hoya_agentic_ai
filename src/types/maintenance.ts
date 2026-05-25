export type MaintenanceWorkOrderStatus =
  | 'open'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'closed'
  | 'cancelled'
  | string;

export interface MaintenanceEquipment {
  equipment_no: string;
  equipment_desc?: string;
  equipment_type?: string;
  model_no?: string;
  serial_no?: string;
  manufacturer?: string;
  department?: string;
  site?: string;
  location?: string;
  is_active?: boolean;
}

export interface MaintenanceTask {
  task_no?: string;
  description_1?: string;
  description_2?: string;
  value_text?: string;
  reference?: string;
  authorizer?: string;
  request_no?: string;
}

export interface MaintenancePartUsage {
  workorder_no: string;
  equipment_no?: string;
  equipment_desc?: string;
  job_type?: string;
  status?: MaintenanceWorkOrderStatus;
  catalogue_no?: string;
  part_name?: string;
  uom?: string;
  issued_qty: number;
  movement_qty: number;
  transaction_count: number;
  first_transaction_at?: string;
  last_transaction_at?: string;
}

export interface MaintenanceHoldHistory {
  workorder_no?: string;
  hold_reason_description?: string;
  hold_count?: number;
  affected_workorder_count?: number;
  first_hold_at?: string;
  last_hold_at?: string;
  hold_date?: string;
  hold_by?: string;
  site?: string;
  location?: string;
  department?: string;
  equipment_type?: string;
  operator_id?: string;
}

export interface MaintenanceWorkOrder {
  work_order_id?: string;
  workorder_no: string;
  status?: MaintenanceWorkOrderStatus;
  job_type?: string;
  priority?: string;
  equipment_no?: string;
  equipment_desc?: string;
  site?: string;
  location?: string;
  department?: string;
  plan_start?: string;
  plan_finish?: string;
  act_work_start?: string;
  act_work_end?: string;
  total_repair_time_hours: number;
  down_time_hours: number;
  reason?: string;
  solution?: string;
  failure_description?: string;
  action_description?: string;
  task_count: number;
  part_transaction_count: number;
  issued_qty: number;
}

export interface MaintenanceWorkOrderDetail extends MaintenanceWorkOrder {
  equipment?: MaintenanceEquipment;
  tasks: MaintenanceTask[];
  parts: MaintenancePartUsage[];
  hold_history: MaintenanceHoldHistory[];
}

export interface MaintenanceMtbfMttrSummary {
  equipment_no: string;
  equipment_desc?: string;
  failure_count: number;
  mtbf_hours?: number;
  mttr_hours?: number;
  total_downtime_hours: number;
  last_failure_at?: string;
  last_repair_end?: string;
}

export interface MaintenanceRiskMachine {
  equipment_no?: string;
  equipment_desc?: string;
  failure_signal?: string;
  workorder_count?: number;
  first_seen_at?: string;
  last_seen_at?: string;
  workorders?: string[];
  catalogue_no?: string;
  part_name?: string;
  warehouse_code?: string;
  bin_location?: string;
  on_hand?: number;
  reorder_point?: number;
  min_qty?: number;
  stock_value?: number;
  stock_risk?: 'zero_stock' | 'below_min' | 'below_reorder_point' | 'ok' | string;
}

export interface MaintenanceDashboardSummary {
  open_workorder_count: number;
  overdue_workorder_count: number;
  on_hold_workorder_count: number;
  completed_workorder_count: number;
  total_downtime_hours: number;
  repeat_failure_candidate_count: number;
  stock_risk_item_count: number;
  mtbf_mttr: MaintenanceMtbfMttrSummary[];
  top_risk_machines: MaintenanceRiskMachine[];
  top_hold_reasons: MaintenanceHoldHistory[];
}

export interface MaintenanceQueryFilters {
  site?: string;
  location?: string;
  department?: string;
  equipment_no?: string;
  equipment_type?: string;
  workorder_no?: string;
  status?: MaintenanceWorkOrderStatus;
  job_type?: string;
  priority?: string;
  catalogue_no?: string;
  stock_risk?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface MaintenanceApiResponse<T> {
  data: T;
  trace_id?: string;
  total?: number;
  warnings?: string[];
}
