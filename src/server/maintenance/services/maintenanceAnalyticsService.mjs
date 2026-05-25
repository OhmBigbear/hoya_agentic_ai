import { dashboardSummaryDto, holdHistoryDto, mtbfMttrDto, riskMachineDto } from '../dto/maintenanceDto.mjs';

export function createMaintenanceAnalyticsService(analyticsRepository, inventoryRepository) {
  return {
    async listMtbfMttr(filters) {
      const result = await analyticsRepository.listMtbfMttr(filters);
      return { ...result, data: result.rows.map(mtbfMttrDto) };
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
