#!/usr/bin/env node
import http from 'node:http';
import { createCorsHandler } from './cors.mjs';
import { createDb, createPostgresPoolFromEnv, mapDbError } from './db/postgres.mjs';
import { createMaintenanceAnalyticsRepository } from './maintenance/repositories/maintenanceAnalyticsRepository.mjs';
import { createMaintenanceInventoryRepository } from './maintenance/repositories/maintenanceInventoryRepository.mjs';
import { createMaintenanceWorkorderRepository } from './maintenance/repositories/maintenanceWorkorderRepository.mjs';
import { createMaintenanceRouter } from './maintenance/routes/maintenanceRoutes.mjs';
import { createMaintenanceAnalyticsService } from './maintenance/services/maintenanceAnalyticsService.mjs';
import { createMaintenanceWorkorderService } from './maintenance/services/maintenanceWorkorderService.mjs';

const HOST = process.env.MAINTENANCE_API_HOST || '0.0.0.0';
const PORT = Number(process.env.MAINTENANCE_API_PORT || 3101);

function getStartupUrls(host, port) {
  const urls = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);

  if (host !== '0.0.0.0' && host !== '::') {
    urls.add(`http://${host}:${port}`);
  }

  return [...urls];
}

async function main() {
  const pool = await createPostgresPoolFromEnv(process.env);
  const db = createDb(pool);
  const workorderRepository = createMaintenanceWorkorderRepository(db);
  const analyticsRepository = createMaintenanceAnalyticsRepository(db);
  const inventoryRepository = createMaintenanceInventoryRepository(db);

  const router = createMaintenanceRouter({
    workorderService: createMaintenanceWorkorderService(workorderRepository),
    analyticsService: createMaintenanceAnalyticsService(analyticsRepository, inventoryRepository, workorderRepository),
  });

  const server = http.createServer(createCorsHandler(router));
  server.listen(PORT, HOST, () => {
    console.log('Maintenance API listening on:');
    for (const url of getStartupUrls(HOST, PORT)) {
      console.log(`- ${url}`);
    }
  });

  const shutdown = async () => {
    server.close();
    await pool.end();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((error) => {
  const mapped = mapDbError(error);
  console.error(`${mapped.code}: ${mapped.message}`);
  process.exit(1);
});
