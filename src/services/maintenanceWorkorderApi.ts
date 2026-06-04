import { MAINTENANCE_API_BASE_URL } from '../shared/config/env';
import type {
  MaintenanceApiResponse,
  MaintenanceDashboardSummary,
  MaintenanceHoldHistory,
  MaintenanceMtbfMttrSummary,
  MaintenancePartUsage,
  MaintenanceQueryFilters,
  MaintenanceRiskMachine,
  MaintenanceWorkOrder,
  MaintenanceWorkOrderDetail,
} from '../types/maintenance';

type QueryValue = string | number | boolean | string[] | undefined;
type RawRecord = Record<string, unknown>;

const MAINTENANCE_ENDPOINTS = {
  health: '/api/health',
  workorders: '/api/maintenance/workorders',
  workorderDetail: (workorderNo: string) => `/api/maintenance/workorders/${encodeURIComponent(workorderNo)}`,
  equipmentHistory: (equipmentNo: string) => `/api/maintenance/equipment/${encodeURIComponent(equipmentNo)}/history`,
  mtbfMttr: '/api/maintenance/analytics/mtbf-mttr',
  workorderParts: (workorderNo: string) => `/api/maintenance/workorders/${encodeURIComponent(workorderNo)}/parts`,
  holdReasons: '/api/maintenance/analytics/hold-reasons',
  repeatFailures: '/api/maintenance/analytics/repeat-failures',
  stockRisk: '/api/maintenance/analytics/stock-risk',
  dashboardSummary: '/api/maintenance/dashboard-summary',
} as const;

export function getMaintenanceApiHealth(): Promise<unknown> {
  return maintenanceRuntimeGet(MAINTENANCE_ENDPOINTS.health);
}

export function getWorkorderTracking(filters: MaintenanceQueryFilters = {}): Promise<MaintenanceApiResponse<MaintenanceWorkOrder[]>> {
  return getNormalizedList(MAINTENANCE_ENDPOINTS.workorders, filters, normalizeWorkOrder);
}

export function getWorkorderDetail(workorderNo: string): Promise<MaintenanceApiResponse<MaintenanceWorkOrderDetail>> {
  assertRequiredIdentifier(workorderNo, 'workorderNo');
  return getNormalizedItem(MAINTENANCE_ENDPOINTS.workorderDetail(workorderNo), undefined, normalizeWorkOrderDetail);
}

export function getMachineMaintenanceHistory(
  equipmentNo: string,
  filters: MaintenanceQueryFilters = {},
): Promise<MaintenanceApiResponse<MaintenanceWorkOrder[]>> {
  assertRequiredIdentifier(equipmentNo, 'equipmentNo');
  return getNormalizedList(MAINTENANCE_ENDPOINTS.equipmentHistory(equipmentNo), filters, normalizeWorkOrder);
}

export function getMtbfMttrSummary(filters: MaintenanceQueryFilters = {}): Promise<MaintenanceApiResponse<MaintenanceMtbfMttrSummary[]>> {
  return getNormalizedList(MAINTENANCE_ENDPOINTS.mtbfMttr, filters, normalizeMtbfMttrSummary);
}

export function getSparePartUsageByWorkorder(workorderNo: string): Promise<MaintenanceApiResponse<MaintenancePartUsage[]>> {
  assertRequiredIdentifier(workorderNo, 'workorderNo');
  return getNormalizedList(MAINTENANCE_ENDPOINTS.workorderParts(workorderNo), undefined, normalizePartUsage);
}

export function getHoldReasonSummary(filters: MaintenanceQueryFilters = {}): Promise<MaintenanceApiResponse<MaintenanceHoldHistory[]>> {
  return getNormalizedList(MAINTENANCE_ENDPOINTS.holdReasons, filters, normalizeHoldHistory);
}

export function getRepeatFailureCandidates(filters: MaintenanceQueryFilters = {}): Promise<MaintenanceApiResponse<MaintenanceRiskMachine[]>> {
  return getNormalizedList(MAINTENANCE_ENDPOINTS.repeatFailures, filters, normalizeRiskMachine);
}

export function getStockRiskSummary(filters: MaintenanceQueryFilters = {}): Promise<MaintenanceApiResponse<MaintenanceRiskMachine[]>> {
  return getNormalizedList(MAINTENANCE_ENDPOINTS.stockRisk, filters, normalizeRiskMachine);
}

export async function getMaintenanceDashboardSummary(filters: MaintenanceQueryFilters = {}): Promise<MaintenanceApiResponse<MaintenanceDashboardSummary>> {
  const response = await maintenanceRuntimeGet<unknown>(MAINTENANCE_ENDPOINTS.dashboardSummary, toQueryParams(filters));
  return normalizeApiResponse(response, normalizeDashboardSummary);
}

async function getNormalizedList<T>(
  path: string,
  filters: MaintenanceQueryFilters | undefined,
  normalizeItem: (item: RawRecord) => T,
): Promise<MaintenanceApiResponse<T[]>> {
  const response = await maintenanceRuntimeGet<unknown>(path, toQueryParams(filters));
  return normalizeApiResponse(response, (value) => toArray(value).map((item) => normalizeItem(toRecord(item))));
}

async function getNormalizedItem<T>(
  path: string,
  filters: MaintenanceQueryFilters | undefined,
  normalizeItem: (item: RawRecord) => T,
): Promise<MaintenanceApiResponse<T>> {
  const response = await maintenanceRuntimeGet<unknown>(path, toQueryParams(filters));
  return normalizeApiResponse(response, (value) => normalizeItem(toRecord(value)));
}

export function getMaintenanceRuntimeApiBaseUrl(): string {
  return MAINTENANCE_API_BASE_URL.trim().replace(/\/+$/, '');
}

export function buildMaintenanceRuntimeUrl(path: string, params?: Record<string, QueryValue>): string {
  const url = new URL(`${getMaintenanceRuntimeApiBaseUrl()}${normalizePath(path)}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        url.searchParams.append(key, item);
      });
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function maintenanceRuntimeGet<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
  const url = buildMaintenanceRuntimeUrl(path, params);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : '';
    throw new Error(`Maintenance API unavailable at ${getMaintenanceRuntimeApiBaseUrl()}.${detail}`);
  }

  if (response.ok) {
    return response.json() as Promise<T>;
  }

  const responseBody = await response.text();
  const detail = responseBody ? `: ${responseBody}` : '';
  throw new Error(`Maintenance API request failed with ${response.status} ${response.statusText}${detail}`);
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function toMaintenanceQueryParams(filters: MaintenanceQueryFilters = {}): Record<string, QueryValue> {
  return toQueryParams(filters);
}

function toQueryParams(filters: MaintenanceQueryFilters = {}): Record<string, QueryValue> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, QueryValue>;
}

function normalizeApiResponse<T>(response: unknown, normalizeData: (value: unknown) => T): MaintenanceApiResponse<T> {
  const record = toRecord(response);
  const hasWrappedData = Object.prototype.hasOwnProperty.call(record, 'data');
  const rawData = hasWrappedData ? record.data : response;

  return {
    data: normalizeData(rawData),
    trace_id: getString(record, 'trace_id'),
    total: getNumber(record, 'total'),
    warnings: toStringArray(record.warnings),
  };
}

export function normalizeWorkOrder(item: RawRecord): MaintenanceWorkOrder {
  return {
    work_order_id: getString(item, 'work_order_id'),
    workorder_no: getRequiredString(item, 'workorder_no'),
    status: getString(item, 'status'),
    job_type: getString(item, 'job_type'),
    priority: getString(item, 'priority'),
    equipment_no: getString(item, 'equipment_no'),
    equipment_desc: getString(item, 'equipment_desc'),
    site: getString(item, 'site'),
    location: getString(item, 'location'),
    department: getString(item, 'department'),
    plan_start: getString(item, 'plan_start'),
    plan_finish: getString(item, 'plan_finish'),
    act_work_start: getString(item, 'act_work_start'),
    act_work_end: getString(item, 'act_work_end'),
    total_repair_time_hours: getNumber(item, 'total_repair_time_hours') ?? 0,
    down_time_hours: getNumber(item, 'down_time_hours') ?? 0,
    reason: getString(item, 'reason'),
    solution: getString(item, 'solution'),
    failure_description: getString(item, 'failure_description'),
    action_description: getString(item, 'action_description'),
    task_count: getNumber(item, 'task_count') ?? 0,
    part_transaction_count: getNumber(item, 'part_transaction_count') ?? 0,
    issued_qty: getNumber(item, 'issued_qty') ?? 0,
  };
}

export function normalizeWorkOrderDetail(item: RawRecord): MaintenanceWorkOrderDetail {
  return {
    ...normalizeWorkOrder(item),
    equipment: normalizeEquipment(toRecord(item.equipment)),
    tasks: toArray(item.tasks).map((task) => normalizeTask(toRecord(task))),
    parts: toArray(item.parts).map((part) => normalizePartUsage(toRecord(part))),
    hold_history: toArray(item.hold_history).map((hold) => normalizeHoldHistory(toRecord(hold))),
  };
}

export function normalizePartUsage(item: RawRecord): MaintenancePartUsage {
  return {
    workorder_no: getRequiredString(item, 'workorder_no'),
    equipment_no: getString(item, 'equipment_no'),
    equipment_desc: getString(item, 'equipment_desc'),
    job_type: getString(item, 'job_type'),
    status: getString(item, 'status'),
    catalogue_no: getString(item, 'catalogue_no'),
    part_name: getString(item, 'part_name'),
    uom: getString(item, 'uom'),
    issued_qty: getNumber(item, 'issued_qty') ?? 0,
    movement_qty: getNumber(item, 'movement_qty') ?? 0,
    transaction_count: getNumber(item, 'transaction_count') ?? 0,
    first_transaction_at: getString(item, 'first_transaction_at'),
    last_transaction_at: getString(item, 'last_transaction_at'),
  };
}

export function normalizeMtbfMttrSummary(item: RawRecord): MaintenanceMtbfMttrSummary {
  return {
    equipment_no: getRequiredString(item, 'equipment_no'),
    equipment_desc: getString(item, 'equipment_desc'),
    failure_count: getNumber(item, 'failure_count', 'workorder_count') ?? 0,
    mtbf_hours: getNumber(item, 'mtbf_hours'),
    mttr_hours: getNumber(item, 'mttr_hours'),
    total_downtime_hours: getNumber(item, 'total_downtime_hours', 'down_time_hours') ?? 0,
    last_failure_at: getString(item, 'last_failure_at'),
    last_repair_end: getString(item, 'last_repair_end'),
  };
}

export function normalizeHoldHistory(item: RawRecord): MaintenanceHoldHistory {
  return {
    workorder_no: getString(item, 'workorder_no'),
    hold_reason_description: getString(item, 'hold_reason_description'),
    hold_count: getNumber(item, 'hold_count'),
    affected_workorder_count: getNumber(item, 'affected_workorder_count'),
    first_hold_at: getString(item, 'first_hold_at'),
    last_hold_at: getString(item, 'last_hold_at'),
    hold_date: getString(item, 'hold_date'),
    hold_by: getString(item, 'hold_by'),
    site: getString(item, 'site'),
    location: getString(item, 'location'),
    department: getString(item, 'department'),
    equipment_type: getString(item, 'equipment_type'),
    operator_id: getString(item, 'operator_id'),
  };
}

export function normalizeRiskMachine(item: RawRecord): MaintenanceRiskMachine {
  return {
    equipment_no: getString(item, 'equipment_no'),
    equipment_desc: getString(item, 'equipment_desc'),
    failure_signal: getString(item, 'failure_signal'),
    workorder_count: getNumber(item, 'workorder_count'),
    first_seen_at: getString(item, 'first_seen_at'),
    last_seen_at: getString(item, 'last_seen_at'),
    workorders: toStringArray(item.workorders),
    catalogue_no: getString(item, 'catalogue_no'),
    part_name: getString(item, 'part_name'),
    warehouse_code: getString(item, 'warehouse_code'),
    bin_location: getString(item, 'bin_location'),
    on_hand: getNumber(item, 'on_hand'),
    reorder_point: getNumber(item, 'reorder_point'),
    min_qty: getNumber(item, 'min_qty'),
    stock_value: getNumber(item, 'stock_value'),
    stock_risk: getString(item, 'stock_risk'),
  };
}

export function normalizeDashboardSummary(item: RawRecord): MaintenanceDashboardSummary {
  return {
    open_workorder_count: getNumber(item, 'open_workorder_count') ?? 0,
    overdue_workorder_count: getNumber(item, 'overdue_workorder_count') ?? 0,
    on_hold_workorder_count: getNumber(item, 'on_hold_workorder_count') ?? 0,
    completed_workorder_count: getNumber(item, 'completed_workorder_count') ?? 0,
    total_downtime_hours: getNumber(item, 'total_downtime_hours') ?? 0,
    repeat_failure_candidate_count: getNumber(item, 'repeat_failure_candidate_count') ?? 0,
    stock_risk_item_count: getNumber(item, 'stock_risk_item_count') ?? 0,
    mtbf_mttr: toArray(item.mtbf_mttr).map((row) => normalizeMtbfMttrSummary(toRecord(row))),
    top_risk_machines: toArray(item.top_risk_machines).map((row) => normalizeRiskMachine(toRecord(row))),
    top_hold_reasons: toArray(item.top_hold_reasons).map((row) => normalizeHoldHistory(toRecord(row))),
  };
}

function normalizeEquipment(item: RawRecord): MaintenanceWorkOrderDetail['equipment'] {
  const equipmentNo = getString(item, 'equipment_no');
  if (!equipmentNo) {
    return undefined;
  }

  return {
    equipment_no: equipmentNo,
    equipment_desc: getString(item, 'equipment_desc'),
    equipment_type: getString(item, 'equipment_type'),
    model_no: getString(item, 'model_no'),
    serial_no: getString(item, 'serial_no'),
    manufacturer: getString(item, 'manufacturer'),
    department: getString(item, 'department'),
    site: getString(item, 'site'),
    location: getString(item, 'location'),
    is_active: getBoolean(item, 'is_active'),
  };
}

function normalizeTask(item: RawRecord) {
  return {
    task_no: getString(item, 'task_no'),
    description_1: getString(item, 'description_1'),
    description_2: getString(item, 'description_2'),
    value_text: getString(item, 'value_text'),
    reference: getString(item, 'reference'),
    authorizer: getString(item, 'authorizer'),
    request_no: getString(item, 'request_no'),
  };
}

function assertRequiredIdentifier(value: string, name: string): void {
  if (!value?.trim()) {
    throw new Error(`${name} is required.`);
  }
}

function toRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? value as RawRecord : {};
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  const record = toRecord(value);
  if (Array.isArray(record.items)) {
    return record.items;
  }

  if (Array.isArray(record.rows)) {
    return record.rows;
  }

  return [];
}

function getRequiredString(record: RawRecord, key: string): string {
  return getString(record, key) ?? '';
}

function getString(record: RawRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }
  return undefined;
}

function getNumber(record: RawRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const numberValue = Number(value);
      if (!Number.isNaN(numberValue)) {
        return numberValue;
      }
    }
  }
  return undefined;
}

function getBoolean(record: RawRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return undefined;
}
