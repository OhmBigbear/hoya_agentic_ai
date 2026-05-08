import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Wrench,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Send,
  Sparkles,
  ArrowRight,
  Gauge,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';

interface WorkorderTrackingProps {
  sidebarCollapsed: boolean;
}

export function WorkorderTracking({ sidebarCollapsed }: WorkorderTrackingProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const workorders = [
    {
      id: 'WO-2025-0124',
      type: 'PM',
      priority: 'Medium',
      equipment: 'POLISHING - Line 3',
      status: 'In Progress',
      operator: 'Mike Chen',
      dueTime: '2h 15m',
      downtime: 45,
      aiFlag: true,
      currentProcess: 'POLISHING',
      productionImpact: '-12 units/hr',
    },
    {
      id: 'WO-2025-0122',
      type: 'CM',
      priority: 'High',
      equipment: 'CURVE GENERATING - Line 1',
      status: 'Assigned',
      operator: 'Sarah Johnson',
      dueTime: 'Overdue 1h',
      downtime: 120,
      aiFlag: true,
      currentProcess: 'CURVE GENERATING',
      productionImpact: '-28 units/hr',
    },
    {
      id: 'WO-2025-0118',
      type: 'PdM',
      priority: 'Critical',
      equipment: 'AUTO TAPING - Line 2',
      status: 'In Progress',
      operator: 'Tom Wilson',
      dueTime: 'Overdue 2.5h',
      downtime: 192,
      aiFlag: true,
      currentProcess: 'AUTO TAPING',
      productionImpact: '-45 units/hr',
    },
    {
      id: 'WO-2025-0115',
      type: 'PM',
      priority: 'Low',
      equipment: 'LASER ENGRAVING - Line 4',
      status: 'Waiting',
      operator: 'Lisa Park',
      dueTime: '4h 30m',
      downtime: 0,
      aiFlag: false,
      currentProcess: 'LASER ENGRAVING',
      productionImpact: '-5 units/hr',
    },
    {
      id: 'WO-2025-0110',
      type: 'CM',
      priority: 'Medium',
      equipment: 'ALLOY BLOCKING - Line 1',
      status: 'New',
      operator: 'Unassigned',
      dueTime: '6h 00m',
      downtime: 15,
      aiFlag: false,
      currentProcess: 'ALLOY BLOCKING',
      productionImpact: '-8 units/hr',
    },
  ];

  const processFlow = [
    { name: 'AUTO TAPING', status: 'completed' },
    { name: 'ALLOY BLOCKING', status: 'completed' },
    { name: 'CURVE GENERATING', status: 'active' },
    { name: 'POLISHING', status: 'pending' },
    { name: 'LASER ENGRAVING', status: 'pending' },
    { name: 'UNBLOCKING', status: 'pending' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PM':
        return <Clock className="w-4 h-4" />;
      case 'CM':
        return <AlertTriangle className="w-4 h-4" />;
      case 'PdM':
        return <Zap className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PM':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CM':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PdM':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Low':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Assigned':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Waiting':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'New':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'Closed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
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
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-1">Workorder Tracking</h2>
            <p className="text-sm text-slate-400">
              Real-time tracking and AI-assisted management of maintenance workorders
            </p>
          </div>

          {/* KPI Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {/* Open Workorders */}
            <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-cyan-300/80 uppercase">
                    Open Workorders
                  </CardDescription>
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">24</div>
                <p className="text-xs text-cyan-300/60">Today</p>
              </CardContent>
            </Card>

            {/* Overdue Workorders */}
            <Card className="bg-gradient-to-br from-red-900/40 to-red-950/40 border-red-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-red-300/80 uppercase">
                    Overdue
                  </CardDescription>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">3</div>
                <p className="text-xs text-red-300/60">Critical priority</p>
              </CardContent>
            </Card>

            {/* Production Rate */}
            <Card className="bg-gradient-to-br from-teal-900/40 to-teal-950/40 border-teal-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-teal-300/80 uppercase">
                    Production Rate
                  </CardDescription>
                  <Gauge className="w-5 h-5 text-teal-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">182</div>
                <p className="text-xs text-teal-300/60">units/hr • -8% vs prev shift</p>
              </CardContent>
            </Card>

            {/* AI Risk Flagged */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-purple-300/80 uppercase">
                    AI Risk Flagged
                  </CardDescription>
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">7</div>
                <p className="text-xs text-purple-300/60">Production impact</p>
              </CardContent>
            </Card>

            {/* Operator Utilization */}
            <Card className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium text-amber-300/80 uppercase">
                    Operator Util.
                  </CardDescription>
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">87%</div>
                <p className="text-xs text-amber-300/60">18/21 active</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search workorders by ID, equipment, or technician..."
                  className="pl-10 bg-[#141b2e] border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <Select defaultValue="all-status">
              <SelectTrigger className="w-40 bg-[#141b2e] border-white/10 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10">
                <SelectItem value="all-status" className="text-white">All Status</SelectItem>
                <SelectItem value="new" className="text-white">New</SelectItem>
                <SelectItem value="assigned" className="text-white">Assigned</SelectItem>
                <SelectItem value="in-progress" className="text-white">In Progress</SelectItem>
                <SelectItem value="waiting" className="text-white">Waiting</SelectItem>
                <SelectItem value="closed" className="text-white">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-stations">
              <SelectTrigger className="w-40 bg-[#141b2e] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10">
                <SelectItem value="all-stations" className="text-white">All Stations</SelectItem>
                <SelectItem value="station-1" className="text-white">Station 1</SelectItem>
                <SelectItem value="station-2" className="text-white">Station 2</SelectItem>
                <SelectItem value="station-3" className="text-white">Station 3</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-priority">
              <SelectTrigger className="w-40 bg-[#141b2e] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10">
                <SelectItem value="all-priority" className="text-white">All Priority</SelectItem>
                <SelectItem value="critical" className="text-white">Critical</SelectItem>
                <SelectItem value="high" className="text-white">High</SelectItem>
                <SelectItem value="medium" className="text-white">Medium</SelectItem>
                <SelectItem value="low" className="text-white">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Workorder Table */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr className="bg-[#1e293b]">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3 w-8"></th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">WO ID</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Type</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Priority</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Equipment</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Technician</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Due / SLA</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Production Impact</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workorders.map((wo, index) => (
                      <>
                        <tr
                          key={wo.id}
                          className="border-b border-white/5 hover:bg-[#1e293b] cursor-pointer transition-colors"
                          onClick={() => toggleRow(wo.id)}
                        >
                          <td className="px-4 py-4">
                            {expandedRow === wo.id ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-white">{wo.id}</span>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={`${getTypeColor(wo.type)} flex items-center gap-1 w-fit`}>
                              {getTypeIcon(wo.type)}
                              {wo.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={getPriorityColor(wo.priority)}>
                              {wo.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-300">{wo.equipment}</span>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={getStatusColor(wo.status)}>
                              {wo.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-slate-300">{wo.operator}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`text-sm ${
                                wo.dueTime.includes('Overdue') ? 'text-red-400 font-medium' : 'text-slate-300'
                              }`}
                            >
                              {wo.dueTime}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-sm font-medium ${
                              parseInt(wo.productionImpact) < -20 ? 'text-red-400' : 
                              parseInt(wo.productionImpact) < -10 ? 'text-orange-400' : 
                              'text-amber-400'
                            }`}>
                              {wo.productionImpact}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {wo.aiFlag && (
                              <Sparkles className="w-4 h-4 text-purple-400" />
                            )}
                          </td>
                        </tr>

                        {/* Expanded Process Drilldown */}
                        {expandedRow === wo.id && (
                          <tr className="bg-[#1e293b]">
                            <td colSpan={10} className="px-4 py-4">
                              <div className="pl-8 pr-4">
                                <div className="mb-3">
                                  <h4 className="text-sm font-medium text-white mb-1">Production Process Flow</h4>
                                  <p className="text-xs text-slate-400">Impact on {wo.equipment}</p>
                                </div>

                                {/* Process Flow Visualization */}
                                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                                  {processFlow.map((process, idx) => (
                                    <div key={idx} className="flex items-center shrink-0">
                                      <div
                                        className={`px-4 py-3 rounded-lg border-2 min-w-[140px] ${
                                          process.status === 'completed'
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : process.status === 'active' && process.name === wo.currentProcess
                                            ? 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/30'
                                            : 'bg-slate-800/50 border-slate-600/30'
                                        }`}
                                      >
                                        <div className="text-xs font-medium text-white mb-1">
                                          {process.name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {process.status === 'completed' && (
                                            <CheckCircle className="w-3 h-3 text-green-400" />
                                          )}
                                          {process.status === 'active' && process.name === wo.currentProcess && (
                                            <div className="flex items-center gap-1">
                                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                              <span className="text-xs text-blue-400">Active</span>
                                            </div>
                                          )}
                                          {process.status === 'pending' && (
                                            <span className="text-xs text-slate-500">Pending</span>
                                          )}
                                        </div>
                                      </div>
                                      {idx < processFlow.length - 1 && (
                                        <ArrowRight className="w-4 h-4 text-slate-600 mx-1" />
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Current Process Details */}
                                <div className="grid grid-cols-4 gap-4">
                                  <div className="bg-[#141b2e] rounded-lg p-3 border border-white/10">
                                    <span className="text-xs text-slate-400">Current Status</span>
                                    <p className="text-sm font-medium text-white mt-1">{wo.status}</p>
                                  </div>
                                  <div className="bg-[#141b2e] rounded-lg p-3 border border-white/10">
                                    <span className="text-xs text-slate-400">Cycle Time</span>
                                    <p className="text-sm font-medium text-white mt-1">{wo.downtime}m</p>
                                  </div>
                                  <div className="bg-[#141b2e] rounded-lg p-3 border border-white/10">
                                    <span className="text-xs text-slate-400">Delay Impact</span>
                                    <p className={`text-sm font-medium mt-1 ${
                                      wo.dueTime.includes('Overdue') ? 'text-red-400' : 'text-green-400'
                                    }`}>
                                      {wo.dueTime.includes('Overdue') ? 'Critical' : 'On Track'}
                                    </p>
                                  </div>
                                  <div className="bg-[#141b2e] rounded-lg p-3 border border-white/10">
                                    <span className="text-xs text-slate-400">Operator</span>
                                    <p className="text-sm font-medium text-white mt-1">{wo.operator}</p>
                                  </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Production Interruption Timeline */}
            <Card className="bg-[#141b2e] border-white/10 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Production Interruption Timeline</CardTitle>
                <CardDescription className="text-xs text-slate-400">Workorder impact on production flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Timeline bars with production impact */}
                  <div className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <span className="text-xs text-slate-400">WO-2025-0118</span>
                      <p className="text-xs text-red-400 font-medium">-45 units/hr</p>
                    </div>
                    <div className="flex-1 h-10 bg-[#1e293b] rounded relative overflow-hidden">
                      <div className="absolute left-[0%] w-[45%] h-full bg-red-500/40 border-l-2 border-red-500 flex flex-col justify-center px-2">
                        <span className="text-xs text-white font-medium">AUTO TAPING</span>
                        <span className="text-xs text-red-300">Critical</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <span className="text-xs text-slate-400">WO-2025-0122</span>
                      <p className="text-xs text-orange-400 font-medium">-28 units/hr</p>
                    </div>
                    <div className="flex-1 h-10 bg-[#1e293b] rounded relative overflow-hidden">
                      <div className="absolute left-[10%] w-[35%] h-full bg-orange-500/40 border-l-2 border-orange-500 flex flex-col justify-center px-2">
                        <span className="text-xs text-white font-medium">CURVE GENERATING</span>
                        <span className="text-xs text-orange-300">Overdue</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <span className="text-xs text-slate-400">WO-2025-0124</span>
                      <p className="text-xs text-amber-400 font-medium">-12 units/hr</p>
                    </div>
                    <div className="flex-1 h-10 bg-[#1e293b] rounded relative overflow-hidden">
                      <div className="absolute left-[30%] w-[30%] h-full bg-blue-500/40 border-l-2 border-blue-500 flex flex-col justify-center px-2">
                        <span className="text-xs text-white font-medium">POLISHING</span>
                        <span className="text-xs text-blue-300">In Progress</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <span className="text-xs text-slate-400">WO-2025-0110</span>
                      <p className="text-xs text-amber-400 font-medium">-8 units/hr</p>
                    </div>
                    <div className="flex-1 h-10 bg-[#1e293b] rounded relative overflow-hidden">
                      <div className="absolute left-[65%] w-[25%] h-full bg-slate-500/40 border-l-2 border-slate-500 flex flex-col justify-center px-2">
                        <span className="text-xs text-white font-medium">ALLOY BLOCKING</span>
                        <span className="text-xs text-slate-300">New</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Production Rate Trend */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Production Rate Trend</CardTitle>
                <CardDescription className="text-xs text-slate-400">Units/hour by shift (today)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">06:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: '95%' }}></div>
                    </div>
                    <span className="text-xs text-white w-14 text-right">198</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">08:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: '48%' }}></div>
                    </div>
                    <span className="text-xs text-red-400 w-14 text-right">152</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">10:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-xs text-white w-14 text-right">176</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">12:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: '90%' }}></div>
                    </div>
                    <span className="text-xs text-white w-14 text-right">195</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">14:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-xs text-white w-14 text-right font-medium">182</span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Avg Rate</span>
                      <span className="text-sm font-medium text-white">182 units/hr</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-red-400">
                      <TrendingDown className="w-3 h-3" />
                      <span>-8% vs previous shift</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Production Loss by Process */}
          <div className="mt-6">
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Production Loss by Process</CardTitle>
                <CardDescription className="text-xs text-slate-400">Impact analysis by production stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                    <span className="text-xs text-slate-400">AUTO TAPING</span>
                    <p className="text-2xl font-bold text-red-400 mt-1">-45</p>
                    <p className="text-xs text-red-300">units/hr</p>
                  </div>
                  <div className="bg-orange-950/30 rounded-lg p-4 border border-orange-800/30">
                    <span className="text-xs text-slate-400">CURVE GENERATING</span>
                    <p className="text-2xl font-bold text-orange-400 mt-1">-28</p>
                    <p className="text-xs text-orange-300">units/hr</p>
                  </div>
                  <div className="bg-amber-950/30 rounded-lg p-4 border border-amber-800/30">
                    <span className="text-xs text-slate-400">POLISHING</span>
                    <p className="text-2xl font-bold text-amber-400 mt-1">-12</p>
                    <p className="text-xs text-amber-300">units/hr</p>
                  </div>
                  <div className="bg-amber-950/30 rounded-lg p-4 border border-amber-800/30">
                    <span className="text-xs text-slate-400">ALLOY BLOCKING</span>
                    <p className="text-2xl font-bold text-amber-400 mt-1">-8</p>
                    <p className="text-xs text-amber-300">units/hr</p>
                  </div>
                  <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                    <span className="text-xs text-slate-400">LASER ENGRAVING</span>
                    <p className="text-2xl font-bold text-green-400 mt-1">-5</p>
                    <p className="text-xs text-green-300">units/hr</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                    <span className="text-xs text-slate-400">UNBLOCKING</span>
                    <p className="text-2xl font-bold text-slate-400 mt-1">0</p>
                    <p className="text-xs text-slate-500">units/hr</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right AI Copilot Panel */}
        <div className="w-96 bg-[#0f1623] border-l border-white/10 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-semibold text-white">AI Maintenance Copilot</h3>
            </div>
            <p className="text-xs text-slate-400">Context-aware assistance for workorder management</p>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* AI Message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="bg-[#1e293b] rounded-lg p-3 border border-white/10">
                  <p className="text-sm text-slate-200">
                    Production rate is reduced by 45 units/hr due to WO-2025-0118 at AUTO TAPING stage. Immediate action recommended to recover throughput.
                  </p>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">2 minutes ago</span>
              </div>
            </div>

            {/* AI Insight Card */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 border-purple-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white">Production Impact: WO-2025-0118</CardTitle>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">High Impact</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-purple-300 font-medium">Current Process Impact</span>
                  <p className="text-sm text-slate-200 mt-1">AUTO TAPING stage delayed 2.5 hours. Downstream CURVE GENERATING and POLISHING stages affected.</p>
                </div>
                <div>
                  <span className="text-xs text-purple-300 font-medium">Recovery Action</span>
                  <p className="text-sm text-slate-200 mt-1">Reassign operator from LASER ENGRAVING to AUTO TAPING. Estimated recovery: +38 units/hr within 30 min.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-300">Confidence</span>
                  <div className="flex-1 h-2 bg-[#1e293b] rounded overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-xs text-white">92%</span>
                </div>
              </CardContent>
            </Card>

            {/* User Message */}
            <div className="flex gap-3 justify-end">
              <div className="flex-1 max-w-[80%]">
                <div className="bg-[#00d4ff]/20 rounded-lg p-3 border border-[#00d4ff]/30">
                  <p className="text-sm text-slate-200">
                    How can we recover production rate?
                  </p>
                </div>
                <span className="text-xs text-slate-500 mt-1 block text-right">Just now</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <p className="text-xs text-slate-400 mb-2">Quick Actions</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Why is this workorder overdue?
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Show similar past failures
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Recommended next action
            </Button>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                placeholder="Ask AI for assistance..."
                className="flex-1 bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500"
              />
              <Button size="icon" className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e]">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}