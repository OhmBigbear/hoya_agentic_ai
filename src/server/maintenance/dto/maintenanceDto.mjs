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

export function rcaEvidenceDto({
  workorder,
  equipment,
  tasks,
  parts,
  holdHistory,
  relatedHistory,
  repeatFailure,
  failureFrequency,
  reliabilityContext,
}) {
  return {
    workorder: workOrderRcaDto(workorder, equipment, tasks, parts, holdHistory),
    failure_signal: normalizeFailureSignal(workorder),
    reliability_context: reliabilityContextDto(reliabilityContext),
    related_history: relatedHistory.map(workOrderDto),
    repeat_failure: repeatFailure ? riskMachineDto(repeatFailure) : {},
    failure_frequency: failureFrequency ? failureFrequencyDto(failureFrequency) : {},
    evidence_sources: evidenceSources({
      workorder,
      tasks,
      parts,
      holdHistory,
      relatedHistory,
      repeatFailure,
      failureFrequency,
      reliabilityContext,
    }),
  };
}

export function workOrderRcaDto(workorder, equipment, tasks, parts, holdHistory) {
  return {
    ...workOrderDetailDto(workorder, equipment, tasks, parts, holdHistory),
    equipment_type: stringOrUndefined(workorder.equipment_type),
    equipment_type_desc: stringOrUndefined(workorder.equipment_type_desc),
    description: stringOrUndefined(workorder.description),
    note: stringOrUndefined(workorder.note),
    cause_id: stringOrUndefined(workorder.cause_id),
    cause_path: stringOrUndefined(workorder.cause_path),
    cause_description: stringOrUndefined(workorder.cause_description),
    failure_path: stringOrUndefined(workorder.failure_path),
    action_path: stringOrUndefined(workorder.action_path),
    request_no: stringOrUndefined(workorder.request_no),
    request_by: stringOrUndefined(workorder.request_by),
    request_date: dateString(workorder.request_date),
    assign_employee: stringOrUndefined(workorder.assign_employee),
    actual_employee: stringOrUndefined(workorder.actual_employee),
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

export function maintenanceReliabilityDto(row) {
  return {
    period_month: dateOnlyString(row.period_month),
    section: stringOrUndefined(row.section),
    machine_type: stringOrUndefined(row.machine_type),
    machine_no: stringOrUndefined(row.machine_no),
    machine_desc: stringOrUndefined(row.machine_desc),
    equipment_no: stringOrUndefined(row.equipment_no ?? row.machine_no),
    equipment_desc: stringOrUndefined(row.equipment_desc ?? row.machine_desc),
    failure_count: numberOrZero(row.failure_count),
    mtbf_hours: numberOrUndefined(row.mtbf_hours),
    mttr_hours: numberOrUndefined(row.mttr_hours),
    mttr_minutes: numberOrUndefined(row.mttr_minutes),
    total_downtime_hours: numberOrZero(row.total_downtime_hours),
    health_score: numberOrUndefined(row.health_score),
    health_band: stringOrUndefined(row.health_band),
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
    total_downtime_hours: numberOrUndefined(row.total_downtime_hours),
    avg_repair_time_hours: numberOrUndefined(row.avg_repair_time_hours),
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

export function failureFrequencyDto(row) {
  return {
    failure_signal: String(row.failure_signal ?? ''),
    failure_count: numberOrZero(row.failure_count),
    affected_equipment_count: numberOrZero(row.affected_equipment_count),
    workorder_count: numberOrZero(row.workorder_count),
    total_downtime_hours: numberOrZero(row.total_downtime_hours),
    avg_repair_time_hours: numberOrUndefined(row.avg_repair_time_hours),
    first_seen_at: dateString(row.first_seen_at),
    last_seen_at: dateString(row.last_seen_at),
  };
}

export function reliabilityContextDto(row) {
  return {
    mtbf_hours: numberOrUndefined(row?.mtbf_hours),
    mttr_hours: numberOrUndefined(row?.mttr_hours),
    total_downtime_hours: numberOrZero(row?.total_downtime_hours),
    health_score: numberOrUndefined(row?.health_score),
    health_band: stringOrUndefined(row?.health_band),
  };
}

export function failureParetoDto(row) {
  return {
    rank: numberOrZero(row.rank),
    failure_signal: String(row.failure_signal ?? ''),
    value: numberOrZero(row.value),
    basis: stringOrUndefined(row.basis) ?? 'count',
    percentage: numberOrZero(row.percentage),
    cumulative_percentage: numberOrZero(row.cumulative_percentage),
    workorder_count: numberOrZero(row.workorder_count),
    affected_equipment_count: numberOrZero(row.affected_equipment_count),
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

export const FAILURE_TAXONOMY_VERSION = 'r5b-phase3a-v1';

const FAILURE_SIGNAL_FIELDS = [
  'failure_description',
  'failure_path',
  'cause_description',
  'cause_path',
  'reason',
  'action_description',
  'description',
  'note',
];

const TAXONOMY_RULES = [
  { category: 'preventive_maintenance', keywords: ['pm operation', 'preventive maintenance', 'preventative maintenance', 'planned maintenance', 'periodic maintenance', 'routine inspection'] },
  { category: 'pneumatic', keywords: ['pneumatic', 'air pressure', 'air leak', 'compressed air', 'air cylinder'] },
  { category: 'hydraulic', keywords: ['hydraulic', 'oil leak', 'hyd oil', 'hydraulic pressure', 'pump pressure'] },
  { category: 'sensor', keywords: ['sensor', 'photo eye', 'proximity', 'limit switch', 'encoder', 'signal'] },
  { category: 'software', keywords: ['software', 'program', 'firmware', 'plc logic', 'hmi', 'parameter'] },
  { category: 'electrical', keywords: ['electrical', 'electric', 'power', 'voltage', 'breaker', 'fuse', 'relay', 'contactor', 'motor trip', 'short circuit'] },
  { category: 'consumable', keywords: ['consumable', 'spare part', 'filter', 'battery', 'blade', 'brush', 'lubricant'] },
  { category: 'mechanical', keywords: ['mechanical', 'bearing', 'belt', 'chain', 'gear', 'shaft', 'motor', 'spindle', 'roller', 'jam', 'vibration', 'noise'] },
  { category: 'process', keywords: ['operator', 'setup', 'calibration', 'alignment', 'adjustment', 'process', 'cleaning'] },
];

const COMPONENT_RULES = [
  ['bearing', ['bearing']],
  ['belt', ['belt']],
  ['chain', ['chain']],
  ['gear', ['gear']],
  ['shaft', ['shaft', 'spindle']],
  ['motor', ['motor']],
  ['sensor', ['sensor', 'photo eye', 'proximity', 'limit switch', 'encoder']],
  ['valve', ['valve']],
  ['cylinder', ['cylinder']],
  ['pump', ['pump']],
  ['filter', ['filter']],
  ['battery', ['battery']],
  ['plc_hmi', ['plc', 'hmi']],
];

const MODE_RULES = [
  ['leak', ['leak']],
  ['jammed', ['jam', 'stuck', 'blocked']],
  ['worn', ['wear', 'worn']],
  ['broken', ['broken', 'break', 'crack', 'damage']],
  ['overheated', ['overheat', 'hot', 'temperature']],
  ['no_signal', ['no signal', 'signal loss']],
  ['low_pressure', ['low pressure', 'pressure low']],
  ['trip', ['trip', 'tripped']],
  ['noise', ['noise', 'vibration']],
  ['misaligned', ['alignment', 'misalign']],
  ['maintenance_operation', ['pm operation', 'preventive maintenance', 'planned maintenance']],
];

export function normalizeFailureSignal(workorder = {}) {
  const sourceEntries = FAILURE_SIGNAL_FIELDS
    .map((field) => [field, stringOrUndefined(workorder[field])])
    .filter(([, value]) => value);
  const pmJobType = stringOrUndefined(workorder.job_type);
  const classificationEntries = pmJobType ? [...sourceEntries, ['job_type', pmJobType]] : sourceEntries;
  const rawText = sourceEntries[0]?.[1] ?? pmJobType ?? undefined;
  const normalizedSearchText = classificationEntries.map(([, value]) => value).join(' | ').toLowerCase();
  const category = findCategory(normalizedSearchText);
  const method = category === 'unknown' ? 'fallback' : 'rule';
  const component = findRuleValue(normalizedSearchText, COMPONENT_RULES);
  const mode = findRuleValue(normalizedSearchText, MODE_RULES);
  const symptom = mode ?? component ?? (category === 'preventive_maintenance' ? 'scheduled_service' : undefined);
  const label = category === 'unknown'
    ? (rawText ?? 'Unknown failure signal')
    : category.split('_').map(capitalize).join(' ');

  return {
    raw_text: rawText,
    normalized_key: category === 'unknown' ? 'unknown' : category,
    normalized_label: label,
    failure_category: category,
    failure_component: component,
    failure_mode: mode,
    failure_symptom: symptom,
    taxonomy_version: FAILURE_TAXONOMY_VERSION,
    taxonomy_method: method,
    taxonomy_confidence: taxonomyConfidence(method, sourceEntries.length),
    taxonomy_source_fields: classificationEntries.map(([field]) => field),
  };
}

function evidenceSources({ workorder, tasks, parts, holdHistory, relatedHistory, repeatFailure, failureFrequency, reliabilityContext }) {
  const now = new Date().toISOString();
  return [
    { source: 'maintenance.work_order', record_count: workorder ? 1 : 0, generated_at: now },
    { source: 'maintenance.work_order_task', record_count: tasks.length, generated_at: now },
    { source: 'maintenance.v_spare_part_usage_by_workorder', record_count: parts.length, generated_at: now },
    { source: 'maintenance.work_order_hold_history', record_count: holdHistory.length, generated_at: now },
    { source: 'maintenance.v_machine_maintenance_history', record_count: relatedHistory.length, generated_at: now },
    { source: 'maintenance.v_repeat_failure_candidates', record_count: repeatFailure ? 1 : 0, generated_at: now },
    { source: 'maintenance.work_order.failure_frequency', record_count: failureFrequency ? 1 : 0, generated_at: now },
    { source: 'maintenance.v_mtbf_mttr_base', record_count: reliabilityContext ? 1 : 0, generated_at: now },
  ];
}

function findCategory(value) {
  for (const rule of TAXONOMY_RULES) {
    if (includesAny(value, rule.keywords)) {
      return rule.category;
    }
  }
  return 'unknown';
}

function findRuleValue(value, rules) {
  for (const [label, keywords] of rules) {
    if (includesAny(value, keywords)) {
      return label;
    }
  }
  return undefined;
}

function includesAny(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword));
}

function taxonomyConfidence(method, sourceFieldCount) {
  if (method === 'fallback') {
    return sourceFieldCount > 0 ? 0.25 : 0;
  }
  return sourceFieldCount > 1 ? 0.85 : 0.7;
}

function capitalize(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
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

function dateOnlyString(value) {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
  const serialized = dateString(value);
  return serialized ? serialized.slice(0, 10) : undefined;
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
