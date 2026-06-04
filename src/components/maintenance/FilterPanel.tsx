import type { MaintenanceKbContext, MaintenanceKbDocumentType, MaintenanceKbSearchRequest } from '../../types/maintenanceKb';
import { Card, CardContent } from '../../app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../app/components/ui/select';

interface FilterPanelProps {
  context: MaintenanceKbContext;
  filters: MaintenanceKbSearchRequest;
  onFiltersChange: (filters: MaintenanceKbSearchRequest) => void;
}

export function FilterPanel({ context, filters, onFiltersChange }: FilterPanelProps) {
  const updateFilter = (key: keyof MaintenanceKbSearchRequest, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <Card className="bg-[#141b2e] border-white/10">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <FilterSelect
            label="Production Line"
            value={filters.production_line ?? context.selected.production_line}
            options={context.production_lines}
            onChange={(value) => updateFilter('production_line', value)}
          />
          <FilterSelect
            label="Station / Process"
            value={filters.station ?? context.selected.station}
            options={context.stations}
            onChange={(value) => updateFilter('station', value)}
          />
          <FilterSelect
            label="Machine"
            value={filters.machine ?? context.selected.machine}
            options={context.machines}
            onChange={(value) => updateFilter('machine', value)}
          />
          <FilterSelect
            label="Failure Type"
            value={filters.failure_type ?? context.selected.failure_type}
            options={context.failure_types}
            onChange={(value) => updateFilter('failure_type', value)}
          />
          <FilterSelect
            label="Document Type"
            value={filters.document_type ?? context.selected.document_type}
            options={context.document_types}
            onChange={(value) => updateFilter('document_type', value as MaintenanceKbDocumentType)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase text-slate-400">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 border-white/10 bg-[#1e293b] text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#1e293b]">
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id} className="text-white">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
