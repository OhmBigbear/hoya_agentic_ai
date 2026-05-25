export function workOrderDto(row) {
  return {
    work_order_id: stringOrUndefined(row.work_order_id),
    workorder_no: String(row.workorder_no ?? ''),
    status: stringOrUndefined(row.status),
    job_type: stringOrUndefined(row.job_type),
    priority: stringOrUndefined(row.priority),
    equipment_no: stringOrUndefined(row.equipment_no),
    equipment_desc: stringOrUndefined(row.equipment_desc),
    site: stringOrUndefined(row.site),
    location: stringOrUndefined(row.location),
    department: stringOrUndefined(row.department),
    plan_start: dateString(row.plan_start),
    plan_finish: dateString(row.plan_finish),
    act_work_start: dateString(row.act_work_start),
    act_work_end: dateString(row.act_work_end),
    total_repair_time_hours: numberOrZero(row.total_repair_time_hours),
    down_time_hours: numberOrZero(row.down_time_hours),
    reason: stringOrUndefined(row.reason),
    solution: stringOrUndefined(row.solution),
    failure_description: stringOrUndefined(row.failure_description),
    action_description: stringOrUndefined(row.action_description),
    task_count: numberOrZero(row.task_count),
    part_transaction_count: numberOrZero(row.part_transaction_count),
    issued_qty: numberOrZero(row.issued_qty),
  };
}

export function workOrderDetailDto(workorder, equipment, tasks, parts, holdHistory) {
  return {
    ...workOrderDto(workorder),
    equipment: equipmentDto(equipment),
    tasks: tasks.map(taskDto),
    parts: parts.map(partUsageDto),
    hold_history: holdHistory.map(holdHistoryDto),
  };
}

export function equipmentDto(row) {
  if (!row?.equipment_no) {
    return undefined;
  }

  return {
    equipment_no: String(row.equipment_no),
    equipment_desc: stringOrUndefined(row.equipment_desc),
    equipment_type: stringOrUndefined(row.equipment_type),
    model_no: stringOrUndefined(row.model_no),
    serial_no: stringOrUndefined(row.serial_no),
    manufacturer: stringOrUndefined(row.manufacturer),
    department: stringOrUndefined(row.department),
    site: stringOrUndefined(row.site),
    location: stringOrUndefined(row.location),
    is_active: typeof row.is_active === 'boolean' ? row.is_active : undefined,
  };
}

export function taskDto(row) {
  return {
    task_no: stringOrUndefined(row.task_no),
    description_1: stringOrUndefined(row.description_1),
    description_2: stringOrUndefined(row.description_2),
    value_text: stringOrUndefined(row.value_text),
    reference: stringOrUndefined(row.reference),
    authorizer: stringOrUndefined(row.authorizer),
    request_no: stringOrUndefined(row.request_no),
  };
}

export function partUsageDto(row) {
  return {
    workorder_no: String(row.workorder_no ?? ''),
    equipment_no: stringOrUndefined(row.equipment_no),
    equipment_desc: stringOrUndefined(row.equipment_desc),
    job_type: stringOrUndefined(row.job_type),
    status: stringOrUndefined(row.status),
    catalogue_no: stringOrUndefined(row.catalogue_no),
    part_name: stringOrUndefined(row.part_name),
    uom: stringOrUndefined(row.uom),
    issued_qty: numberOrZero(row.issued_qty),
    movement_qty: numberOrZero(row.movement_qty),
    transaction_count: numberOrZero(row.transaction_count),
    first_transaction_at: dateString(row.first_transaction_at),
    last_transaction_at: dateString(row.last_transaction_at),
  };
}

export function holdHistoryDto(row) {
  return {
    workorder_no: stringOrUndefined(row.workorder_no),
    hold_reason_description: stringOrUndefined(row.hold_reason_description),
    hold_count: numberOrUndefined(row.hold_count),
    affected_workorder_count: numberOrUndefined(row.affected_workorder_count),
    first_hold_at: dateString(row.first_hold_at),
    last_hold_at: dateString(row.last_hold_at),
    hold_date: dateString(row.hold_date),
    hold_by: stringOrUndefined(row.hold_by),
    site: stringOrUndefined(row.site),
    location: stringOrUndefined(row.location),
    department: stringOrUndefined(row.department),
    equipment_type: stringOrUndefined(row.equipment_type),
    operator_id: stringOrUndefined(row.operator_id),
  };
}

export function mtbfMttrDto(row) {
  return {
    equipment_no: String(row.equipment_no ?? ''),
    equipment_desc: stringOrUndefined(row.equipment_desc),
    failure_count: numberOrZero(row.failure_count),
    mtbf_hours: numberOrUndefined(row.mtbf_hours),
    mttr_hours: numberOrUndefined(row.mttr_hours),
    total_downtime_hours: numberOrZero(row.total_downtime_hours),
    last_failure_at: dateString(row.last_failure_at),
    last_repair_end: dateString(row.last_repair_end),
  };
}

export function riskMachineDto(row) {
  return {
    equipment_no: stringOrUndefined(row.equipment_no),
    equipment_desc: stringOrUndefined(row.equipment_desc),
    failure_signal: stringOrUndefined(row.failure_signal),
    workorder_count: numberOrUndefined(row.workorder_count),
    first_seen_at: dateString(row.first_seen_at),
    last_seen_at: dateString(row.last_seen_at),
    workorders: toStringArray(row.workorders),
    catalogue_no: stringOrUndefined(row.catalogue_no),
    part_name: stringOrUndefined(row.part_name),
    warehouse_code: stringOrUndefined(row.warehouse_code),
    bin_location: stringOrUndefined(row.bin_location),
    on_hand: numberOrUndefined(row.on_hand),
    reorder_point: numberOrUndefined(row.reorder_point),
    min_qty: numberOrUndefined(row.min_qty),
    stock_value: numberOrUndefined(row.stock_value),
    stock_risk: stringOrUndefined(row.stock_risk),
  };
}

export function dashboardSummaryDto(row) {
  return {
    open_workorder_count: numberOrZero(row.open_workorder_count),
    overdue_workorder_count: numberOrZero(row.overdue_workorder_count),
    on_hold_workorder_count: numberOrZero(row.on_hold_workorder_count),
    completed_workorder_count: numberOrZero(row.completed_workorder_count),
    total_downtime_hours: numberOrZero(row.total_downtime_hours),
    repeat_failure_candidate_count: numberOrZero(row.repeat_failure_candidate_count),
    stock_risk_item_count: numberOrZero(row.stock_risk_item_count),
    mtbf_mttr: (row.mtbf_mttr ?? []).map(mtbfMttrDto),
    top_risk_machines: (row.top_risk_machines ?? []).map(riskMachineDto),
    top_hold_reasons: (row.top_hold_reasons ?? []).map(holdHistoryDto),
  };
}

function numberOrZero(value) {
  return numberOrUndefined(value) ?? 0;
}

function numberOrUndefined(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function stringOrUndefined(value) {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

function dateString(value) {
  if (!value) {
    return undefined;
  }
  return value instanceof Date ? value.toISOString() : String(value);
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}
