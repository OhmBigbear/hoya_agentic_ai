import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sparkles,
  Send,
  Database,
  Filter,
  Download,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Terminal,
  FileJson,
  Bot,
  User,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';

interface RawDataExplorerProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

// Sample raw data records
const rawDataRecords = [
  { 
    id: 1, 
    timestamp: '2026-01-15 13:45:23.127', 
    source: 'PLC-CURVE-GEN-3B', 
    entityId: 'CURVE-GEN-3B', 
    parameter: 'spindle_rpm', 
    value: '2145', 
    unit: 'RPM', 
    status: 'valid',
    ingestionTime: '2026-01-15 13:45:23.142',
    dataType: 'numeric',
  },
  { 
    id: 2, 
    timestamp: '2026-01-15 13:45:23.127', 
    source: 'PLC-CURVE-GEN-3B', 
    entityId: 'CURVE-GEN-3B', 
    parameter: 'spindle_temp', 
    value: '68.5', 
    unit: '°C', 
    status: 'valid',
    ingestionTime: '2026-01-15 13:45:23.145',
    dataType: 'numeric',
  },
  { 
    id: 3, 
    timestamp: '2026-01-15 13:45:23.127', 
    source: 'PLC-CURVE-GEN-3B', 
    entityId: 'CURVE-GEN-3B', 
    parameter: 'vibration_x', 
    value: '0.024', 
    unit: 'mm/s', 
    status: 'warning',
    ingestionTime: '2026-01-15 13:45:23.148',
    dataType: 'numeric',
  },
  { 
    id: 4, 
    timestamp: '2026-01-15 13:45:22.891', 
    source: 'MES-PRODUCTION', 
    entityId: 'WO-2024-1156', 
    parameter: 'workorder_status', 
    value: 'RUNNING', 
    unit: '-', 
    status: 'valid',
    ingestionTime: '2026-01-15 13:45:22.905',
    dataType: 'string',
  },
  { 
    id: 5, 
    timestamp: '2026-01-15 13:45:22.891', 
    source: 'MES-PRODUCTION', 
    entityId: 'WO-2024-1156', 
    parameter: 'units_completed', 
    value: '112', 
    unit: 'units', 
    status: 'valid',
    ingestionTime: '2026-01-15 13:45:22.908',
    dataType: 'numeric',
  },
  { 
    id: 6, 
    timestamp: '2026-01-15 13:45:21.456', 
    source: 'QC-VISION-SYSTEM', 
    entityId: 'INSPECT-01', 
    parameter: 'defect_count', 
    value: 'null', 
    unit: 'count', 
    status: 'missing',
    ingestionTime: '2026-01-15 13:45:21.489',
    dataType: 'numeric',
  },
  { 
    id: 7, 
    timestamp: '2026-01-15 13:45:20.234', 
    source: 'MAINTENANCE-CMMS', 
    entityId: 'MWO-2401-089', 
    parameter: 'job_status', 
    value: 'IN_PROGRESS', 
    unit: '-', 
    status: 'valid',
    ingestionTime: '2026-01-15 13:45:20.267',
    dataType: 'string',
  },
  { 
    id: 8, 
    timestamp: '2026-01-15 13:45:20.234', 
    source: 'MAINTENANCE-CMMS', 
    entityId: 'MWO-2401-089', 
    parameter: 'technician_id', 
    value: 'TECH-0024', 
    unit: '-', 
    status: 'valid',
    ingestionTime: '2026-01-15 13:45:20.270',
    dataType: 'string',
  },
  { 
    id: 9, 
    timestamp: '2026-01-15 13:45:19.782', 
    source: 'PLC-POLISHING-7A', 
    entityId: 'POLISHING-7A', 
    parameter: 'coolant_flow', 
    value: '4.8', 
    unit: 'L/min', 
    status: 'out_of_range',
    ingestionTime: '2026-01-15 13:45:19.823',
    dataType: 'numeric',
  },
  { 
    id: 10, 
    timestamp: '2026-01-15 13:45:18.012', 
    source: 'STORE-INVENTORY', 
    entityId: 'PART-BRG-2145', 
    parameter: 'stock_level', 
    value: '3', 
    unit: 'units', 
    status: 'valid',
    ingestionTime: '2026-01-15 13:45:18.067',
    dataType: 'numeric',
  },
];

// AI chat messages
const sampleChatMessages = [
  {
    id: 1,
    role: 'user',
    content: 'What does the vibration_x parameter represent?',
    timestamp: '13:46',
  },
  {
    id: 2,
    role: 'assistant',
    content: `**Parameter Definition: vibration_x**

**Description:**
Horizontal (X-axis) vibration measurement from the spindle accelerometer on curve generating machines.

**Technical Details:**
• **Measurement**: Vibration velocity in mm/s
• **Sensor**: Triaxial accelerometer mounted on spindle housing
• **Sampling rate**: 1 Hz (continuous monitoring)
• **Normal range**: 0.010 - 0.020 mm/s
• **Warning threshold**: > 0.020 mm/s
• **Alarm threshold**: > 0.030 mm/s

**Current Status:**
The selected record shows **0.024 mm/s** which exceeds the normal range, triggering a WARNING status. This indicates elevated vibration that may suggest:
- Bearing wear or misalignment
- Spindle imbalance
- Loose mounting components

**Data Source:**
PLC-CURVE-GEN-3B • Collected every second • Direct machine sensor feed

**Recommendation:** Monitor trend. If sustained above 0.025 mm/s for > 15 minutes, schedule bearing inspection.`,
    timestamp: '13:46',
  },
];

// Column visibility state
interface ColumnVisibility {
  timestamp: boolean;
  source: boolean;
  entityId: boolean;
  parameter: boolean;
  value: boolean;
  unit: boolean;
  status: boolean;
}

export function RawDataExplorer({ sidebarCollapsed, onNavigate }: RawDataExplorerProps) {
  const [dataDomain, setDataDomain] = useState('machine');
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);
  const [messages, setMessages] = useState(sampleChatMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    timestamp: true,
    source: true,
    entityId: true,
    parameter: true,
    value: true,
    unit: true,
    status: true,
  });

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        role: 'user' as const,
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
    }
  };

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const selectedRecordData = rawDataRecords.find(r => r.id === selectedRecord);

  // Data quality summary
  const dataQualityStats = {
    total: rawDataRecords.length,
    valid: rawDataRecords.filter(r => r.status === 'valid').length,
    warning: rawDataRecords.filter(r => r.status === 'warning').length,
    error: rawDataRecords.filter(r => r.status === 'out_of_range').length,
    missing: rawDataRecords.filter(r => r.status === 'missing').length,
  };

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-hidden transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex">
        {/* Main Data Explorer Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 pb-4 border-b border-white/10">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-semibold text-white">Raw Data Explorer</h2>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Engineering Tool
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">
                  Inspect, verify, and understand raw operational data streams
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white"
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Columns
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
                <Button 
                  size="sm" 
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Data Domain Selection */}
            <Tabs value={dataDomain} onValueChange={setDataDomain} className="mb-4">
              <TabsList className="grid w-full grid-cols-5 bg-[#141b2e]">
                <TabsTrigger 
                  value="production" 
                  className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]"
                >
                  Production
                </TabsTrigger>
                <TabsTrigger 
                  value="machine" 
                  className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]"
                >
                  Machine
                </TabsTrigger>
                <TabsTrigger 
                  value="quality" 
                  className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]"
                >
                  Quality Control
                </TabsTrigger>
                <TabsTrigger 
                  value="store" 
                  className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]"
                >
                  Store / Inventory
                </TabsTrigger>
                <TabsTrigger 
                  value="maintenance" 
                  className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]"
                >
                  Maintenance
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter Controls */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {/* Time Range */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                      Time Range
                    </label>
                    <Select defaultValue="1h">
                      <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e293b] border-white/10">
                        <SelectItem value="5m" className="text-white">Last 5 min</SelectItem>
                        <SelectItem value="1h" className="text-white">Last 1 hour</SelectItem>
                        <SelectItem value="24h" className="text-white">Last 24 hours</SelectItem>
                        <SelectItem value="custom" className="text-white">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Production Line */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                      Production Line
                    </label>
                    <Select defaultValue="all">
                      <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e293b] border-white/10">
                        <SelectItem value="all" className="text-white">All Lines</SelectItem>
                        <SelectItem value="rx1" className="text-white">Rx1 Surfacing</SelectItem>
                        <SelectItem value="rx2" className="text-white">Rx2 Coating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Station / Machine */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                      Station / Machine
                    </label>
                    <Select defaultValue="all">
                      <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e293b] border-white/10">
                        <SelectItem value="all" className="text-white">All Machines</SelectItem>
                        <SelectItem value="curve-gen-3b" className="text-white">CURVE-GEN-3B</SelectItem>
                        <SelectItem value="polishing-7a" className="text-white">POLISHING-7A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data Source */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                      Data Source
                    </label>
                    <Select defaultValue="all">
                      <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e293b] border-white/10">
                        <SelectItem value="all" className="text-white">All Sources</SelectItem>
                        <SelectItem value="plc" className="text-white">PLC Systems</SelectItem>
                        <SelectItem value="mes" className="text-white">MES</SelectItem>
                        <SelectItem value="cmms" className="text-white">CMMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Record Type */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                      Record Type
                    </label>
                    <Select defaultValue="all">
                      <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e293b] border-white/10">
                        <SelectItem value="all" className="text-white">All Types</SelectItem>
                        <SelectItem value="sensor" className="text-white">Sensor Data</SelectItem>
                        <SelectItem value="event" className="text-white">Events</SelectItem>
                        <SelectItem value="status" className="text-white">Status Updates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Parameter, entity..."
                        className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 h-9 pl-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Data Quality Summary */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400">Data Quality:</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-slate-300">{dataQualityStats.valid} Valid</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span className="text-slate-300">{dataQualityStats.warning} Warning</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-400" />
                      <span className="text-slate-300">{dataQualityStats.error} Error</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Info className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-300">{dataQualityStats.missing} Missing</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    Showing {dataQualityStats.total} records • Last updated: 13:45:23
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Column Settings Dropdown */}
            {showColumnSettings && (
              <Card className="bg-[#141b2e] border-white/10 mt-3">
                <CardContent className="pt-4">
                  <p className="text-xs font-medium text-slate-400 uppercase mb-3">Column Visibility</p>
                  <div className="grid grid-cols-7 gap-3">
                    {Object.entries(columnVisibility).map(([col, visible]) => (
                      <div key={col} className="flex items-center gap-2">
                        <Switch checked={visible} onCheckedChange={() => toggleColumn(col as keyof ColumnVisibility)} />
                        <span className="text-xs text-slate-300 capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Raw Data Table */}
          <div className="flex-1 overflow-hidden p-6 pt-4">
            <Card className="bg-[#141b2e] border-white/10 h-full flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#1e293b] sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left border-b border-white/10">
                          <button className="flex items-center gap-1 text-slate-400 hover:text-white font-medium uppercase text-xs">
                            <ArrowUpDown className="w-3 h-3" />
                            #
                          </button>
                        </th>
                        {columnVisibility.timestamp && (
                          <th className="px-3 py-2 text-left border-b border-white/10">
                            <button className="flex items-center gap-1 text-slate-400 hover:text-white font-medium uppercase text-xs">
                              <ArrowUpDown className="w-3 h-3" />
                              Timestamp
                            </button>
                          </th>
                        )}
                        {columnVisibility.source && (
                          <th className="px-3 py-2 text-left border-b border-white/10">
                            <button className="flex items-center gap-1 text-slate-400 hover:text-white font-medium uppercase text-xs">
                              <ArrowUpDown className="w-3 h-3" />
                              Source System
                            </button>
                          </th>
                        )}
                        {columnVisibility.entityId && (
                          <th className="px-3 py-2 text-left border-b border-white/10">
                            <button className="flex items-center gap-1 text-slate-400 hover:text-white font-medium uppercase text-xs">
                              <ArrowUpDown className="w-3 h-3" />
                              Entity ID
                            </button>
                          </th>
                        )}
                        {columnVisibility.parameter && (
                          <th className="px-3 py-2 text-left border-b border-white/10">
                            <button className="flex items-center gap-1 text-slate-400 hover:text-white font-medium uppercase text-xs">
                              <ArrowUpDown className="w-3 h-3" />
                              Parameter
                            </button>
                          </th>
                        )}
                        {columnVisibility.value && (
                          <th className="px-3 py-2 text-left border-b border-white/10">
                            <button className="flex items-center gap-1 text-slate-400 hover:text-white font-medium uppercase text-xs">
                              <ArrowUpDown className="w-3 h-3" />
                              Raw Value
                            </button>
                          </th>
                        )}
                        {columnVisibility.unit && (
                          <th className="px-3 py-2 text-left border-b border-white/10">
                            <button className="flex items-center gap-1 text-slate-400 hover:text-white font-medium uppercase text-xs">
                              Unit
                            </button>
                          </th>
                        )}
                        {columnVisibility.status && (
                          <th className="px-3 py-2 text-center border-b border-white/10">
                            <span className="text-slate-400 font-medium uppercase text-xs">
                              Status
                            </span>
                          </th>
                        )}
                        <th className="px-3 py-2 text-center border-b border-white/10">
                          <span className="text-slate-400 font-medium uppercase text-xs">
                            Actions
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {rawDataRecords.map((record) => (
                        <tr 
                          key={record.id} 
                          className={`border-b border-white/10 hover:bg-[#1e293b] cursor-pointer transition-colors ${
                            selectedRecord === record.id ? 'bg-cyan-500/10' : ''
                          }`}
                          onClick={() => setSelectedRecord(record.id === selectedRecord ? null : record.id)}
                        >
                          <td className="px-3 py-2 text-slate-400">{record.id}</td>
                          {columnVisibility.timestamp && (
                            <td className="px-3 py-2 text-slate-300">{record.timestamp}</td>
                          )}
                          {columnVisibility.source && (
                            <td className="px-3 py-2">
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono text-xs">
                                {record.source}
                              </Badge>
                            </td>
                          )}
                          {columnVisibility.entityId && (
                            <td className="px-3 py-2 text-cyan-400 font-medium">{record.entityId}</td>
                          )}
                          {columnVisibility.parameter && (
                            <td className="px-3 py-2 text-white">{record.parameter}</td>
                          )}
                          {columnVisibility.value && (
                            <td className="px-3 py-2 text-slate-300 font-semibold">{record.value}</td>
                          )}
                          {columnVisibility.unit && (
                            <td className="px-3 py-2 text-slate-400">{record.unit}</td>
                          )}
                          {columnVisibility.status && (
                            <td className="px-3 py-2 text-center">
                              {record.status === 'valid' && (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Valid
                                </Badge>
                              )}
                              {record.status === 'warning' && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Warning
                                </Badge>
                              )}
                              {record.status === 'out_of_range' && (
                                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Error
                                </Badge>
                              )}
                              {record.status === 'missing' && (
                                <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/50 text-xs">
                                  <Info className="w-3 h-3 mr-1" />
                                  Missing
                                </Badge>
                              )}
                            </td>
                          )}
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecord(record.id);
                                }}
                              >
                                <FileJson className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Record Detail Panel (when row selected) */}
                {selectedRecordData && (
                  <div className="border-t border-white/10 bg-[#0a0f1e] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">Record Detail & Metadata</h4>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-slate-400 hover:text-white"
                        onClick={() => setSelectedRecord(null)}
                      >
                        Close
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Left: Raw Record */}
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                          Raw Record (JSON)
                        </label>
                        <div className="p-3 bg-[#141b2e] border border-white/10 rounded-lg font-mono text-xs">
                          <pre className="text-slate-300 whitespace-pre-wrap">
{`{
  "timestamp": "${selectedRecordData.timestamp}",
  "source": "${selectedRecordData.source}",
  "entityId": "${selectedRecordData.entityId}",
  "parameter": "${selectedRecordData.parameter}",
  "value": ${selectedRecordData.value === 'null' ? 'null' : `"${selectedRecordData.value}"`},
  "unit": "${selectedRecordData.unit}",
  "dataType": "${selectedRecordData.dataType}",
  "status": "${selectedRecordData.status}"
}`}
                          </pre>
                        </div>
                      </div>

                      {/* Right: Metadata */}
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                          Ingestion Metadata
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-[#141b2e] border border-white/10 rounded">
                            <span className="text-xs text-slate-400">Record ID</span>
                            <span className="text-xs font-medium text-white">{selectedRecordData.id}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-[#141b2e] border border-white/10 rounded">
                            <span className="text-xs text-slate-400">Ingestion Time</span>
                            <span className="text-xs font-medium text-white">{selectedRecordData.ingestionTime}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-[#141b2e] border border-white/10 rounded">
                            <span className="text-xs text-slate-400">Data Type</span>
                            <span className="text-xs font-medium text-white">{selectedRecordData.dataType}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-[#141b2e] border border-white/10 rounded">
                            <span className="text-xs text-slate-400">Ingestion Delay</span>
                            <span className="text-xs font-medium text-green-400">15ms (healthy)</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-[#141b2e] border border-white/10 rounded">
                            <span className="text-xs text-slate-400">Schema Version</span>
                            <span className="text-xs font-medium text-white">v2.3.1</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-[#141b2e] border border-white/10 rounded">
                            <span className="text-xs text-slate-400">Validation Status</span>
                            {selectedRecordData.status === 'valid' ? (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Passed
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Flagged
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - AI Data Inspection Assistant */}
        <div className="w-96 border-l border-white/10 bg-[#0f1623] flex flex-col">
          {/* Assistant Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Data Inspection Assistant</h3>
                <p className="text-xs text-slate-400">
                  Explain and validate raw data
                </p>
              </div>
            </div>

            {/* Quick Context */}
            <div className="p-3 bg-[#141b2e] border border-white/10 rounded-lg">
              <p className="text-xs text-slate-400 mb-2">Current Context:</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                  Machine Data
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                  Last 1 hour
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                  10 records
                </Badge>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-2">
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-slate-700' : 'bg-purple-500/20'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-3 h-3 text-slate-300" />
                    ) : (
                      <Bot className="w-3 h-3 text-purple-400" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <span className="text-xs text-slate-500">{message.timestamp}</span>
                    </div>

                    {/* User Message */}
                    {message.role === 'user' && (
                      <div className="text-xs text-slate-300 bg-[#1e293b] p-2 rounded-lg">
                        {message.content}
                      </div>
                    )}

                    {/* Assistant Message */}
                    {message.role === 'assistant' && (
                      <div className="text-xs text-slate-300 bg-[#141b2e] border border-white/10 p-3 rounded-lg">
                        <div className="whitespace-pre-line leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Chat Input Area */}
          <div className="p-4 border-t border-white/10">
            {/* Suggested Questions */}
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-2">Ask about:</p>
              <div className="space-y-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                  onClick={() => setInputMessage('Why is this value missing?')}
                >
                  <Info className="w-3 h-3 mr-1" />
                  Missing values
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                  onClick={() => setInputMessage('Show similar records')}
                >
                  <Search className="w-3 h-3 mr-1" />
                  Similar records
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                  onClick={() => setInputMessage('Is this data consistent?')}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Data consistency
                </Button>
              </div>
            </div>

            {/* Input Field */}
            <div className="flex items-end gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about data fields, validation..."
                className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 text-xs h-9"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-purple-500 hover:bg-purple-600 text-white h-9 px-3"
                size="sm"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              AI-powered data inspection
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
