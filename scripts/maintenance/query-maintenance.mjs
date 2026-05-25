#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const VIEW_BY_COMMAND = {
  workorders: 'maintenance.v_workorder_tracking',
  'workorder-detail': 'maintenance.v_workorder_tracking',
  'machine-history': 'maintenance.v_machine_maintenance_history',
  'mtbf-mttr': 'maintenance.v_mtbf_mttr_base',
  'hold-reasons': 'maintenance.v_hold_reason_summary',
  'repeat-failures': 'maintenance.v_repeat_failure_candidates',
  'stock-risk': 'maintenance.v_stock_risk_summary',
};

const ALLOWED_FILTERS = new Set([
  'workorder_no',
  'equipment_no',
  'site',
  'location',
  'department',
  'equipment_type',
  'status',
  'job_type',
  'priority',
  'catalogue_no',
  'stock_risk',
]);

export function getHelpText() {
  return `Usage:
  node scripts/maintenance/query-maintenance.mjs <command> [options]

Commands:
  workorders
  workorder-detail --workorder-no <value>
  machine-history --equipment-no <value>
  mtbf-mttr
  hold-reasons
  repeat-failures
  stock-risk

Options:
  --limit <number>          Limit JSON rows, default 50, max 500
  --from <timestamp>        Filter plan/start dates at or after value
  --to <timestamp>          Filter plan/start dates before value
  --workorder-no <value>
  --equipment-no <value>
  --site <value>
  --location <value>
  --department <value>
  --equipment-type <value>
  --status <value>
  --job-type <value>
  --priority <value>
  --catalogue-no <value>
  --stock-risk <value>
  --dry-run                 Print generated SQL without connecting
  --help                    Show this help

Requires DATABASE_URL unless --help or --dry-run is used. Queries only maintenance agent-ready views.`;
}

function printHelp() {
  console.log(getHelpText());
}

export function parseArgs(argv) {
  const options = { filters: {}, limit: 50, dryRun: false, help: false };
  const command = argv.find((arg) => !arg.startsWith('--'));

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    if (arg === '--help') {
      options.help = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    const key = arg.slice(2).replaceAll('-', '_');
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`${arg} requires a value.`);
    }
    index += 1;

    if (key === 'limit') {
      options.limit = clampLimit(value);
    } else if (key === 'from' || key === 'to') {
      options[key] = value;
    } else if (ALLOWED_FILTERS.has(key)) {
      options.filters[key] = value;
    } else {
      throw new Error(`Unsupported option: ${arg}`);
    }
  }

  return { command, options };
}

function clampLimit(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('--limit must be a positive integer.');
  }
  return Math.min(parsed, 500);
}

function quoteLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function quoteIdentifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return value;
}

function buildWhere(command, options) {
  const predicates = Object.entries(options.filters).map(([key, value]) => `${quoteIdentifier(key)} = ${quoteLiteral(value)}`);

  if (command === 'workorder-detail' && !options.filters.workorder_no) {
    throw new Error('workorder-detail requires --workorder-no.');
  }

  if (command === 'machine-history' && !options.filters.equipment_no) {
    throw new Error('machine-history requires --equipment-no.');
  }

  const dateColumn = command === 'machine-history' || command === 'mtbf-mttr' || command === 'repeat-failures'
    ? 'act_work_start'
    : 'plan_start';

  if (options.from && command !== 'hold-reasons' && command !== 'stock-risk') {
    const column = command === 'mtbf-mttr' ? 'failure_start' : dateColumn;
    predicates.push(`${column} >= ${quoteLiteral(options.from)}::timestamp`);
  }

  if (options.to && command !== 'hold-reasons' && command !== 'stock-risk') {
    const column = command === 'mtbf-mttr' ? 'failure_start' : dateColumn;
    predicates.push(`${column} < ${quoteLiteral(options.to)}::timestamp`);
  }

  return predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
}

export function buildSql(command, options) {
  const view = VIEW_BY_COMMAND[command];
  if (!view) {
    throw new Error(`Unknown command: ${command ?? '(missing)'}`);
  }

  const where = buildWhere(command, options);
  const limit = command === 'workorder-detail' ? 1 : options.limit;
  return `SELECT coalesce(jsonb_agg(row_to_json(q)), '[]'::jsonb) AS data
FROM (
  SELECT *
  FROM ${view}
  ${where}
  LIMIT ${limit}
) q;`;
}

export function runCommand(argv, env = process.env) {
  const { command, options } = parseArgs(argv);
  if (options.help || !command) {
    return {
      status: command || options.help ? 0 : 1,
      stdout: getHelpText(),
      stderr: '',
    };
  }

  const sql = buildSql(command, options);
  if (options.dryRun) {
    return { status: 0, stdout: sql, stderr: '' };
  }

  if (!env.DATABASE_URL) {
    return {
      status: 1,
      stdout: '',
      stderr: 'DATABASE_URL is required. Use --dry-run to inspect SQL without a live database.',
    };
  }

  const result = spawnSync('psql', [env.DATABASE_URL, '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    encoding: 'utf8',
  });

  if (result.error) {
    return { status: 1, stdout: '', stderr: result.error.message };
  }

  if (result.status !== 0) {
    return { status: result.status ?? 1, stdout: '', stderr: result.stderr.trim() || 'psql query failed.' };
  }

  return { status: 0, stdout: result.stdout.trim() || '[]', stderr: '' };
}

function runCli() {
  try {
    const result = runCommand(process.argv.slice(2));
    if (result.stdout) {
      console.log(result.stdout);
    }
    if (result.stderr) {
      console.error(result.stderr);
    }
    process.exit(result.status);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
