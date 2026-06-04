import { partUsageDto, workOrderDetailDto, workOrderDto } from '../dto/maintenanceDto.mjs';

export function createMaintenanceWorkorderService(repository) {
  return {
    async listWorkorders(filters) {
      const result = await repository.listWorkorders(filters);
      return { ...result, data: result.rows.map(workOrderDto) };
    },

    async getWorkorderDetail(workorderNo) {
      const base = await repository.getWorkorderBase(workorderNo);
      if (!base) {
        return null;
      }

      const [equipment, tasks, parts, holdHistory] = await Promise.all([
        repository.getEquipment(base.equipment_no),
        repository.listTasks(workorderNo),
        repository.listPartsByWorkorder(workorderNo),
        repository.listHoldHistory(workorderNo),
      ]);

      return workOrderDetailDto(base, equipment, tasks, parts, holdHistory);
    },

    async listEquipmentHistory(equipmentNo, filters) {
      const result = await repository.listEquipmentHistory(equipmentNo, filters);
      return { ...result, data: result.rows.map(workOrderDto) };
    },

    async listPartsByWorkorder(workorderNo) {
      const rows = await repository.listPartsByWorkorder(workorderNo);
      return { rows, data: rows.map(partUsageDto), total: rows.length, limit: rows.length, offset: 0 };
    },
  };
}
