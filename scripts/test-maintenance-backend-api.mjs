import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { getJson, usageText as apiSmokeUsageText } from './maintenance/smoke-maintenance-api.mjs';
import { requireDatabaseUrl as requireSmokeDatabaseUrl, usageText as dataSmokeUsageText } from './maintenance/smoke-maintenance-real-data.mjs';
import { createCorsHandler, getAllowedCorsOrigins } from '../src/server/cors.mjs';
import { assertDatabaseUrl, MissingDatabaseUrlError } from '../src/server/db/postgres.mjs';
import {
  buildHoldReasonsQuery,
  buildFailureFrequencyQuery,
  buildFailureParetoQuery,
  buildMachineHealthQuery,
  buildMtbfMttrQuery,
  buildRcaFailureFrequencyQuery,
  buildRcaReliabilityContextQuery,
  buildRcaRepeatFailureQuery,
  buildReliabilityMtbfQuery,
  buildReliabilityMttrQuery,
  buildRepeatFailuresQuery,
} from '../src/server/maintenance/repositories/maintenanceAnalyticsRepository.mjs';
import {
  buildMaintenancePartCostQuery,
  buildSparePartRiskQuery,
  buildStockRiskQuery,
} from '../src/server/maintenance/repositories/maintenanceInventoryRepository.mjs';
import {
  buildRcaRelatedHistoryQuery,
  buildRcaWorkorderBaseQuery,
  buildWorkordersQuery,
} from '../src/server/maintenance/repositories/maintenanceWorkorderRepository.mjs';
import { createMaintenanceRouter, matchRoute } from '../src/server/maintenance/routes/maintenanceRoutes.mjs';
import { normalizeFailureSignal } from '../src/server/maintenance/dto/maintenanceDto.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

testQueryBuilders();
await testRoutes();
await testCors();
await testNoStagingRuntimeReferences();
await testSmokeScriptHelpAndFailureModes();
testNoCommittedUploads();
testMissingDatabaseUrl();

console.log('Maintenance backend API tests passed.');

function testQueryBuilders() {
  const workorders = buildWorkordersQuery({
    site: "HOYA-BKK' OR 1=1 --",
    status: 'open',
    from: '2026-01-01',
    to: '2026-02-01',
    limit: 9999,
    offset: 5,
  });

  assert.match(workorders.text, /maintenance\.v_workorder_tracking/);
  assert.doesNotMatch(workorders.text, /OR 1=1/);
  assert.deepEqual(workorders.values.slice(0, 4), ["HOYA-BKK' OR 1=1 --", 'open', '2026-01-01', '2026-02-01']);
  assert.equal(workorders.limit, 500);
  assert.equal(workorders.offset, 5);
  assert.match(workorders.text, /LIMIT \$5 OFFSET \$6/);

  const defaulted = buildWorkordersQuery({ limit: '-1', offset: '-9' });
  assert.equal(defaulted.limit, 50);
  assert.equal(defaulted.offset, 0);

  const mtbf = buildMtbfMttrQuery({ equipment_no: 'MC-01', limit: 10 });
  assert.match(mtbf.text, /maintenance\.v_mtbf_mttr_base/);
  assert.deepEqual(mtbf.values, ['MC-01', 10, 0]);

  const reliabilityMtbf = buildReliabilityMtbfQuery({ section: 'MC1', machine_no: 'MC-01', period_month: '2026-06-01', limit: 3, offset: 2 });
  assert.match(reliabilityMtbf.text, /maintenance\.v_mtbf_mttr_base base/);
  assert.match(reliabilityMtbf.text, /LEFT JOIN maintenance\.equipment equipment/);
  assert.doesNotMatch(reliabilityMtbf.text, /maintenance\.stg_/i);
  assert.deepEqual(reliabilityMtbf.values, ['2026-06-01', 'MC-01', 'MC1', 'MC1%', 3, 2]);
  assert.match(reliabilityMtbf.text, /ORDER BY period_month DESC NULLS LAST, mtbf_hours ASC NULLS LAST/);

  const reliabilityMttr = buildReliabilityMttrQuery({ machine_type: 'GRINDER', limit: 4 });
  assert.deepEqual(reliabilityMttr.values, ['GRINDER', 4, 0]);
  assert.match(reliabilityMttr.text, /mttr_minutes DESC NULLS LAST/);

  const machineHealth = buildMachineHealthQuery({ limit: 5 });
  assert.deepEqual(machineHealth.values, [5, 0]);
  assert.match(machineHealth.text, /health_score ASC NULLS LAST/);

  const holds = buildHoldReasonsQuery({ site: 'HOYA-BKK', department: 'ENG' });
  assert.match(holds.text, /maintenance\.v_hold_reason_summary/);
  assert.deepEqual(holds.values.slice(0, 2), ['HOYA-BKK', 'ENG']);

  const stock = buildStockRiskQuery({ catalogue_no: 'BRG-01', stock_risk: 'zero_stock' });
  assert.match(stock.text, /maintenance\.v_stock_risk_summary/);
  assert.deepEqual(stock.values.slice(0, 2), ['BRG-01', 'zero_stock']);

  const maintenancePartCost = buildMaintenancePartCostQuery({
    workorder_no: 'WO-1001',
    machine_no: 'MC-01',
    period_month: '2026-06-01',
    section: 'MC1',
    machine_type: 'GRINDER',
    limit: 25,
    offset: 5,
  });
  assert.match(maintenancePartCost.text, /maintenance\.v_spare_part_usage_by_workorder usage/);
  assert.match(maintenancePartCost.text, /LEFT JOIN maintenance\.part_catalog part/);
  assert.deepEqual(maintenancePartCost.values, ['WO-1001', 'MC-01', '2026-06-01', 'MC1', 'GRINDER', 25, 5]);

  const sparePartRisk = buildSparePartRiskQuery({ catalogue_no: 'BRG-01', query: 'BMM26', limit: 25, offset: 2 });
  assert.match(sparePartRisk.text, /maintenance\.v_stock_risk_summary/);
  assert.match(sparePartRisk.text, /ILIKE/);
  assert.deepEqual(sparePartRisk.values, ['BRG-01', '%BMM26%', 25, 2]);

  const frequency = buildFailureFrequencyQuery({
    site: "HOYA-BKK' OR 1=1 --",
    equipment_type: 'GRINDER',
    failure_signal: 'Bearing noise',
    group_by: 'equipment_type; DROP TABLE maintenance.work_order;',
    from: '2026-01-01',
    to: '2026-02-01',
    limit: 9999,
    offset: 4,
  });
  assert.match(frequency.text, /maintenance\.work_order/);
  assert.doesNotMatch(frequency.text, /DROP TABLE|OR 1=1/);
  assert.match(frequency.text, /failure_signal AS failure_signal/);
  assert.match(frequency.text, /ORDER BY failure_count DESC, total_downtime_hours DESC, failure_signal/);
  assert.deepEqual(frequency.values, ["HOYA-BKK' OR 1=1 --", 'GRINDER', 'Bearing noise', '2026-01-01', '2026-02-01', 500, 4]);
  assert.equal(frequency.limit, 500);
  assert.equal(frequency.offset, 4);

  const frequencyByDepartment = buildFailureFrequencyQuery({ group_by: 'department', limit: 3 });
  assert.match(frequencyByDepartment.text, /department AS failure_signal/);
  assert.deepEqual(frequencyByDepartment.values, [3, 0]);

  const pareto = buildFailureParetoQuery({
    department: 'ENG',
    basis: 'downtime',
    top_n: 9999,
    from: '2026-01-01',
    to: '2026-02-01',
  });
  assert.match(pareto.text, /maintenance\.work_order/);
  assert.doesNotMatch(pareto.text, /maintenance\.stg_/i);
  assert.match(pareto.text, /row_number\(\) OVER \(ORDER BY total_downtime_hours DESC, failure_signal\)::int AS rank/);
  assert.match(pareto.text, /sum\(value\) OVER \(ORDER BY rank\) \/ total_value/);
  assert.deepEqual(pareto.values, ['ENG', '2026-01-01', '2026-02-01', 'downtime', 500]);
  assert.equal(pareto.limit, 500);
  assert.equal(pareto.offset, 0);

  const defaultPareto = buildFailureParetoQuery({ basis: 'bad-basis', top_n: '-5' });
  assert.deepEqual(defaultPareto.values, ['count', 10]);
  assert.equal(defaultPareto.limit, 10);

  const repeats = buildRepeatFailuresQuery({ equipment_no: 'MC-01', failure_signal: 'Bearing noise', from: '2026-01-01', to: '2026-02-01' });
  assert.match(repeats.text, /maintenance\.v_repeat_failure_candidates candidate/);
  assert.match(repeats.text, /LEFT JOIN maintenance\.work_order tracking/);
  assert.doesNotMatch(repeats.text, /maintenance\.stg_/i);
  assert.deepEqual(repeats.values.slice(0, 4), ['MC-01', 'Bearing noise', '2026-01-01', '2026-02-01']);

  const rcaBase = buildRcaWorkorderBaseQuery();
  assert.match(rcaBase.text, /FROM maintenance\.work_order wo/);
  assert.match(rcaBase.text, /WHERE wo\.workorder_no = \$1/);
  assert.doesNotMatch(rcaBase.text, /maintenance\.stg_/i);

  const rcaHistoryDefault = buildRcaRelatedHistoryQuery('MC-01', {});
  assert.match(rcaHistoryDefault.text, /maintenance\.v_machine_maintenance_history/);
  assert.deepEqual(rcaHistoryDefault.values, ['MC-01', 10]);
  assert.equal(rcaHistoryDefault.limit, 10);

  const rcaHistoryClamped = buildRcaRelatedHistoryQuery('MC-01', {
    history_limit: 999,
    from: '2026-01-01',
    to: '2026-02-01',
    exclude_workorder_no: 'WO-1001',
  });
  assert.deepEqual(rcaHistoryClamped.values, ['MC-01', '2026-01-01', '2026-02-01', 'WO-1001', 50]);
  assert.equal(rcaHistoryClamped.limit, 50);
  assert.doesNotMatch(rcaHistoryClamped.text, /999/);

  const rcaReliability = buildRcaReliabilityContextQuery('MC-01', { from: '2026-01-01' });
  assert.match(rcaReliability.text, /maintenance\.v_mtbf_mttr_base/);
  assert.deepEqual(rcaReliability.values, ['MC-01', '2026-01-01']);

  const rcaRepeat = buildRcaRepeatFailureQuery('MC-01', 'Bearing noise');
  assert.match(rcaRepeat.text, /maintenance\.v_repeat_failure_candidates candidate/);
  assert.deepEqual(rcaRepeat.values, ['MC-01', 'Bearing noise']);

  const rcaFrequency = buildRcaFailureFrequencyQuery('Bearing noise', { to: '2026-02-01' });
  assert.match(rcaFrequency.text, /FROM maintenance\.work_order/);
  assert.deepEqual(rcaFrequency.values, ['Bearing noise', '2026-02-01']);
  assert.doesNotMatch(rcaFrequency.text, /maintenance\.stg_/i);

  const mechanicalSignal = normalizeFailureSignal({ failure_description: 'Bearing noise from spindle' });
  assert.equal(mechanicalSignal.failure_category, 'mechanical');
  assert.equal(mechanicalSignal.failure_component, 'bearing');
  assert.equal(mechanicalSignal.taxonomy_method, 'rule');
  assert.equal(mechanicalSignal.taxonomy_version, 'r5b-phase3a-v1');

  const pmSignal = normalizeFailureSignal({ description: 'PM Operation monthly inspection', job_type: 'PM Operation' });
  assert.equal(pmSignal.failure_category, 'preventive_maintenance');
  assert.notEqual(pmSignal.failure_category, 'mechanical');
  assert.equal(pmSignal.taxonomy_method, 'rule');

  const fallbackSignal = normalizeFailureSignal({});
  assert.equal(fallbackSignal.failure_category, 'unknown');
  assert.equal(fallbackSignal.taxonomy_method, 'fallback');
}

async function testRoutes() {
  const calls = [];
  const router = createMaintenanceRouter({
    workorderService: {
      async listWorkorders(filters) {
        calls.push(['listWorkorders', filters]);
        return {
          data: [{ workorder_no: 'WO-1001', total_repair_time_hours: 0, down_time_hours: 2 }],
          total: 1,
          limit: 25,
          offset: 0,
        };
      },
      async getWorkorderDetail(workorderNo) {
        if (workorderNo === 'WO-404') {
          return null;
        }
        return { workorder_no: workorderNo, tasks: [], parts: [], hold_history: [], total_repair_time_hours: 0, down_time_hours: 0 };
      },
      async listEquipmentHistory(equipmentNo) {
        return { data: [{ workorder_no: 'WO-0999', equipment_no: equipmentNo }], total: 1, limit: 50, offset: 0 };
      },
      async listPartsByWorkorder(workorderNo) {
        return { data: [{ workorder_no: workorderNo, transaction_count: 1, issued_qty: 0, movement_qty: 1 }], total: 1, limit: 1, offset: 0 };
      },
    },
    analyticsService: {
      async listMtbfMttr() {
        return { data: [{ equipment_no: 'MC-01', failure_count: 2, total_downtime_hours: 3 }], total: 1, limit: 50, offset: 0 };
      },
      async listReliabilityMtbf(filters) {
        calls.push(['listReliabilityMtbf', filters]);
        return { data: [{ machine_no: 'MC-01', period_month: '2026-06-01', mtbf_hours: 12.5 }], total: 1, limit: 3, offset: 0 };
      },
      async listReliabilityMttr(filters) {
        calls.push(['listReliabilityMttr', filters]);
        return { data: [{ machine_no: 'MC-01', period_month: '2026-06-01', mttr_minutes: 44 }], total: 1, limit: 3, offset: 0 };
      },
      async listMachineHealth(filters) {
        calls.push(['listMachineHealth', filters]);
        return { data: [{ machine_no: 'MC-01', period_month: '2026-06-01', health_score: 71, health_band: 'healthy' }], total: 1, limit: 3, offset: 0 };
      },
      async listHoldReasons() {
        return { data: [{ hold_reason_description: 'Waiting part', hold_count: 2 }], total: 1, limit: 50, offset: 0 };
      },
      async listRepeatFailures() {
        return {
          data: [{
            equipment_no: 'MC-01',
            equipment_desc: 'Generator 1',
            failure_signal: 'Bearing noise',
            workorder_count: 2,
            total_downtime_hours: 4,
            avg_repair_time_hours: 1.5,
            workorders: ['WO-1001', 'WO-0999'],
          }],
          total: 1,
          limit: 50,
          offset: 0,
        };
      },
      async getRcaEvidence(filters) {
        calls.push(['getRcaEvidence', filters]);
        if (filters.workorder_no === 'WO-404') {
          return null;
        }
        return {
          workorder: {
            workorder_no: filters.workorder_no,
            equipment_no: 'MC-01',
            total_repair_time_hours: 1.5,
            down_time_hours: 2,
            tasks: [],
            parts: [],
            hold_history: [],
          },
          failure_signal: {
            raw_text: 'Bearing noise',
            normalized_key: 'mechanical',
            normalized_label: 'Mechanical',
            failure_category: 'mechanical',
            failure_component: 'bearing',
            taxonomy_version: 'r5b-phase3a-v1',
            taxonomy_method: 'rule',
            taxonomy_confidence: 0.7,
            taxonomy_source_fields: ['failure_description'],
          },
          reliability_context: {
            mtbf_hours: 12,
            mttr_hours: 1.5,
            total_downtime_hours: 2,
            health_score: 72,
            health_band: 'healthy',
          },
          related_history: [],
          repeat_failure: undefined,
          failure_frequency: undefined,
          evidence_sources: [
            { source: 'maintenance.work_order', record_count: 1, generated_at: '2026-06-06T00:00:00.000Z' },
            { source: 'maintenance.work_order_task', record_count: 0, generated_at: '2026-06-06T00:00:00.000Z' },
          ],
          warnings: [
            'No task history was found for this workorder.',
            'No part or consumable usage was found for this workorder.',
            'No hold history was found for this workorder.',
          ],
        };
      },
      async listFailureFrequency(filters) {
        calls.push(['listFailureFrequency', filters]);
        return {
          data: [{
            failure_signal: 'Bearing noise',
            failure_count: 3,
            affected_equipment_count: 2,
            workorder_count: 3,
            total_downtime_hours: 8,
            avg_repair_time_hours: 1.5,
          }],
          total: 1,
          limit: 10,
          offset: 0,
        };
      },
      async listFailurePareto(filters) {
        calls.push(['listFailurePareto', filters]);
        return {
          data: [{
            rank: 1,
            failure_signal: 'Bearing noise',
            value: 8,
            basis: 'downtime',
            percentage: 80,
            cumulative_percentage: 80,
            workorder_count: 3,
            affected_equipment_count: 2,
          }],
          total: 1,
          limit: 5,
          offset: 0,
        };
      },
      async listStockRisk() {
        return { data: [{ catalogue_no: 'BRG-01', stock_risk: 'zero_stock' }], total: 1, limit: 50, offset: 0 };
      },
      async listMaintenancePartCost(filters) {
        calls.push(['listMaintenancePartCost', filters]);
        return {
          data: [{
            workorder_no: 'WO-1001',
            machine_no: 'MC-01',
            catalogue_no: 'BRG-01',
            estimated_part_cost: 1250,
          }],
          total: 1,
          limit: 25,
          offset: 0,
          metadata: { source_view: 'maintenance.v_spare_part_usage_by_workorder' },
          evidence_refs: [],
          warnings: [],
        };
      },
      async listSparePartRisk(filters) {
        calls.push(['listSparePartRisk', filters]);
        return {
          data: [{
            catalogue_no: 'BRG-01',
            part_name: 'Bearing',
            stock_risk: 'zero_stock',
          }],
          total: 1,
          limit: 25,
          offset: 0,
          metadata: { source_view: 'maintenance.v_stock_risk_summary' },
          evidence_refs: [],
          warnings: [],
        };
      },
      async getDashboardSummary() {
        return { open_workorder_count: 1, overdue_workorder_count: 0, on_hold_workorder_count: 0, completed_workorder_count: 1 };
      },
    },
  });

  const health = await invoke(router, '/api/health');
  assert.equal(health.statusCode, 200);
  assert.equal(health.body.service, 'hoya-ui-maintenance-api');

  const workorders = await invoke(router, '/api/maintenance/workorders?site=HOYA-BKK&limit=25');
  assert.equal(workorders.statusCode, 200);
  assert.equal(workorders.body.total, 1);
  assert.equal(workorders.body.limit, 25);
  assert.equal(workorders.body.data[0].workorder_no, 'WO-1001');
  assert.deepEqual(calls[0], ['listWorkorders', { site: 'HOYA-BKK', limit: '25' }]);

  const detail = await invoke(router, '/api/maintenance/workorders/WO-1001');
  assert.equal(detail.statusCode, 200);
  assert.equal(detail.body.data.workorder_no, 'WO-1001');

  const notFound = await invoke(router, '/api/maintenance/workorders/WO-404');
  assert.equal(notFound.statusCode, 404);
  assert.equal(notFound.body.error.code, 'WORKORDER_NOT_FOUND');

  const mtbfEndpoint = await invoke(router, '/api/maintenance/analytics/mtbf?section=MC1&limit=3');
  assert.equal(mtbfEndpoint.statusCode, 200);
  assert.equal(mtbfEndpoint.body.total, 1);
  assert.equal(mtbfEndpoint.body.limit, 3);
  assert.equal(mtbfEndpoint.body.data[0].machine_no, 'MC-01');
  assert.deepEqual(calls.at(-1), ['listReliabilityMtbf', { section: 'MC1', limit: '3' }]);

  const mttrEndpoint = await invoke(router, '/api/maintenance/analytics/mttr?machine_type=GRINDER&limit=3');
  assert.equal(mttrEndpoint.statusCode, 200);
  assert.equal(mttrEndpoint.body.data[0].mttr_minutes, 44);
  assert.deepEqual(calls.at(-1), ['listReliabilityMttr', { machine_type: 'GRINDER', limit: '3' }]);

  const machineHealthEndpoint = await invoke(router, '/api/maintenance/analytics/machine-health?machine_no=MC-01&limit=3');
  assert.equal(machineHealthEndpoint.statusCode, 200);
  assert.equal(machineHealthEndpoint.body.data[0].health_band, 'healthy');
  assert.deepEqual(calls.at(-1), ['listMachineHealth', { machine_no: 'MC-01', limit: '3' }]);

  const sourceViewAlias = await invoke(router, '/api/maintenance/analytics/machine_health_score?limit=1');
  assert.equal(sourceViewAlias.statusCode, 200);
  assert.deepEqual(calls.at(-1), ['listMachineHealth', { limit: '1' }]);

  assert.deepEqual(matchRoute('/api/maintenance/analytics/failure-frequency'), { name: 'failureFrequency', params: {} });
  assert.deepEqual(matchRoute('/api/maintenance/analytics/failure-pareto'), { name: 'failurePareto', params: {} });
  assert.deepEqual(matchRoute('/api/maintenance/analytics/rca-evidence'), { name: 'rcaEvidence', params: {} });
  assert.deepEqual(matchRoute('/api/maintenance/analytics/maintenance-part-cost'), { name: 'maintenancePartCost', params: {} });
  assert.deepEqual(matchRoute('/api/maintenance/analytics/spare-part-risk'), { name: 'sparePartRisk', params: {} });

  const rcaMissing = await invoke(router, '/api/maintenance/analytics/rca-evidence');
  assert.equal(rcaMissing.statusCode, 400);
  assert.equal(rcaMissing.body.error.code, 'RCA_WORKORDER_REQUIRED');

  const rcaNotFound = await invoke(router, '/api/maintenance/analytics/rca-evidence?workorder_no=WO-404');
  assert.equal(rcaNotFound.statusCode, 404);
  assert.equal(rcaNotFound.body.error.code, 'WORKORDER_NOT_FOUND');

  const rcaEndpoint = await invoke(router, '/api/maintenance/analytics/rca-evidence?workorder_no=WO-1001&history_limit=999&include_related=false');
  assert.equal(rcaEndpoint.statusCode, 200);
  assert.equal(rcaEndpoint.body.data.workorder.workorder_no, 'WO-1001');
  assert.equal(rcaEndpoint.body.data.failure_signal.failure_category, 'mechanical');
  assert.equal(rcaEndpoint.body.data.failure_signal.taxonomy_version, 'r5b-phase3a-v1');
  assert.equal(rcaEndpoint.body.data.reliability_context.health_band, 'healthy');
  assert.equal(rcaEndpoint.body.data.evidence_sources[0].source, 'maintenance.work_order');
  assert.equal(rcaEndpoint.body.data.warnings, undefined);
  assert.match(rcaEndpoint.body.warnings.join(' '), /No task history/);
  assert.deepEqual(calls.at(-1), ['getRcaEvidence', { workorder_no: 'WO-1001', history_limit: '999', include_related: 'false' }]);

  const frequencyEndpoint = await invoke(router, '/api/maintenance/analytics/failure-frequency?site=HOYA-BKK&group_by=failure_signal&limit=10');
  assert.equal(frequencyEndpoint.statusCode, 200);
  assert.equal(frequencyEndpoint.body.data[0].failure_signal, 'Bearing noise');
  assert.equal(frequencyEndpoint.body.data[0].failure_count, 3);
  assert.equal(frequencyEndpoint.body.limit, 10);
  assert.deepEqual(calls.at(-1), ['listFailureFrequency', { site: 'HOYA-BKK', group_by: 'failure_signal', limit: '10' }]);

  const paretoEndpoint = await invoke(router, '/api/maintenance/analytics/failure-pareto?basis=downtime&top_n=5');
  assert.equal(paretoEndpoint.statusCode, 200);
  assert.equal(paretoEndpoint.body.data[0].rank, 1);
  assert.equal(paretoEndpoint.body.data[0].cumulative_percentage, 80);
  assert.deepEqual(calls.at(-1), ['listFailurePareto', { basis: 'downtime', top_n: '5' }]);

  const repeatEndpoint = await invoke(router, '/api/maintenance/analytics/repeat-failures?equipment_no=MC-01');
  assert.equal(repeatEndpoint.statusCode, 200);
  assert.equal(repeatEndpoint.body.data[0].equipment_no, 'MC-01');
  assert.equal(repeatEndpoint.body.data[0].failure_signal, 'Bearing noise');
  assert.equal(repeatEndpoint.body.data[0].workorder_count, 2);
  assert.equal(repeatEndpoint.body.data[0].total_downtime_hours, 4);
  assert.deepEqual(repeatEndpoint.body.data[0].workorders, ['WO-1001', 'WO-0999']);

  const maintenancePartCostEndpoint = await invoke(router, '/api/maintenance/analytics/maintenance-part-cost?workorder_no=WO-1001&machine_no=MC-01&period_month=2026-06-01&section=MC1&machine_type=GRINDER&limit=25&offset=0');
  assert.equal(maintenancePartCostEndpoint.statusCode, 200);
  assert.equal(maintenancePartCostEndpoint.body.status, 'success');
  assert.equal(maintenancePartCostEndpoint.body.count, 1);
  assert.equal(maintenancePartCostEndpoint.body.metadata.source_view, 'maintenance.v_spare_part_usage_by_workorder');
  assert.deepEqual(maintenancePartCostEndpoint.body.evidence_refs, []);
  assert.equal(maintenancePartCostEndpoint.body.data[0].workorder_no, 'WO-1001');
  assert.equal(maintenancePartCostEndpoint.body.data[0].machine_no, 'MC-01');
  assert.deepEqual(calls.at(-1), ['listMaintenancePartCost', {
    workorder_no: 'WO-1001',
    machine_no: 'MC-01',
    period_month: '2026-06-01',
    section: 'MC1',
    machine_type: 'GRINDER',
    limit: '25',
    offset: '0',
  }]);

  const sparePartRiskEndpoint = await invoke(router, '/api/maintenance/analytics/spare-part-risk?catalogue_no=BRG-01&query=BMM26&limit=25&offset=0');
  assert.equal(sparePartRiskEndpoint.statusCode, 200);
  assert.equal(sparePartRiskEndpoint.body.status, 'success');
  assert.equal(sparePartRiskEndpoint.body.count, 1);
  assert.equal(sparePartRiskEndpoint.body.metadata.source_view, 'maintenance.v_stock_risk_summary');
  assert.deepEqual(sparePartRiskEndpoint.body.evidence_refs, []);
  assert.equal(sparePartRiskEndpoint.body.data[0].catalogue_no, 'BRG-01');
  assert.deepEqual(calls.at(-1), ['listSparePartRisk', {
    catalogue_no: 'BRG-01',
    query: 'BMM26',
    limit: '25',
    offset: '0',
  }]);

  const failureRouter = createMaintenanceRouter({
    workorderService: {
      async listWorkorders() {
        throw Object.assign(new Error('relation missing'), { code: '42P01' });
      },
    },
    analyticsService: {},
  });
  const failure = await invoke(failureRouter, '/api/maintenance/workorders');
  assert.equal(failure.statusCode, 503);
  assert.equal(failure.body.error.code, 'DATABASE_SCHEMA_UNAVAILABLE');

  const timeoutRouter = createMaintenanceRouter({
    workorderService: {},
    analyticsService: {
      async listFailureFrequency() {
        throw Object.assign(new Error('statement timeout'), { code: '57014' });
      },
    },
  });
  const timeout = await invoke(timeoutRouter, '/api/maintenance/analytics/failure-frequency');
  assert.equal(timeout.statusCode, 504);
  assert.equal(timeout.body.error.code, 'DATABASE_TIMEOUT');
}

async function testCors() {
  assert.deepEqual(getAllowedCorsOrigins({}), [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]);
  assert.deepEqual(getAllowedCorsOrigins({
    MAINTENANCE_API_ALLOWED_ORIGINS: 'http://localhost:5179, http://127.0.0.1:5179',
  }), ['http://localhost:5179', 'http://127.0.0.1:5179']);

  let hitCount = 0;
  const router = createCorsHandler(async (_request, response) => {
    hitCount += 1;
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: true }));
  });

  const preflight = await invoke(router, '/api/maintenance/workorders', 'OPTIONS', {
    origin: 'http://localhost:5174',
    'access-control-request-headers': 'content-type',
  });
  assert.equal(preflight.statusCode, 204);
  assert.equal(hitCount, 0);
  assert.equal(preflight.headers['Access-Control-Allow-Origin'], 'http://localhost:5174');
  assert.equal(preflight.headers['Access-Control-Allow-Methods'], 'GET, OPTIONS');
  assert.equal(preflight.headers['Access-Control-Allow-Headers'], 'content-type');
  assert.equal(preflight.headers['Access-Control-Max-Age'], '86400');

  const allowed = await invoke(router, '/api/health', 'GET', { origin: 'http://localhost:5174' });
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.headers['Access-Control-Allow-Origin'], 'http://localhost:5174');
  assert.equal(allowed.headers['Access-Control-Allow-Methods'], 'GET, OPTIONS');
  assert.deepEqual(allowed.body, { ok: true });

  const disallowed = await invoke(router, '/api/health', 'GET', { origin: 'http://evil.test' });
  assert.equal(disallowed.statusCode, 200);
  assert.notEqual(disallowed.headers['Access-Control-Allow-Origin'], '*');
  assert.equal(disallowed.headers['Access-Control-Allow-Origin'], undefined);

  const wildcardRouter = createCorsHandler(async (_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: true }));
  }, { allowedOrigins: ['*'] });
  const wildcard = await invoke(wildcardRouter, '/api/health', 'GET', { origin: 'http://dev-only.test' });
  assert.equal(wildcard.headers['Access-Control-Allow-Origin'], undefined);
}

function testMissingDatabaseUrl() {
  assert.throws(() => assertDatabaseUrl({ DATABASE_URL: '' }), MissingDatabaseUrlError);
}

async function testSmokeScriptHelpAndFailureModes() {
  assert.match(dataSmokeUsageText(), /Usage:/);
  assert.match(apiSmokeUsageText(), /Usage:/);
  assert.throws(() => requireSmokeDatabaseUrl({ DATABASE_URL: '' }), /DATABASE_URL is required/);
  await assert.rejects(() => getJson('http://127.0.0.1:1', '/api/health'), /Request failed/);
}

function testNoCommittedUploads() {
  const result = spawnSync('git', ['ls-files', 'uploads'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '', 'Raw uploads must not be tracked by git.');
}

async function testNoStagingRuntimeReferences() {
  const serverDir = path.join(rootDir, 'src/server');
  const files = await listFiles(serverDir);
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /maintenance\.stg_|stg_/i, `Runtime API must not reference staging tables: ${file}`);
  }
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.mjs')) {
      files.push(fullPath);
    }
  }
  return files;
}

function invoke(router, url, method = 'GET', headers = {}) {
  return new Promise((resolve) => {
    const chunks = [];
    const response = {
      statusCode: 0,
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      writeHead(statusCode, headers) {
        this.statusCode = statusCode;
        this.headers = { ...this.headers, ...headers };
      },
      end(chunk) {
        if (chunk) {
          chunks.push(Buffer.from(chunk));
        }
        const rawBody = Buffer.concat(chunks).toString('utf8');
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: rawBody ? JSON.parse(rawBody) : null,
        });
      },
    };
    router({ method, url, headers }, response);
  });
}
