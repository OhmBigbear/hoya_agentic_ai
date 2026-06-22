import {
  dashboardSummaryDto,
  failureFrequencyDto,
  failureParetoDto,
  holdHistoryDto,
  maintenanceReliabilityDto,
  mtbfMttrDto,
  normalizeFailureSignal,
  rcaEvidenceDto,
  riskMachineDto,
} from '../dto/maintenanceDto.mjs';

export function createMaintenanceAnalyticsService(analyticsRepository, inventoryRepository, workorderRepository) {
  return {
    async listMtbfMttr(filters) {
      const result = await analyticsRepository.listMtbfMttr(filters);
      return { ...result, data: result.rows.map(mtbfMttrDto) };
    },

    async listReliabilityMtbf(filters) {
      const result = await analyticsRepository.listReliabilityMtbf(filters);
      return { ...result, data: result.rows.map(maintenanceReliabilityDto) };
    },

    async listReliabilityMttr(filters) {
      const result = await analyticsRepository.listReliabilityMttr(filters);
      return { ...result, data: result.rows.map(maintenanceReliabilityDto) };
    },

    async listMachineHealth(filters) {
      const result = await analyticsRepository.listMachineHealth(filters);
      return { ...result, data: result.rows.map(maintenanceReliabilityDto) };
    },

    async listHoldReasons(filters) {
      const result = await analyticsRepository.listHoldReasons(filters);
      return { ...result, data: result.rows.map(holdHistoryDto) };
    },

    async listRepeatFailures(filters) {
      const result = await analyticsRepository.listRepeatFailures(filters);
      return { ...result, data: result.rows.map(riskMachineDto) };
    },

    async listFailureFrequency(filters) {
      const result = await analyticsRepository.listFailureFrequency(filters);
      return { ...result, data: result.rows.map(failureFrequencyDto) };
    },

    async listFailurePareto(filters) {
      const result = await analyticsRepository.listFailurePareto(filters);
      return { ...result, data: result.rows.map(failureParetoDto) };
    },

    async listStockRisk(filters) {
      const result = await inventoryRepository.listStockRisk(filters);
      return { ...result, data: result.rows.map(riskMachineDto) };
    },

    async listMaintenancePartCost(filters) {
      const result = await inventoryRepository.listMaintenancePartCost(filters);
      return { ...result, data: result.rows.map(maintenancePartCostDto) };
    },

    async listSparePartRisk(filters) {
      const result = await inventoryRepository.listSparePartRisk(filters);
      return { ...result, data: result.rows.map(riskMachineDto) };
    },

    async getDashboardSummary(filters) {
      const row = await analyticsRepository.getDashboardSummary(filters);
      return dashboardSummaryDto(row);
    },

    async getRcaEvidence(filters) {
      const workorderNo = typeof filters.workorder_no === 'string' ? filters.workorder_no.trim() : '';
      if (!workorderNo) {
        return null;
      }

      const workorder = await workorderRepository.getRcaWorkorderBase(workorderNo);
      if (!workorder) {
        return null;
      }

      const includeRelated = parseIncludeRelated(filters.include_related);
      const [equipment, tasks, parts, holdHistory] = await Promise.all([
        workorderRepository.getEquipment(workorder.equipment_no),
        workorderRepository.listTasks(workorderNo),
        workorderRepository.listPartsByWorkorder(workorderNo),
        workorderRepository.listHoldHistory(workorderNo),
      ]);

      const failureSignal = normalizeFailureSignal(workorder);
      const relatedHistoryPromise = includeRelated && workorder.equipment_no
        ? workorderRepository.listRcaRelatedHistory(workorder.equipment_no, {
          ...filters,
          exclude_workorder_no: workorderNo,
        })
        : Promise.resolve({ rows: [], total: 0, limit: 0, offset: 0 });

      const [
        relatedHistory,
        repeatFailure,
        failureFrequency,
        reliabilityContext,
      ] = await Promise.all([
        relatedHistoryPromise,
        analyticsRepository.getRcaRepeatFailure(workorder.equipment_no, failureSignal.raw_text),
        analyticsRepository.getRcaFailureFrequency(failureSignal.raw_text, filters),
        analyticsRepository.getRcaReliabilityContext(workorder.equipment_no, filters),
      ]);

      const warnings = rcaEvidenceWarnings({ tasks, parts, holdHistory, relatedHistory: relatedHistory.rows, includeRelated });

      return {
        ...rcaEvidenceDto({
          workorder,
          equipment,
          tasks,
          parts,
          holdHistory,
          relatedHistory: relatedHistory.rows,
          repeatFailure,
          failureFrequency,
          reliabilityContext,
        }),
        warnings,
      };
    },
  };
}

function parseIncludeRelated(value) {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return String(value).toLowerCase() !== 'false';
}

function rcaEvidenceWarnings({ tasks, parts, holdHistory, relatedHistory, includeRelated }) {
  const warnings = [];
  if (!tasks.length) {
    warnings.push('No task history was found for this workorder.');
  }
  if (!parts.length) {
    warnings.push('No part or consumable usage was found for this workorder.');
  }
  if (!holdHistory.length) {
    warnings.push('No hold history was found for this workorder.');
  }
  if (includeRelated && !relatedHistory.length) {
    warnings.push('No related machine history was found for this evidence request.');
  }
  return warnings;
}

function maintenancePartCostDto(row) {
  return {
    workorder_no: row.workorder_no ? String(row.workorder_no) : '',
    machine_no: stringOrUndefined(row.machine_no),
    machine_desc: stringOrUndefined(row.machine_desc),
    period_month: dateOnlyString(row.period_month),
    section: stringOrUndefined(row.section),
    machine_type: stringOrUndefined(row.machine_type),
    catalogue_no: stringOrUndefined(row.catalogue_no),
    part_name: stringOrUndefined(row.part_name),
    uom: stringOrUndefined(row.uom),
    issued_qty: numberOrZero(row.issued_qty),
    movement_qty: numberOrZero(row.movement_qty),
    transaction_count: numberOrZero(row.transaction_count),
    unit_cost: numberOrUndefined(row.unit_cost),
    estimated_part_cost: numberOrZero(row.estimated_part_cost),
    workorder_material_cost: numberOrUndefined(row.workorder_material_cost),
    first_transaction_at: dateString(row.first_transaction_at),
    last_transaction_at: dateString(row.last_transaction_at),
  };
}

function numberOrZero(value) {
  return numberOrUndefined(value) ?? 0;
}

function numberOrUndefined(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function stringOrUndefined(value) {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

function dateString(value) {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function dateOnlyString(value) {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}
