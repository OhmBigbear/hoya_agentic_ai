import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs, runPsqlSql } from './maintenance-csv-lib.mjs';

function runNodeScript(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

function usage() {
  console.log('Usage: node scripts/maintenance/rebuild-maintenance-db.mjs [--dry-run] [--uploads-dir uploads]');
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    usage();
    return;
  }

  const migrationDir = path.resolve(process.cwd(), 'database/maintenance');
  const migrationFiles = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => path.join(migrationDir, file));

  if (args.dryRun) {
    console.log('[dry-run] would execute migrations:');
    for (const file of migrationFiles) console.log(`- ${file}`);
    await runNodeScript('scripts/maintenance/import-maintenance-staging.mjs', ['--dry-run', '--uploads-dir', args.uploadsDir]);
    await runNodeScript('scripts/maintenance/normalize-maintenance-data.mjs', ['--dry-run']);
    return;
  }

  for (const file of migrationFiles) {
    console.log(`Applying ${file}`);
    await runPsqlSql(fs.readFileSync(file, 'utf8'));
  }

  await runNodeScript('scripts/maintenance/import-maintenance-staging.mjs', ['--uploads-dir', args.uploadsDir]);
  await runNodeScript('scripts/maintenance/normalize-maintenance-data.mjs', []);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
