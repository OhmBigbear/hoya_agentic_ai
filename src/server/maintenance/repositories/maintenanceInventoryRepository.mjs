import { buildWhereClause, listResult, parsePagination } from './queryHelpers.mjs';

const STOCK_FILTERS = {
  catalogue_no: { column: 'catalogue_no' },
  stock_risk: { column: 'stock_risk' },
};

export function createMaintenanceInventoryRepository(db) {
  return {
    buildStockRiskQuery,
    async listStockRisk(filters = {}) {
      const query = buildStockRiskQuery(filters);
      const result = await db.query(query.text, query.values);
      return listResult(result.rows, query.limit, query.offset);
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
