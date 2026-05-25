import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const DATASETS = [
  {
    key: 'equipment',
    file: "EquipmentListReport on 26 Feb'2026.csv",
    table: 'maintenance.stg_equipment',
    expectedHeaders: [
      'EquipmentNo',
      'EquipmentDesc',
      'EquipmentType',
      'ModelNo',
      'SerialNo',
      'RegisterNo',
      'RegisterDueDate',
      'Manufacturer',
      'Department',
      'Site',
      'Location',
      'Active',
      'DisposalDate',
    ],
  },
  {
    key: 'workorder',
    file: "Workorder Oct'2025-Jan'2026.csv",
    table: 'maintenance.stg_workorder',
  },
  {
    key: 'task',
    file: "Task Oct'2025-Jan'2026.csv",
    table: 'maintenance.stg_task',
  },
  {
    key: 'transaction',
    file: "Transaction Oct'2025-Jan'2026.csv",
    table: 'maintenance.stg_transaction',
  },
  {
    key: 'hold_workorder_history',
    file: 'HoldWorkorderHistory.csv',
    table: 'maintenance.stg_hold_workorder_history',
  },
  {
    key: 'catalogue_items',
    file: 'CatalogueItemsReport.csv',
    table: 'maintenance.stg_catalogue_items',
  },
  {
    key: 'stock_valuation',
    file: 'StockValuationReport.csv',
    table: 'maintenance.stg_stock_valuation',
  },
  {
    key: 'transaction_history',
    file: 'ReportTransactionHistory.csv',
    table: 'maintenance.stg_transaction_history',
  },
];

export const TABLE_COLUMNS = {
  'maintenance.stg_equipment': [
    'equipment_no',
    'equipment_desc',
    'equipment_type',
    'model_no',
    'serial_no',
    'register_no',
    'register_due_date_text',
    'manufacturer',
    'department',
    'site',
    'location',
    'active_text',
    'disposal_date_text',
  ],
  'maintenance.stg_workorder': [
    'site',
    'site_desc',
    'location',
    'location_desc',
    'department',
    'department_desc',
    'equipment_type',
    'equipment_type_desc',
    'equipment_no',
    'equipment_desc',
    'workorder_no',
    'status',
    'priority',
    'policy_no',
    'policy_description',
    'doc_id',
    'plan_start_text',
    'plan_finish_text',
    'act_work_start_text',
    'act_work_end_text',
    'est_duration_text',
    'total_repair_time_text',
    'normal_hour_used_text',
    'down_time_text',
    'cause_id',
    'plan_mat_cost_text',
    'plan_labor_cost_text',
    'plan_other_cost_text',
    'act_mat_cost_text',
    'act_labour_cost_text',
    'act_other_cost_text',
    'note',
    'reason',
    'solution',
    'description',
    'reference',
    'account_code',
    'customer_code',
    'job_type',
    'serial_no',
    'hold_reason_code',
    'warranty_no',
    'satisfaction',
    'satisfaction_note',
    'request_no',
    'request_by',
    'request_date_text',
    'udfrq1',
    'udfrq2',
    'udfrq3',
    'udfrq4',
    'udfrq6',
    'assign_employee',
    'actual_employee',
    'update_by',
    'update_date_text',
    'cause_path',
    'cause_description',
    'failure_path',
    'failure_description',
    'action_path',
    'action_description',
    'func_location',
    'equdf4',
    'accepted_by',
  ],
  'maintenance.stg_task': [
    'workorder_no',
    'task_no',
    'description_1',
    'description_2',
    'value_text',
    'reference',
    'authorizer',
    'request_no',
  ],
  'maintenance.stg_transaction': [
    'transaction_date_text',
    'workorder_no',
    'equipment_no',
    'equipment_desc',
    'catalogue_no',
    'part_name',
    'transaction_type',
    'tran_qty_text',
    'uom',
    'serial_no',
    'warehouse_id',
    'warehouse_location_id',
    'comment1',
    'comment2',
    'comment3',
    'user_id',
    'first_name',
    'last_name',
  ],
  'maintenance.stg_hold_workorder_history': [
    'hold_date_text',
    'workorder_no',
    'func_location',
    'equipment_no',
    'equipment_desc',
    'hold_reason_description',
    'plan_start_text',
    'plan_finish_text',
    'hold_by',
    'site',
    'location',
    'department',
    'equipment_type',
    'operator_id',
  ],
  'maintenance.stg_catalogue_items': [
    'textbox34',
    'textbox32',
    'catalogue_no',
    'part_name',
    'catalogue_group',
    'warehouse',
    'bin_location',
    'item_type',
    'account_no',
    'class_code',
    'cost_text',
    'uom',
    'on_hand_text',
    'on_order_text',
    'max_text',
    'rop_text',
    'min_text',
    'roq_text',
  ],
  'maintenance.stg_stock_valuation': [
    'textbox34',
    'catalogue_no',
    'part_name',
    'uom',
    'bin_location',
    'min_text',
    'max_text',
    'rop_text',
    'on_hand_text',
    'value_text',
    'batch_no',
    'serial_no',
    'qty_text',
    'unit_price_text',
    'textbox13',
    'textbox2',
    'textbox17',
    'textbox54',
    'textbox51',
  ],
  'maintenance.stg_transaction_history': [
    'transaction_date_text',
    'catalogue_no',
    'part_name',
    'transaction_type',
    'batch_no',
    'tran_qty_text',
    'tran_value_text',
    'run_total_text',
    'uom',
    'serial_no',
    'warehouse_id',
    'warehouse_location_id',
    'workorder_no',
    'comment1',
    'user_id',
    'textbox38',
    'textbox47',
    'textbox61',
  ],
};

export function repoRoot() {
  return process.cwd();
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { dryRun: false, uploadsDir: 'uploads' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--uploads-dir') args.uploadsDir = argv[++index];
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

export function readCsvFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const hasBom = buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const text = buffer.toString('utf8');
  return {
    text: hasBom ? text.slice(1) : text,
    encoding: hasBom ? 'UTF-8 with BOM' : 'UTF-8',
    bytes: buffer.length,
    lineTerminators: {
      crlf: (text.match(/\r\n/g) || []).length,
      lf: (text.match(/(?<!\r)\n/g) || []).length,
    },
  };
}

export function parseCsv(text, delimiter = ',') {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

export function detectDelimiter(sample) {
  const candidates = [',', ';', '\t', '|'];
  const scores = candidates.map((delimiter) => {
    const rows = parseCsv(sample.slice(0, 64_000), delimiter).slice(0, 20);
    const widths = rows.map((row) => row.length);
    const maxWidth = Math.max(...widths);
    const stableRows = widths.filter((width) => width === maxWidth).length;
    return { delimiter, maxWidth, stableRows };
  });
  scores.sort((left, right) => right.maxWidth - left.maxWidth || right.stableRows - left.stableRows);
  return scores[0].delimiter;
}

export function findHeaderRow(rows, dataset) {
  if (dataset.expectedHeaders) {
    const expected = dataset.expectedHeaders.map((header) => header.toLowerCase());
    const matchIndex = rows.findIndex((row) => {
      const normalized = row.map((header) => header.trim().toLowerCase());
      return expected.every((header, index) => normalized[index] === header);
    });
    if (matchIndex >= 0) return matchIndex;
  }

  let bestIndex = 0;
  for (let index = 0; index < Math.min(rows.length, 50); index += 1) {
    if (rows[index].length > rows[bestIndex].length) bestIndex = index;
  }
  return bestIndex;
}

export function loadDatasetRows(dataset, uploadsDir = 'uploads') {
  const filePath = path.resolve(repoRoot(), uploadsDir, dataset.file);
  const source = readCsvFile(filePath);
  const delimiter = detectDelimiter(source.text);
  const rows = parseCsv(source.text, delimiter);
  const headerRowIndex = findHeaderRow(rows, dataset);
  const headers = rows[headerRowIndex].map((header) => header.trim());
  const dataRows = rows
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((field) => field.trim() !== ''));

  return {
    ...source,
    filePath,
    delimiter,
    headerRowIndex,
    headers,
    rows: dataRows,
  };
}

export function normalizeCell(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

export function rowToObject(headers, row) {
  const object = {};
  headers.forEach((header, index) => {
    object[header] = normalizeCell(row[index]);
  });
  return object;
}

export function toCopyTextValue(value) {
  if (value === null || value === undefined || value === '') return '\\N';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

export async function runPsqlSql(sql) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for database operations.');
  }

  return new Promise((resolve, reject) => {
    const child = spawn('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-q'], {
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    child.stdin.end(sql);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`psql exited with code ${code}`));
    });
  });
}

export async function copyRowsToTable({ table, columns, rows }) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for database operations.');
  }

  const copySql = `COPY ${table} (${columns.join(', ')}) FROM STDIN WITH (FORMAT text, DELIMITER E'\\t', NULL '\\\\N')`;

  return new Promise((resolve, reject) => {
    const child = spawn('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-q', '-c', copySql], {
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`psql COPY exited with code ${code}`));
    });

    for (const row of rows) {
      child.stdin.write(`${row.map(toCopyTextValue).join('\t')}\n`);
    }
    child.stdin.end();
  });
}

export function sqlQuote(value) {
  return String(value).replace(/'/g, "''");
}
