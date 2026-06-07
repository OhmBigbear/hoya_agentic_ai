import { addWorkorderOperationalPredicates } from './maintenanceWorkorderRepository.mjs';
import { addDateWindow, buildWhereClause, listResult, parsePagination } from './queryHelpers.mjs';

const MTBF_FILTERS = {
  equipment_no: { column: 'equipment_no' },
  job_type: { column: 'job_type' },
};

const RELIABILITY_VIEW_SOURCES = {
  mtbf: 'mtbf_by_machine',
  mttr: 'mttr_by_machine',
  machineHealth: 'machine_health_score',
};

const HOLD_FILTERS = {
  site: { column: 'site' },
  department: { column: 'department' },
  equipment_type: { column: 'equipment_type' },
};

const REPEAT_FILTERS = {
  equipment_no: { column: 'candidate.equipment_no' },
  failure_signal: { column: 'candidate.failure_signal' },
};

const FAILURE_FILTERS = {
  site: { column: 'site' },
  location: { column: 'location' },
  department: { column: 'department' },
  equipment_no: { column: 'equipment_no' },
  equipment_type: { column: 'equipment_type' },
  job_type: { column: 'job_type' },
  failure_signal: { column: 'failure_signal' },
};

const FAILURE_GROUP_BY_COLUMNS = new Set([
  'failure_signal',
  'equipment_no',
  'equipment_type',
  'department',
  'site',
  'job_type',
]);

const PARETO_BASIS = new Set(['count', 'downtime', 'repair_time']);

export function createMaintenanceAnalyticsRepository(db) {
  return {
    buildMtbfMttrQuery,
    async listMtbfMttr(filters = {}) {
      const query = buildMtbfMttrQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    buildReliabilityMtbfQuery,
    async listReliabilityMtbf(filters = {}) {
      const query = buildReliabilityMtbfQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    buildReliabilityMttrQuery,
    async listReliabilityMttr(filters = {}) {
      const query = buildReliabilityMttrQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    buildMachineHealthQuery,
    async listMachineHealth(filters = {}) {
      const query = buildMachineHealthQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    buildHoldReasonsQuery,
    async listHoldReasons(filters = {}) {
      const query = buildHoldReasonsQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    buildRepeatFailuresQuery,
    async listRepeatFailures(filters = {}) {
      const query = buildRepeatFailuresQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    buildRcaRepeatFailureQuery,
    async getRcaRepeatFailure(equipmentNo, failureSignal) {
      if (!equipmentNo || !failureSignal) {
        return null;
      }
      const query = buildRcaRepeatFailureQuery(equipmentNo, failureSignal);
      const result = await db.query(query.text, query.values);
      return result.rows[0] ?? null;
    },

    buildRcaReliabilityContextQuery,
    async getRcaReliabilityContext(equipmentNo, filters = {}) {
      if (!equipmentNo) {
        return null;
      }
      const query = buildRcaReliabilityContextQuery(equipmentNo, filters);
      const result = await db.query(query.text, query.values);
      return result.rows[0] ?? null;
    },

    buildFailureFrequencyQuery,
    async listFailureFrequency(filters = {}) {
      const query = buildFailureFrequencyQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    buildRcaFailureFrequencyQuery,
    async getRcaFailureFrequency(failureSignal, filters = {}) {
      if (!failureSignal) {
        return null;
      }
      const query = buildRcaFailureFrequencyQuery(failureSignal, filters);
      const result = await db.query(query.text, query.values);
      return result.rows[0] ?? null;
    },

    buildFailureParetoQuery,
    async listFailurePareto(filters = {}) {
      const query = buildFailureParetoQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    async getDashboardSummary(filters = {}) {
      const workorders = await db.query(buildDashboardWorkorderSql(filters).text, buildDashboardWorkorderSql(filters).values);
      const [mtbf, holds, repeats, stock] = await Promise.all([
        this.listMtbfMttr({ ...filters, limit: 5, offset: 0 }),
        this.listHoldReasons({ ...filters, limit: 5, offset: 0 }),
        this.listRepeatFailures({ ...filters, limit: 5, offset: 0 }),
        db.query(`SELECT count(*)::int AS count FROM maintenance.v_stock_risk_summary WHERE stock_risk <> 'ok'`, []),
      ]);

      return {
        ...workorders.rows[0],
        repeat_failure_candidate_count: repeats.total,
        stock_risk_item_count: Number(stock.rows[0]?.count ?? 0),
        mtbf_mttr: mtbf.rows,
        top_risk_machines: repeats.rows,
        top_hold_reasons: holds.rows,
      };
    },
  };
}

export function buildRcaReliabilityContextQuery(equipmentNo, filters = {}) {
  const values = [equipmentNo];
  const predicates = ['equipment_no = $1'];
  addDateWindow(predicates, values, 'failure_start', filters.from, filters.to);

  return {
    text: `WITH reliability AS (
             SELECT
               equipment_no,
               count(*)::int AS failure_count,
               avg(hours_since_previous_repair) FILTER (WHERE hours_since_previous_repair > 0) AS mtbf_hours,
               avg(total_repair_time_hours) AS mttr_hours,
               coalesce(sum(down_time_hours), 0) AS total_downtime_hours
             FROM maintenance.v_mtbf_mttr_base
             WHERE ${predicates.join(' AND ')}
             GROUP BY equipment_no
           ),
           scored AS (
             SELECT *,
               greatest(0, least(100,
                 100
                 - least(45, coalesce(failure_count, 0) * 8)
                 - least(25, coalesce(mttr_hours, 0) * 3)
                 - least(20, coalesce(total_downtime_hours, 0) * 0.8)
                 + least(15, coalesce(mtbf_hours, 0) / 24)
               )) AS health_score
             FROM reliability
           )
           SELECT
             mtbf_hours,
             mttr_hours,
             total_downtime_hours,
             health_score,
             CASE
               WHEN health_score < 40 THEN 'critical'
               WHEN health_score < 70 THEN 'watch'
               ELSE 'healthy'
             END AS health_band
           FROM scored
           LIMIT 1`,
    values,
  };
}

export function buildRcaRepeatFailureQuery(equipmentNo, failureSignal) {
  return {
    text: `SELECT
             candidate.equipment_no,
             max(tracking.equipment_desc) AS equipment_desc,
             candidate.failure_signal,
             candidate.workorder_count,
             coalesce(sum(tracking.down_time_hours), 0) AS total_downtime_hours,
             avg(tracking.total_repair_time_hours) FILTER (WHERE tracking.total_repair_time_hours IS NOT NULL) AS avg_repair_time_hours,
             candidate.first_seen_at,
             candidate.last_seen_at,
             candidate.workorders
           FROM maintenance.v_repeat_failure_candidates candidate
           LEFT JOIN maintenance.work_order tracking
             ON tracking.equipment_no = candidate.equipment_no
            AND coalesce(tracking.failure_description, tracking.reason, tracking.description) = candidate.failure_signal
           WHERE candidate.equipment_no = $1
             AND candidate.failure_signal = $2
           GROUP BY
             candidate.equipment_no,
             candidate.failure_signal,
             candidate.workorder_count,
             candidate.first_seen_at,
             candidate.last_seen_at,
             candidate.workorders
           LIMIT 1`,
    values: [equipmentNo, failureSignal],
  };
}

export function buildRcaFailureFrequencyQuery(failureSignal, filters = {}) {
  const values = [failureSignal];
  const predicates = ['failure_signal = $1'];
  addDateWindow(predicates, values, 'failure_at', filters.from, filters.to);

  return {
    text: `WITH failure_base AS (
             SELECT
               coalesce(failure_description, reason, action_description, 'Unspecified failure') AS failure_signal,
               equipment_no,
               workorder_no,
               coalesce(act_work_start, plan_start) AS failure_at,
               down_time_hours,
               total_repair_time_hours
             FROM maintenance.work_order
             WHERE coalesce(failure_description, reason, action_description) IS NOT NULL
           )
           SELECT
             failure_signal,
             count(*)::int AS failure_count,
             count(DISTINCT equipment_no)::int AS affected_equipment_count,
             count(DISTINCT workorder_no)::int AS workorder_count,
             coalesce(sum(down_time_hours), 0) AS total_downtime_hours,
             avg(total_repair_time_hours) FILTER (WHERE total_repair_time_hours IS NOT NULL) AS avg_repair_time_hours,
             min(failure_at) AS first_seen_at,
             max(failure_at) AS last_seen_at
           FROM failure_base
           WHERE ${predicates.join(' AND ')}
           GROUP BY failure_signal
           LIMIT 1`,
    values,
  };
}

export function buildMtbfMttrQuery(filters = {}) {
  const { limit, offset } = parsePagination(filters);
  const { whereSql, values } = buildWhereClause(filters, MTBF_FILTERS);
  const predicates = whereSql ? [whereSql.replace(/^WHERE /, '')] : [];
  addDateWindow(predicates, values, 'failure_start', filters.from, filters.to);
  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  values.push(limit, offset);

  return {
    text: `SELECT equipment_no,
                  max(equipment_desc) AS equipment_desc,
                  count(*)::int AS failure_count,
                  avg(hours_since_previous_repair) FILTER (WHERE hours_since_previous_repair > 0) AS mtbf_hours,
                  avg(total_repair_time_hours) AS mttr_hours,
                  coalesce(sum(down_time_hours), 0) AS total_downtime_hours,
                  max(failure_start) AS last_failure_at,
                  max(repair_end) AS last_repair_end,
                  count(*) OVER() AS __total
           FROM maintenance.v_mtbf_mttr_base
           ${finalWhere}
           GROUP BY equipment_no
           ORDER BY failure_count DESC, total_downtime_hours DESC
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
  };
}

export function buildReliabilityMtbfQuery(filters = {}) {
  return buildReliabilityQuery(filters, {
    sourceView: RELIABILITY_VIEW_SOURCES.mtbf,
    orderBy: 'mtbf_hours ASC NULLS LAST, failure_count DESC, total_downtime_hours DESC',
  });
}

export function buildReliabilityMttrQuery(filters = {}) {
  return buildReliabilityQuery(filters, {
    sourceView: RELIABILITY_VIEW_SOURCES.mttr,
    orderBy: 'mttr_minutes DESC NULLS LAST, failure_count DESC, total_downtime_hours DESC',
  });
}

export function buildMachineHealthQuery(filters = {}) {
  return buildReliabilityQuery(filters, {
    sourceView: RELIABILITY_VIEW_SOURCES.machineHealth,
    orderBy: 'health_score ASC NULLS LAST, failure_count DESC, total_downtime_hours DESC',
  });
}

function buildReliabilityQuery(filters = {}, { sourceView, orderBy }) {
  const { limit, offset } = parsePagination(filters);
  const values = [];
  const predicates = [];

  addReliabilityFilter(predicates, values, filters.period_month, `date_trunc('month', base.failure_start)::date = $VALUE::date`);
  addReliabilityFilter(predicates, values, filters.machine_no ?? filters.equipment_no, `base.equipment_no = $VALUE`);
  addReliabilityFilter(predicates, values, filters.machine_type ?? filters.equipment_type, `coalesce(equipment.equipment_type, '') = $VALUE`);
  addReliabilitySectionFilter(predicates, values, filters.section);
  addDateWindow(predicates, values, 'base.failure_start', filters.from, filters.to);

  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  values.push(limit, offset);

  return {
    text: `WITH reliability AS (
             SELECT
               date_trunc('month', base.failure_start)::date AS period_month,
               coalesce(equipment.department, equipment.location, equipment.site, split_part(base.equipment_no, '-', 1)) AS section,
               coalesce(equipment.equipment_type, 'unknown') AS machine_type,
               base.equipment_no AS machine_no,
               max(base.equipment_desc) AS machine_desc,
               count(*)::int AS failure_count,
               avg(base.hours_since_previous_repair) FILTER (WHERE base.hours_since_previous_repair > 0) AS mtbf_hours,
               avg(base.total_repair_time_hours) AS mttr_hours,
               avg(base.total_repair_time_hours) * 60 AS mttr_minutes,
               coalesce(sum(base.down_time_hours), 0) AS total_downtime_hours,
               max(base.failure_start) AS last_failure_at,
               max(base.repair_end) AS last_repair_end
             FROM maintenance.v_mtbf_mttr_base base
             LEFT JOIN maintenance.equipment equipment ON equipment.equipment_no = base.equipment_no
             ${finalWhere}
             GROUP BY
               date_trunc('month', base.failure_start)::date,
               coalesce(equipment.department, equipment.location, equipment.site, split_part(base.equipment_no, '-', 1)),
               coalesce(equipment.equipment_type, 'unknown'),
               base.equipment_no
           ),
           scored AS (
             SELECT *,
               greatest(0, least(100,
                 100
                 - least(45, coalesce(failure_count, 0) * 8)
                 - least(25, coalesce(mttr_hours, 0) * 3)
                 - least(20, coalesce(total_downtime_hours, 0) * 0.8)
                 + least(15, coalesce(mtbf_hours, 0) / 24)
               )) AS health_score
             FROM reliability
           )
           SELECT
             period_month,
             section,
             machine_type,
             machine_no,
             machine_desc,
             machine_no AS equipment_no,
             machine_desc AS equipment_desc,
             failure_count,
             mtbf_hours,
             mttr_hours,
             mttr_minutes,
             total_downtime_hours,
             health_score,
             CASE
               WHEN health_score < 40 THEN 'critical'
               WHEN health_score < 70 THEN 'watch'
               ELSE 'healthy'
             END AS health_band,
             last_failure_at,
             last_repair_end,
             count(*) OVER() AS __total
           FROM scored
           ORDER BY period_month DESC NULLS LAST, ${orderBy}, machine_no
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
    sourceView,
  };
}

function addReliabilityFilter(predicates, values, value, sqlTemplate) {
  if (value === undefined || value === null || value === '') {
    return;
  }
  values.push(value);
  predicates.push(sqlTemplate.replace('$VALUE', `$${values.length}`));
}

function addReliabilitySectionFilter(predicates, values, value) {
  if (value === undefined || value === null || value === '') {
    return;
  }
  values.push(value);
  predicates.push(`(
    coalesce(equipment.department, '') = $${values.length}
    OR coalesce(equipment.location, '') = $${values.length}
    OR coalesce(equipment.site, '') = $${values.length}
    OR base.equipment_no ILIKE $${values.length + 1}
    OR coalesce(base.equipment_desc, '') ILIKE $${values.length + 1}
  )`);
  values.push(`${String(value)}%`);
}

export function buildHoldReasonsQuery(filters = {}) {
  const { limit, offset } = parsePagination(filters);
  const { whereSql, values } = buildWhereClause(filters, HOLD_FILTERS);
  values.push(limit, offset);
  return {
    text: `SELECT *, count(*) OVER() AS __total
           FROM maintenance.v_hold_reason_summary
           ${whereSql}
           ORDER BY hold_count DESC, affected_workorder_count DESC, hold_reason_description
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
  };
}

export function buildRepeatFailuresQuery(filters = {}) {
  const { limit, offset } = parsePagination(filters);
  const { whereSql, values } = buildWhereClause(filters, REPEAT_FILTERS);
  const predicates = whereSql ? [whereSql.replace(/^WHERE /, '')] : [];
  addDateWindow(predicates, values, 'candidate.last_seen_at', filters.from, filters.to);
  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  values.push(limit, offset);

  return {
    text: `WITH enriched AS (
             SELECT
               candidate.equipment_no,
               max(tracking.equipment_desc) AS equipment_desc,
               candidate.failure_signal,
               candidate.workorder_count,
               coalesce(sum(tracking.down_time_hours), 0) AS total_downtime_hours,
               avg(tracking.total_repair_time_hours) FILTER (WHERE tracking.total_repair_time_hours IS NOT NULL) AS avg_repair_time_hours,
               candidate.first_seen_at,
               candidate.last_seen_at,
               candidate.workorders
             FROM maintenance.v_repeat_failure_candidates candidate
             LEFT JOIN maintenance.work_order tracking
               ON tracking.equipment_no = candidate.equipment_no
              AND coalesce(tracking.failure_description, tracking.reason, tracking.description) = candidate.failure_signal
             ${finalWhere}
             GROUP BY
               candidate.equipment_no,
               candidate.failure_signal,
               candidate.workorder_count,
               candidate.first_seen_at,
               candidate.last_seen_at,
               candidate.workorders
           )
           SELECT *, count(*) OVER() AS __total
           FROM enriched
           ORDER BY workorder_count DESC, last_seen_at DESC NULLS LAST
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
  };
}

export function buildFailureFrequencyQuery(filters = {}) {
  const { limit, offset } = parsePagination(filters);
  const groupBy = normalizeFailureGroupBy(filters.group_by);
  const { whereSql, values } = buildWhereClause(filters, FAILURE_FILTERS);
  const predicates = whereSql ? [whereSql.replace(/^WHERE /, '')] : [];
  addDateWindow(predicates, values, 'failure_at', filters.from, filters.to);
  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  values.push(limit, offset);

  return {
    text: `WITH failure_base AS (
             SELECT
               coalesce(failure_description, reason, action_description, 'Unspecified failure') AS failure_signal,
               equipment_no,
               equipment_desc,
               site,
               location,
               department,
               equipment_type,
               job_type,
               workorder_no,
               coalesce(act_work_start, plan_start) AS failure_at,
               down_time_hours,
               total_repair_time_hours
             FROM maintenance.work_order
             WHERE coalesce(failure_description, reason, action_description) IS NOT NULL
           ),
           frequency AS (
             SELECT
               ${groupBy} AS failure_signal,
               count(*)::int AS failure_count,
               count(DISTINCT equipment_no)::int AS affected_equipment_count,
               count(DISTINCT workorder_no)::int AS workorder_count,
               coalesce(sum(down_time_hours), 0) AS total_downtime_hours,
               avg(total_repair_time_hours) FILTER (WHERE total_repair_time_hours IS NOT NULL) AS avg_repair_time_hours,
               min(failure_at) AS first_seen_at,
               max(failure_at) AS last_seen_at
             FROM failure_base
             ${finalWhere}
             GROUP BY ${groupBy}
           )
           SELECT *, count(*) OVER() AS __total
           FROM frequency
           ORDER BY failure_count DESC, total_downtime_hours DESC, failure_signal
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
    groupBy,
  };
}

export function buildFailureParetoQuery(filters = {}) {
  const topN = parseTopN(filters.top_n);
  const basis = parseParetoBasis(filters.basis);
  const groupBy = normalizeFailureGroupBy(filters.group_by);
  const { whereSql, values } = buildWhereClause(filters, FAILURE_FILTERS);
  const predicates = whereSql ? [whereSql.replace(/^WHERE /, '')] : [];
  addDateWindow(predicates, values, 'failure_at', filters.from, filters.to);
  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  const valueExpression = paretoValueExpression(basis);
  const basisPlaceholder = values.length + 1;
  const limitPlaceholder = values.length + 2;

  return {
    text: `WITH failure_base AS (
             SELECT
               coalesce(failure_description, reason, action_description, 'Unspecified failure') AS failure_signal,
               equipment_no,
               equipment_desc,
               site,
               location,
               department,
               equipment_type,
               job_type,
               workorder_no,
               coalesce(act_work_start, plan_start) AS failure_at,
               down_time_hours,
               total_repair_time_hours
             FROM maintenance.work_order
             WHERE coalesce(failure_description, reason, action_description) IS NOT NULL
           ),
           frequency AS (
             SELECT
               ${groupBy} AS failure_signal,
               count(*)::int AS failure_count,
               count(DISTINCT equipment_no)::int AS affected_equipment_count,
               count(DISTINCT workorder_no)::int AS workorder_count,
               coalesce(sum(down_time_hours), 0) AS total_downtime_hours,
               coalesce(sum(total_repair_time_hours), 0) AS total_repair_time_hours,
               min(failure_at) AS first_seen_at,
               max(failure_at) AS last_seen_at
             FROM failure_base
             ${finalWhere}
             GROUP BY ${groupBy}
           ),
           ranked AS (
             SELECT
               row_number() OVER (ORDER BY ${valueExpression} DESC, failure_signal)::int AS rank,
               failure_signal,
               ${valueExpression} AS value,
               $${basisPlaceholder}::text AS basis,
               workorder_count,
               affected_equipment_count,
               sum(${valueExpression}) OVER () AS total_value
             FROM frequency
           )
           SELECT
             rank,
             failure_signal,
             value,
             basis,
             CASE WHEN total_value > 0 THEN (value / total_value) * 100 ELSE 0 END AS percentage,
             CASE WHEN total_value > 0 THEN (sum(value) OVER (ORDER BY rank) / total_value) * 100 ELSE 0 END AS cumulative_percentage,
             workorder_count,
             affected_equipment_count,
             count(*) OVER() AS __total
           FROM ranked
           ORDER BY rank
           LIMIT $${limitPlaceholder} OFFSET 0`,
    values: [...values, basis, topN],
    limit: topN,
    offset: 0,
    basis,
  };
}

function normalizeFailureGroupBy(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return FAILURE_GROUP_BY_COLUMNS.has(normalized) ? normalized : 'failure_signal';
}

function parseParetoBasis(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return PARETO_BASIS.has(normalized) ? normalized : 'count';
}

function parseTopN(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 10;
  }
  return Math.min(parsed, 500);
}

function paretoValueExpression(basis) {
  if (basis === 'downtime') {
    return 'total_downtime_hours';
  }
  if (basis === 'repair_time') {
    return 'total_repair_time_hours';
  }
  return 'failure_count';
}

function buildDashboardWorkorderSql(filters = {}) {
  const { whereSql, values } = buildWhereClause(filters, {
    site: { column: 'site' },
    department: { column: 'department' },
    equipment_no: { column: 'equipment_no' },
    status: { column: 'status', operator: 'lower' },
    job_type: { column: 'job_type', operator: 'lower' },
  });
  const predicates = whereSql ? [whereSql.replace(/^WHERE /, '')] : [];
  addWorkorderOperationalPredicates(predicates, values, filters);
  addDateWindow(predicates, values, 'coalesce(act_work_start, plan_start)', filters.from, filters.to);
  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';

  return {
    text: `SELECT count(*) FILTER (WHERE lower(coalesce(status, '')) IN ('open', 'in_progress'))::int AS open_workorder_count,
                  count(*) FILTER (WHERE plan_finish < now() AND lower(coalesce(status, '')) NOT IN ('completed', 'closed', 'cancelled'))::int AS overdue_workorder_count,
                  count(*) FILTER (WHERE lower(coalesce(status, '')) = 'on_hold')::int AS on_hold_workorder_count,
                  count(*) FILTER (WHERE lower(coalesce(status, '')) IN ('completed', 'closed'))::int AS completed_workorder_count,
                  coalesce(sum(down_time_hours), 0) AS total_downtime_hours
           FROM maintenance.v_workorder_tracking
           ${finalWhere}`,
    values,
  };
}
