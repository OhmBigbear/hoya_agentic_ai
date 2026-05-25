import {
  DATASETS,
  TABLE_COLUMNS,
  copyRowsToTable,
  loadDatasetRows,
  parseArgs,
  rowToObject,
  runPsqlSql,
  sqlQuote,
} from './maintenance-csv-lib.mjs';

function usage() {
  console.log('Usage: node scripts/maintenance/import-maintenance-staging.mjs [--dry-run] [--uploads-dir uploads]');
}

function buildCopyRows(dataset, loaded) {
  const tableColumns = TABLE_COLUMNS[dataset.table];
  if (!tableColumns) throw new Error(`No staging column map for ${dataset.table}`);
  if (loaded.headers.length !== tableColumns.length) {
    throw new Error(`${dataset.file} has ${loaded.headers.length} headers, expected ${tableColumns.length}`);
  }

  return loaded.rows.map((row, rowIndex) => {
    const values = tableColumns.map((_, columnIndex) => row[columnIndex] ?? null);
    const rawObject = rowToObject(loaded.headers, row);
    return [
      dataset.file,
      loaded.headerRowIndex + 2 + rowIndex,
      JSON.stringify(rawObject),
      ...values,
    ];
  });
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    usage();
    return;
  }

  for (const dataset of DATASETS) {
    const loaded = loadDatasetRows(dataset, args.uploadsDir);
    const tableColumns = ['source_file', 'source_row_number', 'raw_row', ...TABLE_COLUMNS[dataset.table]];
    const copyRows = buildCopyRows(dataset, loaded);

    if (args.dryRun) {
      console.log(`[dry-run] ${dataset.table}: ${copyRows.length} rows from ${dataset.file}`);
      continue;
    }

    await runPsqlSql(`DELETE FROM ${dataset.table} WHERE source_file = '${sqlQuote(dataset.file)}';`);
    await copyRowsToTable({ table: dataset.table, columns: tableColumns, rows: copyRows });
    console.log(`${dataset.table}: imported ${copyRows.length} rows from ${dataset.file}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
