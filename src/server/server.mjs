#!/usr/bin/env node
import http from 'node:http';
import { createDb, createPostgresPoolFromEnv, mapDbError } from './db/postgres.mjs';
import { createMaintenanceAnalyticsRepository } from './maintenance/repositories/maintenanceAnalyticsRepository.mjs';
import { createMaintenanceInventoryRepository } from './maintenance/repositories/maintenanceInventoryRepository.mjs';
import { createMaintenanceWorkorderRepository } from './maintenance/repositories/maintenanceWorkorderRepository.mjs';
import { createMaintenanceRouter } from './maintenance/routes/maintenanceRoutes.mjs';
import { createMaintenanceAnalyticsService } from './maintenance/services/maintenanceAnalyticsService.mjs';
import { createMaintenanceWorkorderService } from './maintenance/services/maintenanceWorkorderService.mjs';

const HOST = process.env.MAINTENANCE_API_HOST || '127.0.0.1';
const PORT = Number(process.env.MAINTENANCE_API_PORT || 3101);

async function main() {
  const pool = await createPostgresPoolFromEnv(process.env);
  const db = createDb(pool);
  const workorderRepository = createMaintenanceWorkorderRepository(db);
  const analyticsRepository = createMaintenanceAnalyticsRepository(db);
  const inventoryRepository = createMaintenanceInventoryRepository(db);

  const router = createMaintenanceRouter({
    workorderService: createMaintenanceWorkorderService(workorderRepository),
    analyticsService: createMaintenanceAnalyticsService(analyticsRepository, inventoryRepository),
  });

  const server = http.createServer(router);
  server.listen(PORT, HOST, () => {
    console.log(`Maintenance API listening on http://${HOST}:${PORT}`);
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
