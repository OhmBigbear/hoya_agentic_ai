import { mapDbError } from '../../db/postgres.mjs';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

export function createMaintenanceRouter({ workorderService, analyticsService }) {
  return async function route(request, response) {
    const url = new URL(request.url, 'http://localhost');
    const query = Object.fromEntries(url.searchParams.entries());

    try {
      if (request.method !== 'GET') {
        return sendError(response, 405, 'METHOD_NOT_ALLOWED', 'Only GET is supported.');
      }

      if (url.pathname === '/api/health') {
        return sendJson(response, 200, { status: 'ok', service: 'hoya-ui-maintenance-api' });
      }

      const match = matchRoute(url.pathname);
      if (!match) {
        return sendError(response, 404, 'NOT_FOUND', 'Maintenance API route not found.');
      }

      if (match.name === 'workorders') {
        const result = await workorderService.listWorkorders(query);
        return sendEnvelope(response, result.data, result);
      }

      if (match.name === 'workorderDetail') {
        const detail = await workorderService.getWorkorderDetail(match.params.workorderNo);
        if (!detail) {
          return sendError(response, 404, 'WORKORDER_NOT_FOUND', 'Maintenance workorder was not found.');
        }
        return sendEnvelope(response, detail);
      }

      if (match.name === 'equipmentHistory') {
        const result = await workorderService.listEquipmentHistory(match.params.equipmentNo, query);
        return sendEnvelope(response, result.data, result);
      }

      if (match.name === 'workorderParts') {
        const result = await workorderService.listPartsByWorkorder(match.params.workorderNo);
        return sendEnvelope(response, result.data, result);
      }

      if (match.name === 'mtbfMttr') {
        const result = await analyticsService.listMtbfMttr(query);
        return sendEnvelope(response, result.data, result);
      }

      if (match.name === 'holdReasons') {
        const result = await analyticsService.listHoldReasons(query);
        return sendEnvelope(response, result.data, result);
      }

      if (match.name === 'repeatFailures') {
        const result = await analyticsService.listRepeatFailures(query);
        return sendEnvelope(response, result.data, result);
      }

      if (match.name === 'stockRisk') {
        const result = await analyticsService.listStockRisk(query);
        return sendEnvelope(response, result.data, result);
      }

      if (match.name === 'dashboardSummary') {
        const summary = await analyticsService.getDashboardSummary(query);
        return sendEnvelope(response, summary);
      }

      return sendError(response, 404, 'NOT_FOUND', 'Maintenance API route not found.');
    } catch (error) {
      const mapped = mapDbError(error);
      return sendError(response, mapped.statusCode, mapped.code, mapped.message);
    }
  };
}

export function matchRoute(pathname) {
  if (pathname === '/api/maintenance/workorders') {
    return { name: 'workorders', params: {} };
  }
  if (pathname === '/api/maintenance/analytics/mtbf-mttr') {
    return { name: 'mtbfMttr', params: {} };
  }
  if (pathname === '/api/maintenance/analytics/hold-reasons') {
    return { name: 'holdReasons', params: {} };
  }
  if (pathname === '/api/maintenance/analytics/repeat-failures') {
    return { name: 'repeatFailures', params: {} };
  }
  if (pathname === '/api/maintenance/analytics/stock-risk') {
    return { name: 'stockRisk', params: {} };
  }
  if (pathname === '/api/maintenance/dashboard-summary') {
    return { name: 'dashboardSummary', params: {} };
  }

  const workorderParts = pathname.match(/^\/api\/maintenance\/workorders\/([^/]+)\/parts$/);
  if (workorderParts) {
    return { name: 'workorderParts', params: { workorderNo: decodeURIComponent(workorderParts[1]) } };
  }

  const workorderDetail = pathname.match(/^\/api\/maintenance\/workorders\/([^/]+)$/);
  if (workorderDetail) {
    return { name: 'workorderDetail', params: { workorderNo: decodeURIComponent(workorderDetail[1]) } };
  }

  const equipmentHistory = pathname.match(/^\/api\/maintenance\/equipment\/([^/]+)\/history$/);
  if (equipmentHistory) {
    return { name: 'equipmentHistory', params: { equipmentNo: decodeURIComponent(equipmentHistory[1]) } };
  }

  return null;
}

function sendEnvelope(response, data, meta = {}) {
  return sendJson(response, 200, {
    data,
    total: meta.total,
    limit: meta.limit,
    offset: meta.offset,
    generated_at: new Date().toISOString(),
  });
}

function sendError(response, statusCode, code, message) {
  return sendJson(response, statusCode, {
    error: { code, message },
    generated_at: new Date().toISOString(),
  });
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, JSON_HEADERS);
  response.end(JSON.stringify(body));
}
