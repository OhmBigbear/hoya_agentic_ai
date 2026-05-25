import assert from 'node:assert/strict';
import { NORMALIZE_STEPS } from './maintenance/normalize-maintenance-data.mjs';

const stepsByLabel = new Map(NORMALIZE_STEPS.map((step) => [step.label, step]));

function step(label) {
  const value = stepsByLabel.get(label);
  assert.ok(value, `Expected normalize step ${label}`);
  return value;
}

function assertHasDiagnostic(label, pattern) {
  const diagnostics = step(label).diagnostics ?? [];
  assert.ok(
    diagnostics.some((diagnostic) => pattern.test(`${diagnostic.label}\n${diagnostic.sql}`)),
    `Expected ${label} duplicate diagnostic matching ${pattern}`,
  );
}

function assertUsesDeterministicSource(label, pattern) {
  assert.match(step(label).sql, pattern, `Expected ${label} to use deterministic source selection`);
}

assertHasDiagnostic('equipment', /equipment_no/i);
assertHasDiagnostic('part_catalog', /catalogue_no/i);
assertHasDiagnostic('warehouse', /warehouse_code[\s\S]*warehouse_location_code/i);
assertHasDiagnostic('work_order', /workorder_no/i);
assertHasDiagnostic('work_order_task', /workorder_no[\s\S]*task_no/i);
assertHasDiagnostic('work_order_hold_history', /source_file[\s\S]*source_row_number/i);
assertHasDiagnostic('work_order_part_transaction', /source_file[\s\S]*source_row_number/i);
assertHasDiagnostic('inventory_transaction_history', /source_file[\s\S]*source_row_number/i);
assertHasDiagnostic('stock_balance', /stock identity|catalogue_no[\s\S]*warehouse_code[\s\S]*bin_location[\s\S]*batch_no[\s\S]*serial_no/i);

assertUsesDeterministicSource('warehouse', /SELECT DISTINCT ON \(warehouse_code, warehouse_location_code\)/i);
assertUsesDeterministicSource('equipment', /ROW_NUMBER\(\) OVER \([\s\S]*PARTITION BY NULLIF\(TRIM\(equipment_no\), ''\)/i);
assertUsesDeterministicSource('part_catalog', /ROW_NUMBER\(\) OVER \([\s\S]*PARTITION BY NULLIF\(TRIM\(catalogue_no\), ''\)/i);
assertUsesDeterministicSource('work_order', /ROW_NUMBER\(\) OVER \([\s\S]*PARTITION BY NULLIF\(TRIM\(wo\.workorder_no\), ''\)/i);
assertUsesDeterministicSource('work_order_task', /ROW_NUMBER\(\) OVER \([\s\S]*PARTITION BY NULLIF\(TRIM\(task\.workorder_no\), ''\), coalesce\(NULLIF\(TRIM\(task\.task_no\), ''\), ''\)/i);
assertUsesDeterministicSource('stock_balance', /GROUP BY[\s\S]*NULLIF\(TRIM\(stock\.catalogue_no\), ''\)[\s\S]*NULLIF\(TRIM\(stock\.serial_no\), ''\)/i);
assertUsesDeterministicSource('stock_balance', /jsonb_build_object\([\s\S]*'source_rows'[\s\S]*jsonb_agg/i);

for (const label of ['equipment', 'part_catalog', 'work_order']) {
  const sql = step(label).sql;
  assert.doesNotMatch(sql, /SELECT DISTINCT ON/i, `${label} should not rely on source-order DISTINCT ON`);
  assert.match(sql, /WHERE (?:\w+\.)?row_rank = 1/i, `${label} should filter to one source row per conflict key`);
}

for (const normalizeStep of NORMALIZE_STEPS) {
  assert.ok(normalizeStep.label, 'Normalize step must have a label');
  assert.ok(normalizeStep.target, `${normalizeStep.label} must have a target table`);
  assert.ok(normalizeStep.stage, `${normalizeStep.label} must have a stage name`);
  assert.ok((normalizeStep.diagnostics ?? []).length > 0, `${normalizeStep.label} must define duplicate diagnostics`);
}

console.log('Maintenance normalize SQL static checks passed.');
