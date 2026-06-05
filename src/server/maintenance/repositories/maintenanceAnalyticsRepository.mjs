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
  equipment_no: { column: 'equipment_no' },
};

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
  addDateWindow(predicates, values, 'last_seen_at', filters.from, filters.to);
  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  values.push(limit, offset);

  return {
    text: `SELECT *, count(*) OVER() AS __total
           FROM maintenance.v_repeat_failure_candidates
           ${finalWhere}
           ORDER BY workorder_count DESC, last_seen_at DESC NULLS LAST
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
  };
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
