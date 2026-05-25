export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 500;

export function parsePagination(query = {}) {
  return {
    limit: clampInteger(query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: clampInteger(query.offset, 0, 0, Number.MAX_SAFE_INTEGER),
  };
}

export function buildWhereClause(filters, filterMap) {
  const values = [];
  const predicates = [];

  Object.entries(filterMap).forEach(([key, config]) => {
    const value = filters[key];
    if (value === undefined || value === null || value === '') {
      return;
    }

    values.push(value);
    const placeholder = `$${values.length}`;
    predicates.push(config.operator === 'ilike'
      ? `${config.column} ILIKE ${placeholder}`
      : `${config.column} = ${placeholder}`);
  });

  return {
    whereSql: predicates.length ? `WHERE ${predicates.join(' AND ')}` : '',
    values,
  };
}

export function addDateWindow(predicates, values, column, from, to) {
  if (from) {
    values.push(from);
    predicates.push(`${column} >= $${values.length}::timestamp`);
  }
  if (to) {
    values.push(to);
    predicates.push(`${column} < $${values.length}::timestamp`);
  }
}

export function listResult(rows, limit, offset) {
  const total = rows.length ? Number(rows[0].__total ?? rows.length) : 0;
  return {
    rows: rows.map(({ __total, ...row }) => row),
    total,
    limit,
    offset,
  };
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min) {
    return fallback;
  }
  return Math.min(parsed, max);
}
