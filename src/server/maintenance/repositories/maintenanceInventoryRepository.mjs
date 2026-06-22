import { buildWhereClause, listResult, parsePagination } from './queryHelpers.mjs';

const STOCK_FILTERS = {
  catalogue_no: { column: 'catalogue_no' },
  stock_risk: { column: 'stock_risk' },
};

const MAINTENANCE_PART_COST_SOURCE_VIEW = 'maintenance.v_spare_part_usage_by_workorder';
const SPARE_PART_RISK_SOURCE_VIEW = 'maintenance.v_stock_risk_summary';

export function createMaintenanceInventoryRepository(db) {
  return {
    buildStockRiskQuery,
    async listStockRisk(filters = {}) {
      const query = buildStockRiskQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
    },

    buildMaintenancePartCostQuery,
    async listMaintenancePartCost(filters = {}) {
      return queryReadonlyAnalyticsCollection({
        db,
        filters,
        sourceView: MAINTENANCE_PART_COST_SOURCE_VIEW,
        buildQuery: buildMaintenancePartCostQuery,
      });
    },

    buildSparePartRiskQuery,
    async listSparePartRisk(filters = {}) {
      return queryReadonlyAnalyticsCollection({
        db,
        filters,
        sourceView: SPARE_PART_RISK_SOURCE_VIEW,
        buildQuery: buildSparePartRiskQuery,
      });
    },
  };
}

export function buildStockRiskQuery(filters = {}) {
  const { limit, offset } = parsePagination(filters);
  const { whereSql, values } = buildWhereClause(filters, STOCK_FILTERS);
  values.push(limit, offset);

  return {
    text: `SELECT *, count(*) OVER() AS __total
           FROM maintenance.v_stock_risk_summary
           ${whereSql}
           ORDER BY CASE stock_risk
                      WHEN 'zero_stock' THEN 1
                      WHEN 'below_min' THEN 2
                      WHEN 'below_reorder_point' THEN 3
                      ELSE 4
                    END,
                    catalogue_no
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
  };
}

export function buildMaintenancePartCostQuery(filters = {}) {
  const { limit, offset } = parsePagination(filters);
  const values = [];
  const predicates = [];

  addExactFilter(predicates, values, filters.workorder_no, 'usage.workorder_no = $VALUE');
  addExactFilter(predicates, values, filters.machine_no, 'usage.equipment_no = $VALUE');
  addExactFilter(predicates, values, filters.period_month, "date_trunc('month', coalesce(usage.last_transaction_at, workorder.act_work_start, workorder.plan_start))::date = $VALUE::date");
  addExactFilter(predicates, values, filters.section, "coalesce(workorder.department, workorder.location, workorder.site, equipment.department, equipment.location, equipment.site, split_part(usage.equipment_no, '-', 1)) = $VALUE");
  addExactFilter(predicates, values, filters.machine_type, "coalesce(workorder.equipment_type, equipment.equipment_type, 'unknown') = $VALUE");

  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  values.push(limit, offset);

  return {
    text: `SELECT
             usage.workorder_no,
             usage.equipment_no AS machine_no,
             usage.equipment_desc AS machine_desc,
             date_trunc('month', coalesce(usage.last_transaction_at, workorder.act_work_start, workorder.plan_start))::date AS period_month,
             coalesce(workorder.department, workorder.location, workorder.site, equipment.department, equipment.location, equipment.site, split_part(usage.equipment_no, '-', 1)) AS section,
             coalesce(workorder.equipment_type, equipment.equipment_type, 'unknown') AS machine_type,
             usage.catalogue_no,
             usage.part_name,
             usage.uom,
             coalesce(usage.issued_qty, 0) AS issued_qty,
             coalesce(usage.movement_qty, 0) AS movement_qty,
             coalesce(usage.transaction_count, 0) AS transaction_count,
             part.unit_cost,
             coalesce(usage.issued_qty, usage.movement_qty, 0) * coalesce(part.unit_cost, 0) AS estimated_part_cost,
             coalesce(workorder.act_mat_cost, workorder.plan_mat_cost) AS workorder_material_cost,
             usage.first_transaction_at,
             usage.last_transaction_at,
             count(*) OVER() AS __total
           FROM maintenance.v_spare_part_usage_by_workorder usage
           LEFT JOIN maintenance.work_order workorder ON workorder.workorder_no = usage.workorder_no
           LEFT JOIN maintenance.equipment equipment ON equipment.equipment_no = usage.equipment_no
           LEFT JOIN maintenance.part_catalog part ON part.catalogue_no = usage.catalogue_no
           ${finalWhere}
           ORDER BY estimated_part_cost DESC, usage.last_transaction_at DESC NULLS LAST, usage.workorder_no, usage.catalogue_no
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
  };
}

export function buildSparePartRiskQuery(filters = {}) {
  const { limit, offset } = parsePagination(filters);
  const values = [];
  const predicates = [];

  addExactFilter(predicates, values, filters.catalogue_no, 'catalogue_no = $VALUE');
  if (typeof filters.query === 'string' && filters.query.trim()) {
    values.push(`%${filters.query.trim()}%`);
    const placeholder = `$${values.length}`;
    predicates.push(`(catalogue_no ILIKE ${placeholder} OR coalesce(part_name, '') ILIKE ${placeholder} OR coalesce(warehouse_code, '') ILIKE ${placeholder} OR coalesce(bin_location, '') ILIKE ${placeholder})`);
  }

  const finalWhere = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';
  values.push(limit, offset);

  return {
    text: `SELECT
             catalogue_no,
             part_name,
             uom,
             warehouse_code,
             bin_location,
             on_hand,
             reorder_point,
             min_qty,
             stock_value,
             stock_risk,
             count(*) OVER() AS __total
           FROM maintenance.v_stock_risk_summary
           ${finalWhere}
           ORDER BY CASE stock_risk
                      WHEN 'zero_stock' THEN 1
                      WHEN 'below_min' THEN 2
                      WHEN 'below_reorder_point' THEN 3
                      ELSE 4
                    END,
                    stock_value DESC NULLS LAST,
                    catalogue_no
           LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
    limit,
    offset,
  };
}

async function queryReadonlyAnalyticsCollection({ db, filters, sourceView, buildQuery }) {
  const query = buildQuery(filters);
  try {
    const result = await db.query(query.text, query.values);
    const listed = listResult(result.rows, query.limit, query.offset);
    return {
      ...listed,
      metadata: { source_view: sourceView },
      evidence_refs: [],
      warnings: [],
    };
  } catch (error) {
    if (error?.code !== '42P01') {
      throw error;
    }

    return {
      rows: [],
      total: 0,
      limit: query.limit,
      offset: query.offset,
      metadata: { source_view: sourceView },
      evidence_refs: [],
      warnings: [`Readonly analytics source view is unavailable: ${sourceView}. Returning an empty result set.`],
    };
  }
}

function addExactFilter(predicates, values, value, sqlTemplate) {
  if (value === undefined || value === null || value === '') {
    return;
  }
  values.push(value);
  predicates.push(sqlTemplate.replace('$VALUE', `$${values.length}`));
}
