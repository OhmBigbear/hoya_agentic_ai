import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sparkles,
  Send,
  AlertTriangle,
  Clock,
  Wrench,
  Package,
  CheckCircle,
  Timer,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Activity,
  BarChart3,
  History,
  Search,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';

interface StationMaintenanceTrackingProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

// Mock data for maintenance workorders
const maintenanceWorkorders = [
  {
    id: 'MWO-2401-045',
    machine: 'CURVE-GEN-3B',
    station: 'CURVE GENERATING',
    type: 'CM',
    status: 'In Progress',
    technician: 'Lee Min-ho',
    team: 'Team A',
    startTime: '08:45',
    elapsed: '2h 15m',
    estimated: '4h 30m',
    spareParts: 'Available',
    priority: 'Critical',
    progress: 50,
    issue: 'Spindle bearing failure',
  },
  {
    id: 'MWO-2401-042',
    machine: 'POLISHING-7A',
    station: 'POLISHING',
    type: 'PdM',
    status: 'Waiting for Parts',
    technician: 'Kim Ji-won',
    team: 'Team B',
    startTime: '06:30',
    elapsed: '4h 30m',
    estimated: '—',
    spareParts: 'Delayed',
    priority: 'High',
    progress: 25,
    issue: 'Predictive alert: Motor vibration',
  },
  {
    id: 'MWO-2401-048',
    machine: 'LASER-ENGR-2C',
    station: 'LASER ENGRAVING',
    type: 'PM',
    status: 'In Progress',
    technician: 'Park Seo-jun',
    team: 'Team A',
    startTime: '09:30',
    elapsed: '1h 30m',
    estimated: '2h 00m',
    spareParts: 'Available',
    priority: 'Medium',
    progress: 75,
    issue: 'Scheduled PM - Optics cleaning',
  },
  {
    id: 'MWO-2401-039',
    machine: 'ALLOY-BLK-5B',
    station: 'ALLOY BLOCKING',
    type: 'CM',
    status: 'New',
    technician: 'Unassigned',
    team: '—',
    startTime: '—',
    elapsed: '—',
    estimated: '3h 00m',
    spareParts: 'Available',
    priority: 'Medium',
    progress: 0,
    issue: 'Hydraulic pressure drop',
  },
  {
    id: 'MWO-2401-035',
    machine: 'CURVE-GEN-4A',
    station: 'CURVE GENERATING',
    type: 'PM',
    status: 'Completed',
    technician: 'Choi Da-eun',
    team: 'Team C',
    startTime: '06:00',
    elapsed: '1h 45m',
    estimated: '2h 00m',
    spareParts: 'Available',
    priority: 'Low',
    progress: 100,
    issue: 'Scheduled PM - Filter replacement',
  },
];

// MTTR Trend Data
const mttrTrendData = [
  { week: 'W-4', mttr: 245, target: 180 },
  { week: 'W-3', mttr: 210, target: 180 },
  { week: 'W-2', mttr: 195, target: 180 },
  { week: 'W-1', mttr: 220, target: 180 },
  { week: 'W-Now', mttr: 188, target: 180 },
];

// Maintenance Frequency by Machine
const maintenanceFrequencyData = [
  { machine: 'CURVE-GEN-3B', count: 12 },
  { machine: 'POLISHING-7A', count: 8 },
  { machine: 'LASER-ENGR-2C', count: 6 },
  { machine: 'ALLOY-BLK-5B', count: 5 },
  { machine: 'CURVE-GEN-4A', count: 4 },
  { machine: 'UNBLOCKING-1A', count: 3 },
];

// Delay Reasons Distribution
const delayReasonsData = [
  { reason: 'Spare Parts', value: 42, color: '#ef4444' },
  { reason: 'Manpower', value: 28, color: '#f59e0b' },
  { reason: 'Complexity', value: 18, color: '#8b5cf6' },
  { reason: 'Documentation', value: 12, color: '#06b6d4' },
];

// Machine Maintenance History (for selected machine)
const maintenanceHistory = [
  {
    date: '2026-01-10',
    jobId: 'MWO-2401-032',
    type: 'CM',
    issue: 'Spindle bearing noise',
    duration: '3h 20m',
    technician: 'Lee Min-ho',
    parts: 'Bearing assembly',
  },
  {
    date: '2026-01-05',
    jobId: 'MWO-2401-018',
    type: 'PM',
    issue: 'Scheduled maintenance',
    duration: '1h 50m',
    technician: 'Choi Da-eun',
    parts: 'Filters, Lubricant',
  },
  {
    date: '2025-12-28',
    jobId: 'MWO-2312-145',
    type: 'CM',
    issue: 'Control panel error',
    duration: '2h 10m',
    technician: 'Park Seo-jun',
    parts: 'Control board',
  },
  {
    date: '2025-12-20',
    jobId: 'MWO-2312-112',
    type: 'PdM',
    issue: 'Vibration alert',
    duration: '4h 35m',
    technician: 'Kim Ji-won',
    parts: 'Motor mount, Dampers',
  },
];

// Maintenance Progress Timeline
const progressTimelineData = [
  { step: 'Job Created', time: '08:30', status: 'completed', duration: '15m' },
  { step: 'Technician Assigned', time: '08:45', status: 'completed', duration: '0m' },
  { step: 'Diagnosis', time: '08:45', status: 'completed', duration: '45m' },
  { step: 'Part Retrieval', time: '09:30', status: 'completed', duration: '20m' },
  { step: 'Repair Work', time: '09:50', status: 'in-progress', duration: '1h 10m (ongoing)' },
  { step: 'Testing', time: '—', status: 'pending', duration: '—' },
  { step: 'Completion', time: '—', status: 'pending', duration: '—' },
];

export function StationMaintenanceTracking({ sidebarCollapsed, onNavigate }: StationMaintenanceTrackingProps) {
  const [selectedMachine, setSelectedMachine] = useState('curve-gen-3b');
  const [viewMode, setViewMode] = useState<'focus' | 'compare'>('focus');
  const [expandedRow, setExpandedRow] = useState<string | null>('MWO-2401-045');

  const toggleRowExpansion = (jobId: string) => {
    setExpandedRow(expandedRow === jobId ? null : jobId);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Waiting for Parts':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'New':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Low':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PM':
        return 'Preventive';
      case 'CM':
        return 'Corrective';
      case 'PdM':
        return 'Predictive';
      default:
        return type;
    }
  };

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-auto transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex">
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Station Maintenance Tracking</h2>
              <p className="text-sm text-slate-400">
                Real-time maintenance execution tracking and work progress monitoring
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                <Calendar className="w-4 h-4 mr-1" />
                Today
              </Button>
              <Button
                size="sm"
                className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] font-medium"
              >
                <Wrench className="w-4 h-4 mr-1" />
                New Workorder
              </Button>
            </div>
          </div>

          {/* KPI Snapshot - Maintenance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Open Maintenance Workorders */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-purple-300/80 uppercase">
                  Open Workorders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">8</div>
                <p className="text-xs text-purple-300/60">Active jobs</p>
                <div className="flex items-center gap-1 text-xs text-yellow-400 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>3 overdue</span>
                </div>
              </CardContent>
            </Card>

            {/* In-Progress Jobs */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-blue-300/80 uppercase">
                  In Progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">5</div>
                <p className="text-xs text-blue-300/60">Active repairs</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <Play className="w-3 h-3" />
                  <span>2 started today</span>
                </div>
              </CardContent>
            </Card>

            {/* Average MTTR */}
            <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-cyan-300/80 uppercase">
                  Avg MTTR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">188</div>
                <p className="text-xs text-cyan-300/60">minutes</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-14.5% vs last week</span>
                </div>
              </CardContent>
            </Card>

            {/* Overdue Jobs */}
            <Card className="bg-gradient-to-br from-red-900/40 to-red-950/40 border-red-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-red-300/80 uppercase">
                  Overdue Jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">3</div>
                <p className="text-xs text-red-300/60">Past deadline</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Action required</span>
                </div>
              </CardContent>
            </Card>

            {/* Waiting for Spare Parts */}
            <Card className="bg-gradient-to-br from-orange-900/40 to-orange-950/40 border-orange-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-orange-300/80 uppercase">
                  Waiting for Parts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">2</div>
                <p className="text-xs text-orange-300/60">Machines blocked</p>
                <div className="flex items-center gap-1 text-xs text-orange-400 mt-1">
                  <Package className="w-3 h-3" />
                  <span>Parts on order</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Machine & Station Context */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Production Line */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Production Line
                  </label>
                  <Select defaultValue="rx1-surfacing">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="rx1-surfacing" className="text-white">Rx1 Surfacing</SelectItem>
                      <SelectItem value="rx2-coating" className="text-white">Rx2 Coating</SelectItem>
                      <SelectItem value="rx3-assembly" className="text-white">Rx3 Assembly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Station / Process */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Station / Process
                  </label>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="all" className="text-white">All Stations</SelectItem>
                      <SelectItem value="auto-taping" className="text-white">AUTO TAPING</SelectItem>
                      <SelectItem value="alloy-blocking" className="text-white">ALLOY BLOCKING</SelectItem>
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
                  <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="all" className="text-white">All Machines</SelectItem>
                      <SelectItem value="curve-gen-3b" className="text-white">CURVE-GEN-3B</SelectItem>
                      <SelectItem value="polishing-7a" className="text-white">POLISHING-7A</SelectItem>
                      <SelectItem value="laser-engr-2c" className="text-white">LASER-ENGR-2C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    View Mode
                  </label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setViewMode('focus')}
                      className={viewMode === 'focus' ? 'bg-[#00d4ff] text-[#0a0f1e]' : 'bg-[#1e293b] text-slate-300 border border-white/10'}
                    >
                      Focus
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setViewMode('compare')}
                      className={viewMode === 'compare' ? 'bg-[#00d4ff] text-[#0a0f1e]' : 'bg-[#1e293b] text-slate-300 border border-white/10'}
                    >
                      Compare
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Job ID, Machine..."
                      className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Work Tracking Table */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                Maintenance Workorder Tracking
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Active and recent maintenance jobs with real-time status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4"></th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Job ID</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Machine</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Type</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Status</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Technician</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Start Time</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Elapsed</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">ETA</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Parts Status</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Priority</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceWorkorders.map((job) => (
                      <>
                        <tr
                          key={job.id}
                          className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                          onClick={() => toggleRowExpansion(job.id)}
                        >
                          <td className="py-3 pr-4">
                            {expandedRow === job.id ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm text-cyan-400 font-medium">{job.id}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm text-white font-medium">{job.machine}</span>
                            <p className="text-xs text-slate-400">{job.station}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                              {getTypeLabel(job.type)}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge className={getStatusBadgeClass(job.status)}>
                              {job.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm text-white">{job.technician}</span>
                            <p className="text-xs text-slate-400">{job.team}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm text-slate-300">{job.startTime}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm text-slate-300">{job.elapsed}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-sm text-slate-300">{job.estimated}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              className={
                                job.spareParts === 'Available'
                                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                  : job.spareParts === 'Delayed'
                                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              }
                            >
                              {job.spareParts}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge className={getPriorityBadgeClass(job.priority)}>
                              {job.priority}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden w-20">
                                <div
                                  className={
                                    job.progress === 100
                                      ? 'h-full bg-green-500'
                                      : job.progress > 50
                                      ? 'h-full bg-blue-500'
                                      : 'h-full bg-yellow-500'
                                  }
                                  style={{ width: `${job.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-400 w-10">{job.progress}%</span>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Row Details */}
                        {expandedRow === job.id && (
                          <tr className="bg-[#1e293b]/30">
                            <td colSpan={12} className="py-4 px-6">
                              <div className="space-y-4">
                                {/* Issue Description */}
                                <div>
                                  <h4 className="text-sm font-medium text-white mb-2">Issue Description</h4>
                                  <p className="text-sm text-slate-300">{job.issue}</p>
                                </div>

                                {/* Progress Timeline (for in-progress jobs) */}
                                {job.status === 'In Progress' && (
                                  <div>
                                    <h4 className="text-sm font-medium text-white mb-3">Maintenance Progress Timeline</h4>
                                    <div className="space-y-2">
                                      {progressTimelineData.map((step, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                          <div className="flex flex-col items-center">
                                            <div
                                              className={`w-3 h-3 rounded-full border-2 ${
                                                step.status === 'completed'
                                                  ? 'bg-green-500 border-green-500'
                                                  : step.status === 'in-progress'
                                                  ? 'bg-blue-500 border-blue-500'
                                                  : 'bg-slate-700 border-slate-600'
                                              }`}
                                            ></div>
                                            {index < progressTimelineData.length - 1 && (
                                              <div className="w-0.5 h-8 bg-slate-700"></div>
                                            )}
                                          </div>
                                          <div className="flex-1 pb-6">
                                            <div className="flex items-center justify-between">
                                              <span
                                                className={`text-sm font-medium ${
                                                  step.status === 'completed'
                                                    ? 'text-green-300'
                                                    : step.status === 'in-progress'
                                                    ? 'text-blue-300'
                                                    : 'text-slate-400'
                                                }`}
                                              >
                                                {step.step}
                                              </span>
                                              <div className="flex items-center gap-3 text-xs">
                                                <span className="text-slate-400">{step.time}</span>
                                                <span className="text-slate-500">{step.duration}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-2">
                                  <Button size="sm" variant="outline" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                                    View Details
                                  </Button>
                                  <Button size="sm" variant="outline" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                                    Update Status
                                  </Button>
                                  {job.status === 'New' && (
                                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                                      Assign Technician
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* MTTR Trend */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Timer className="w-5 h-5 text-cyan-400" />
                  MTTR Trend Analysis
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Mean Time To Repair - Last 5 weeks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={mttrTrendData}>
                    <defs>
                      <linearGradient id="mttrGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="mttr"
                      stroke="#06b6d4"
                      fill="url(#mttrGradient)"
                      name="MTTR (min)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#22c55e"
                      strokeDasharray="5 5"
                      name="Target"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Delay Reasons Distribution */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  Maintenance Delay Reasons
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Root cause distribution - Last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={delayReasonsData}
                        dataKey="value"
                        nameKey="reason"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={false}
                      >
                        {delayReasonsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 flex-1">
                    {delayReasonsData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-sm text-slate-300">{item.reason}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Frequency by Machine */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Maintenance Frequency by Machine
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Number of maintenance jobs - Last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={maintenanceFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="machine" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]}>
                    {maintenanceFrequencyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 10 ? '#ef4444' : entry.count > 6 ? '#f59e0b' : '#a855f7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Machine Maintenance History */}
          {selectedMachine !== 'all' && (
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  Maintenance History - {selectedMachine.toUpperCase()}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Recent maintenance records and repair actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceHistory.map((record, index) => (
                    <div key={index} className="p-4 bg-slate-800/30 rounded-lg border border-white/5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-cyan-400">{record.jobId}</span>
                            <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                              {getTypeLabel(record.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-white mb-1">{record.issue}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {record.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {record.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {record.technician}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 mb-1">Parts Used</div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            {record.parts}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - AI Maintenance Assistant */}
        <div className="w-96 border-l border-white/10 bg-[#0f1623] p-6 overflow-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Maintenance Assistant</h3>
              <p className="text-xs text-slate-400">AI-powered support</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="space-y-4 mb-6">
            {/* Current Status Summary */}
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">Current Status Summary</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    CURVE-GEN-3B is currently undergoing corrective maintenance for spindle bearing failure. Work started at 08:45 and is 50% complete.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Technician:</span>
                      <span className="text-white">Lee Min-ho (Team A)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Elapsed Time:</span>
                      <span className="text-white">2h 15m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ETA:</span>
                      <span className="text-green-400">~2h 15m remaining</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delay Alert */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-300 mb-2">Spare Parts Delay Alert</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    POLISHING-7A maintenance is blocked. Motor replacement part (PN: MT-4582) is delayed. Expected arrival: Tomorrow 14:00.
                  </p>
                  <div className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400">Job ID:</span>
                      <span className="text-cyan-400">MWO-2401-042</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Waiting Time:</span>
                      <span className="text-red-400">4h 30m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance History Insight */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <History className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">Recurring Issue Detected</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    CURVE-GEN-3B has experienced similar spindle bearing issues 3 times in the past 60 days. Root cause may be excessive vibration or contamination.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Last Occurrence:</span>
                      <span className="text-white">Jan 10, 2026</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Avg Interval:</span>
                      <span className="text-yellow-400">~20 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Recommendation:</span>
                      <span className="text-green-400">Schedule PdM analysis</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Predictive Maintenance Recommendation */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-purple-300 mb-2">Predictive Maintenance Alert</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    LASER-ENGR-2C is showing elevated vibration levels. AI model predicts potential failure within 72 hours. Consider scheduling preventive maintenance.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                        87%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Recommended Action:</span>
                      <span className="text-green-400">Schedule PdM within 48h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Availability */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-green-300 mb-2">Technician Availability</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Team C is currently available for new assignments. Team A and Team B are at 80% capacity.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Team A (4 techs):</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500" style={{ width: '80%' }}></div>
                        </div>
                        <span className="text-yellow-400">80%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Team B (3 techs):</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500" style={{ width: '80%' }}></div>
                        </div>
                        <span className="text-yellow-400">80%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Team C (3 techs):</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '20%' }}></div>
                        </div>
                        <span className="text-green-400">20%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MTTR Performance */}
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Timer className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">MTTR Performance Update</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Average MTTR improved to 188 minutes this week, down 14.5% from last week. Great progress toward the 180-minute target.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current:</span>
                      <span className="text-cyan-400 font-semibold">188 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target:</span>
                      <span className="text-green-400">180 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Gap:</span>
                      <span className="text-yellow-400">-8 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-white/10 pt-4">
            <label className="text-xs text-slate-400 uppercase mb-2 block">
              Ask Maintenance Assistant
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g., Show past failures for this machine"
                className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 text-sm"
              />
              <Button
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-600 text-white flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Ask about job status, delays, history, or technician availability
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
