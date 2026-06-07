import { addDateWindow, buildWhereClause, listResult, parseBoundedLimit, parsePagination } from './queryHelpers.mjs';

const WORKORDER_FILTERS = {
  site: { column: 'site' },
  location: { column: 'location' },
  department: { column: 'department' },
  equipment_no: { column: 'equipment_no' },
  workorder_no: { column: 'workorder_no' },
  status: { column: 'status', operator: 'lower' },
  job_type: { column: 'job_type', operator: 'lower' },
  priority: { column: 'priority', operator: 'lower' },
};

const HISTORY_FILTERS = {
  status: { column: 'status' },
  job_type: { column: 'job_type' },
};

export function createMaintenanceWorkorderRepository(db) {
  return {
    buildWorkordersQuery,
    async listWorkorders(filters = {}) {
      const query = buildWorkordersQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    async getWorkorderBase(workorderNo) {
      const result = await db.query(
        `SELECT *
         FROM maintenance.v_workorder_tracking
         WHERE workorder_no = $1
         LIMIT 1`,
        [workorderNo],
      );
      return result.rows[0] ?? null;
    },

    async getRcaWorkorderBase(workorderNo) {
      const result = await db.query(buildRcaWorkorderBaseQuery().text, [workorderNo]);
      return result.rows[0] ?? null;
    },

    async getEquipment(equipmentNo) {
      if (!equipmentNo) {
        return null;
      }
      const result = await db.query(
        `SELECT equipment_no, equipment_desc, equipment_type, model_no, serial_no, manufacturer,
                department, site, location, is_active
         FROM maintenance.equipment
         WHERE equipment_no = $1
         LIMIT 1`,
        [equipmentNo],
      );
      return result.rows[0] ?? null;
    },

    async listTasks(workorderNo) {
      const result = await db.query(
        `SELECT task_no, description_1, description_2, value_text, reference, authorizer, request_no
         FROM maintenance.work_order_task
         WHERE workorder_no = $1
         ORDER BY task_no NULLS LAST, source_row_number`,
        [workorderNo],
      );
      return result.rows;
    },

    async listHoldHistory(workorderNo) {
      const result = await db.query(
        `SELECT workorder_no, hold_reason_description, hold_date, hold_by, site, location,
                department, equipment_type, operator_id
         FROM maintenance.work_order_hold_history
         WHERE workorder_no = $1
         ORDER BY hold_date DESC NULLS LAST`,
        [workorderNo],
      );
      return result.rows;
    },

    async listPartsByWorkorder(workorderNo) {
      const result = await db.query(
        `SELECT *
         FROM maintenance.v_spare_part_usage_by_workorder
         WHERE workorder_no = $1
         ORDER BY last_transaction_at DESC NULLS LAST, catalogue_no`,
        [workorderNo],
      );
      return result.rows;
    },

    buildEquipmentHistoryQuery,
    async listEquipmentHistory(equipmentNo, filters = {}) {
      const query = buildEquipmentHistoryQuery(equipmentNo, filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    async listRcaRelatedHistory(equipmentNo, filters = {}) {
      const query = buildRcaRelatedHistoryQuery(equipmentNo, filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },
  };
}

export function buildRcaWorkorderBaseQuery() {
  return {
    text: `SELECT
             wo.*,
             count(DISTINCT task.task_id)::int AS task_count,
             count(DISTINCT part_tx.part_transaction_id)::int AS part_transaction_count,
             coalesce(sum(part_tx.tran_qty) FILTER (WHERE upper(part_tx.transaction_type) = 'ISSUE'), 0) AS issued_qty
           FROM maintenance.work_order wo
           LEFT JOIN maintenance.work_order_task task ON task.work_order_id = wo.work_order_id
           LEFT JOIN maintenance.work_order_part_transaction part_tx ON part_tx.work_order_id = wo.work_order_id
           WHERE wo.workorder_no = $1
           GROUP BY wo.work_order_id
           LIMIT 1`,
    values: [],
  };
}

export function buildWorkordersQuery(filters = {}) {
  const { limit, offset } = parsePagination(filters);
  const { whereSql, values } = buildWhereClause(filters, WORKORDER_FILTERS);
  const predicates = whereSql ? [whereSql.replace(/^WHERE /, '')] : [];
  addWorkorderOperationalPredicates(predicates, values, filters);
  addDateWindow(predicates, values, 'coalesce(act_work_start, plan_start)', filters.from, filters.to);
  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  values.push(limit, offset);

  return {
    text: `SELECT *, count(*) OVER() AS __total
           FROM maintenance.v_workorder_tracking
           ${finalWhere}
           ORDER BY coalesce(act_work_start, plan_start) DESC NULLS LAST, workorder_no
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
  };
}

export function addWorkorderOperationalPredicates(predicates, values, filters = {}) {
  if (filters.q) {
    values.push(`%${String(filters.q).trim()}%`);
    predicates.push(`(
      workorder_no ILIKE $${values.length}
      OR equipment_no ILIKE $${values.length}
      OR equipment_desc ILIKE $${values.length}
      OR failure_description ILIKE $${values.length}
      OR reason ILIKE $${values.length}
    )`);
  }

  if (filters.overdue === 'true' || filters.overdue === true) {
    predicates.push(`plan_finish < now() AND lower(coalesce(status, '')) NOT IN ('completed', 'closed', 'cancelled')`);
  }

  if (filters.waiting_parts === 'true' || filters.waiting_parts === true) {
    predicates.push(`(
      lower(coalesce(status, '')) LIKE '%hold%'
      OR lower(coalesce(status, '')) LIKE '%waiting%'
      OR lower(coalesce(reason, '')) LIKE '%part%'
      OR lower(coalesce(failure_description, '')) LIKE '%part%'
    )`);
  }
}

export function buildEquipmentHistoryQuery(equipmentNo, filters = {}) {
  const { limit, offset } = parsePagination(filters);
  const predicates = ['equipment_no = $1'];
  const finalValues = [equipmentNo];
  Object.entries(HISTORY_FILTERS).forEach(([key, config]) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      finalValues.push(filters[key]);
      predicates.push(`${config.column} = $${finalValues.length}`);
    }
  });
  addDateWindow(predicates, finalValues, 'coalesce(act_work_start, plan_start)', filters.from, filters.to);
  finalValues.push(limit, offset);

  return {
    text: `SELECT *, count(*) OVER() AS __total
           FROM maintenance.v_machine_maintenance_history
           WHERE ${predicates.join(' AND ')}
           ORDER BY coalesce(act_work_start, plan_start) DESC NULLS LAST, workorder_no
           LIMIT $${finalValues.length - 1} OFFSET $${finalValues.length}`,
    values: finalValues,
    limit,
    offset,
  };
}

export function buildRcaRelatedHistoryQuery(equipmentNo, filters = {}) {
  const limit = parseBoundedLimit(filters.history_limit ?? filters.limit, 10, 50);
  const predicates = ['equipment_no = $1'];
  const values = [equipmentNo];
  addDateWindow(predicates, values, 'coalesce(act_work_start, plan_start)', filters.from, filters.to);
  if (filters.exclude_workorder_no) {
    values.push(filters.exclude_workorder_no);
    predicates.push(`workorder_no <> $${values.length}`);
  }
  values.push(limit);

  return {
    text: `SELECT *, count(*) OVER() AS __total
           FROM maintenance.v_machine_maintenance_history
           WHERE ${predicates.join(' AND ')}
           ORDER BY coalesce(act_work_start, plan_start) DESC NULLS LAST, workorder_no
           LIMIT $${values.length} OFFSET 0`,
    values,
    limit,
    offset: 0,
  };
}
