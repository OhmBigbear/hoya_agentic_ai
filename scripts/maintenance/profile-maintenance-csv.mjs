import fs from 'node:fs';
import path from 'node:path';
import {
  DATASETS,
  loadDatasetRows,
  normalizeCell,
  parseArgs,
  rowToObject,
} from './maintenance-csv-lib.mjs';

const DATE_PATTERNS = [
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(:\d{2})?$/,
];

function isNumeric(value) {
  return /^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$/.test(value);
}

function isDateLike(value) {
  return DATE_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

function profileColumn(headers, rows, columnIndex) {
  const values = rows.map((row) => normalizeCell(row[columnIndex]));
  const nonNull = values.filter((value) => value !== null);
  const distinct = new Set(nonNull).size;
  const numericCount = nonNull.filter(isNumeric).length;
  const dateCount = nonNull.filter(isDateLike).length;
  const examples = [...new Set(nonNull.slice(0, 200))].slice(0, 5);

  return {
    column: headers[columnIndex],
    nonNull: nonNull.length,
    nulls: rows.length - nonNull.length,
    distinct,
    nullable: nonNull.length < rows.length,
    numericRatio: nonNull.length ? numericCount / nonNull.length : 0,
    dateRatio: nonNull.length ? dateCount / nonNull.length : 0,
    examples,
  };
}

function candidateKeys(headers, rows) {
  const candidates = [];
  headers.forEach((header, index) => {
    const values = rows.map((row) => normalizeCell(row[index]));
    const nonNull = values.filter((value) => value !== null);
    if (nonNull.length === rows.length && new Set(nonNull).size === rows.length) {
      candidates.push(header);
    }
  });

  const commonCompositeKeys = [
    ['Workorder', 'TaskNo'],
    ['WorkOrder', 'CatalogueNo', 'TransactionDate'],
    ['WorkOrder', 'CatalogueNO', 'TransactionDate'],
    ['CatalogueNo', 'Warehouse', 'BinLocation'],
    ['CatalogueNo', 'BatchNo', 'SerialNo'],
  ];

  for (const keyParts of commonCompositeKeys) {
    const indexes = keyParts.map((key) => headers.findIndex((header) => header.toLowerCase() === key.toLowerCase()));
    if (indexes.every((index) => index >= 0)) {
      const values = rows.map((row) => indexes.map((index) => normalizeCell(row[index]) ?? '').join('|'));
      if (new Set(values).size === rows.length) candidates.push(keyParts.join(' + '));
    }
  }

  return candidates;
}

function foreignKeyHints(headers) {
  const hints = [];
  for (const header of headers) {
    const lower = header.toLowerCase();
    if (lower.includes('workorder')) hints.push(`${header} -> maintenance.work_order.workorder_no`);
    if (lower.includes('equipmentno')) hints.push(`${header} -> maintenance.equipment.equipment_no`);
    if (lower.includes('catalogueno') || lower.includes('catalogueno')) {
      hints.push(`${header} -> maintenance.part_catalog.catalogue_no`);
    }
    if (lower.includes('warehouse')) hints.push(`${header} -> maintenance.warehouse.warehouse_code/location`);
  }
  return [...new Set(hints)];
}

function renderDataset(dataset, loaded) {
  const columnProfiles = loaded.headers.map((_, index) => profileColumn(loaded.headers, loaded.rows, index));
  const dateColumns = columnProfiles.filter((profile) => profile.dateRatio >= 0.8).map((profile) => profile.column);
  const numericColumns = columnProfiles.filter((profile) => profile.numericRatio >= 0.8).map((profile) => profile.column);
  const nullableColumns = columnProfiles.filter((profile) => profile.nullable).map((profile) => profile.column);
  const keyCandidates = candidateKeys(loaded.headers, loaded.rows);
  const fkHints = foreignKeyHints(loaded.headers);

  const lines = [
    `### ${dataset.file}`,
    '',
    `- Dataset key: \`${dataset.key}\``,
    `- Encoding: ${loaded.encoding}`,
    `- Delimiter: ${loaded.delimiter === '\t' ? 'tab' : `\`${loaded.delimiter}\``}`,
    `- Header row: ${loaded.headerRowIndex + 1}`,
    `- Columns: ${loaded.headers.length}`,
    `- Data rows: ${loaded.rows.length}`,
    `- Candidate primary keys: ${keyCandidates.length ? keyCandidates.map((key) => `\`${key}\``).join(', ') : 'none detected; use surrogate key'}`,
    `- Candidate foreign keys: ${fkHints.length ? fkHints.map((key) => `\`${key}\``).join(', ') : 'none detected'}`,
    `- Date-like columns: ${dateColumns.length ? dateColumns.map((column) => `\`${column}\``).join(', ') : 'none detected'}`,
    `- Numeric-like columns: ${numericColumns.length ? numericColumns.map((column) => `\`${column}\``).join(', ') : 'none detected'}`,
    `- Nullable columns: ${nullableColumns.length ? nullableColumns.map((column) => `\`${column}\``).join(', ') : 'none detected'}`,
    '',
    '| Column | Non-null | Nulls | Distinct | Type hint | Examples |',
    '| --- | ---: | ---: | ---: | --- | --- |',
  ];

  for (const profile of columnProfiles) {
    const typeHint = profile.dateRatio >= 0.8 ? 'date/timestamp' : profile.numericRatio >= 0.8 ? 'numeric' : 'text';
    lines.push(
      `| ${profile.column} | ${profile.nonNull} | ${profile.nulls} | ${profile.distinct} | ${typeHint} | ${profile.examples.map((example) => `\`${String(example).replaceAll('|', '\\|')}\``).join('<br>')} |`,
    );
  }

  return lines.join('\n');
}

async function main() {
  const args = parseArgs();
  const sections = [
    '# Maintenance CSV Data Profile',
    '',
    `Generated from \`${args.uploadsDir}\`.`,
    '',
    'All files are UTF-8 exports with comma-delimited CSV structure. The equipment export includes a report preamble; import code locates the expected equipment header before reading data rows.',
    '',
  ];

  for (const dataset of DATASETS) {
    const loaded = loadDatasetRows(dataset, args.uploadsDir);
    sections.push(renderDataset(dataset, loaded), '');
  }

  const outputPath = path.resolve(process.cwd(), 'docs/maintenance-data-profile.md');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${sections.join('\n')}\n`);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
