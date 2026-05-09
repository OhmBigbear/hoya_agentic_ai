import { Card, CardContent } from '../../../app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../app/components/ui/select';

interface KnowledgeContextFiltersProps {
  selectedMachine: string;
  onSelectedMachineChange: (value: string) => void;
  selectedDocType: string;
  onSelectedDocTypeChange: (value: string) => void;
}

export function KnowledgeContextFilters({
  selectedMachine,
  onSelectedMachineChange,
  selectedDocType,
  onSelectedDocTypeChange,
}: KnowledgeContextFiltersProps) {
  return (
    <Card className="bg-[#141b2e] border-white/10">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Production Line */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
              Production Line
            </label>
            <Select defaultValue="rx1-surfacing">
              <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10">
                <SelectItem value="rx1-surfacing" className="text-white">Rx1 Surfacing</SelectItem>
                <SelectItem value="rx2-coating" className="text-white">Rx2 Coating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Station / Process */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
              Station / Process
            </label>
            <Select defaultValue="curve-gen">
              <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10">
                <SelectItem value="curve-gen" className="text-white">CURVE GENERATING</SelectItem>
                <SelectItem value="polishing" className="text-white">POLISHING</SelectItem>
                <SelectItem value="laser-engr" className="text-white">LASER ENGRAVING</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Machine */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
              Machine
            </label>
            <Select value={selectedMachine} onValueChange={onSelectedMachineChange}>
              <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10">
                <SelectItem value="curve-gen-3b" className="text-white">CURVE-GEN-3B</SelectItem>
                <SelectItem value="polishing-7a" className="text-white">POLISHING-7A</SelectItem>
                <SelectItem value="laser-engr-2c" className="text-white">LASER-ENGR-2C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Failure Type / Symptom */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
              Failure Type
            </label>
            <Select defaultValue="mechanical">
              <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10">
                <SelectItem value="all" className="text-white">All Types</SelectItem>
                <SelectItem value="mechanical" className="text-white">Mechanical</SelectItem>
                <SelectItem value="electrical" className="text-white">Electrical</SelectItem>
                <SelectItem value="software" className="text-white">Software</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Document Type */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
              Document Type
            </label>
            <Select value={selectedDocType} onValueChange={onSelectedDocTypeChange}>
              <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10">
                <SelectItem value="all" className="text-white">All Documents</SelectItem>
                <SelectItem value="manual" className="text-white">Manuals</SelectItem>
                <SelectItem value="sop" className="text-white">SOPs</SelectItem>
                <SelectItem value="history" className="text-white">History</SelectItem>
                <SelectItem value="lessons" className="text-white">Best Practices</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
