import { dashboardSummaryDto, holdHistoryDto, maintenanceReliabilityDto, mtbfMttrDto, riskMachineDto } from '../dto/maintenanceDto.mjs';

export function createMaintenanceAnalyticsService(analyticsRepository, inventoryRepository) {
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

    async listStockRisk(filters) {
      const result = await inventoryRepository.listStockRisk(filters);
      return { ...result, data: result.rows.map(riskMachineDto) };
    },

    async getDashboardSummary(filters) {
      const row = await analyticsRepository.getDashboardSummary(filters);
      return dashboardSummaryDto(row);
    },
  };
}
