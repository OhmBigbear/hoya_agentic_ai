import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sparkles,
  Send,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Wrench,
  Activity,
  BarChart3,
  Users,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, Cell, PieChart, Pie } from 'recharts';

interface StationMaintenanceAnalysisProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

// MTTR by Machine comparison data
const mttrByMachineData = [
  { machine: 'CURVE-GEN-3B', mttr: 245, status: 'high' },
  { machine: 'POLISHING-7A', mttr: 210, status: 'high' },
  { machine: 'LASER-ENGR-2C', mttr: 165, status: 'normal' },
  { machine: 'ALLOY-BLK-5B', mttr: 152, status: 'normal' },
  { machine: 'CURVE-GEN-4A', mttr: 138, status: 'good' },
  { machine: 'UNBLOCKING-1A', mttr: 125, status: 'good' },
];

// MTBF by Machine comparison data
const mtbfByMachineData = [
  { machine: 'UNBLOCKING-1A', mtbf: 720, status: 'good' },
  { machine: 'CURVE-GEN-4A', mtbf: 580, status: 'good' },
  { machine: 'ALLOY-BLK-5B', mtbf: 485, status: 'normal' },
  { machine: 'LASER-ENGR-2C', mtbf: 420, status: 'normal' },
  { machine: 'POLISHING-7A', mtbf: 285, status: 'low' },
  { machine: 'CURVE-GEN-3B', mtbf: 245, status: 'low' },
];

// Maintenance frequency data
const maintenanceFrequencyData = [
  { machine: 'CURVE-GEN-3B', pm: 8, cm: 12, pdm: 3, total: 23 },
  { machine: 'POLISHING-7A', pm: 6, cm: 10, pdm: 2, total: 18 },
  { machine: 'LASER-ENGR-2C', pm: 7, cm: 5, pdm: 1, total: 13 },
  { machine: 'ALLOY-BLK-5B', pm: 5, cm: 6, pdm: 1, total: 12 },
  { machine: 'CURVE-GEN-4A', pm: 6, cm: 4, pdm: 1, total: 11 },
  { machine: 'UNBLOCKING-1A', pm: 4, cm: 3, pdm: 0, total: 7 },
];

// Technician performance data
const technicianPerformanceData = [
  { name: 'Lee Min-ho', jobs: 28, avgTime: 165, efficiency: 92, team: 'Team A' },
  { name: 'Kim Ji-won', jobs: 24, avgTime: 185, efficiency: 88, team: 'Team B' },
  { name: 'Park Seo-jun', jobs: 26, avgTime: 172, efficiency: 90, team: 'Team A' },
  { name: 'Choi Da-eun', jobs: 22, avgTime: 155, efficiency: 94, team: 'Team C' },
  { name: 'Jung Hae-in', jobs: 20, avgTime: 195, efficiency: 85, team: 'Team B' },
];

// MTTR Trend over time
const mttrTrendData = [
  { period: 'W-8', mttr: 225, target: 180 },
  { period: 'W-7', mttr: 218, target: 180 },
  { period: 'W-6', mttr: 212, target: 180 },
  { period: 'W-5', mttr: 205, target: 180 },
  { period: 'W-4', mttr: 198, target: 180 },
  { period: 'W-3', mttr: 192, target: 180 },
  { period: 'W-2', mttr: 188, target: 180 },
  { period: 'W-1', mttr: 182, target: 180 },
  { period: 'Now', mttr: 175, target: 180 },
];

// MTBF Trend over time
const mtbfTrendData = [
  { period: 'W-8', mtbf: 380, target: 480 },
  { period: 'W-7', mtbf: 395, target: 480 },
  { period: 'W-6', mtbf: 410, target: 480 },
  { period: 'W-5', mtbf: 425, target: 480 },
  { period: 'W-4', mtbf: 438, target: 480 },
  { period: 'W-3', mtbf: 452, target: 480 },
  { period: 'W-2', mtbf: 465, target: 480 },
  { period: 'W-1', mtbf: 472, target: 480 },
  { period: 'Now', mtbf: 485, target: 480 },
];

// Failure type distribution
const failureTypeData = [
  { type: 'Mechanical', count: 42, color: '#ef4444' },
  { type: 'Electrical', count: 28, color: '#f59e0b' },
  { type: 'Software', count: 15, color: '#8b5cf6' },
  { type: 'Sensor', count: 12, color: '#06b6d4' },
  { type: 'Other', count: 8, color: '#64748b' },
];

// Downtime by station
const downtimeByStationData = [
  { station: 'CURVE GENERATING', hours: 28.5 },
  { station: 'POLISHING', hours: 22.3 },
  { station: 'LASER ENGRAVING', hours: 15.8 },
  { station: 'ALLOY BLOCKING', hours: 12.4 },
  { station: 'AUTO TAPING', hours: 8.2 },
  { station: 'UNBLOCKING', hours: 5.6 },
];

// Machine performance ranking (combined metrics)
const machineRankingData = [
  { rank: 1, machine: 'UNBLOCKING-1A', score: 94, mttr: 125, mtbf: 720, reliability: 'Excellent' },
  { rank: 2, machine: 'CURVE-GEN-4A', score: 88, mttr: 138, mtbf: 580, reliability: 'Good' },
  { rank: 3, machine: 'ALLOY-BLK-5B', score: 82, mttr: 152, mtbf: 485, reliability: 'Good' },
  { rank: 4, machine: 'LASER-ENGR-2C', score: 75, mttr: 165, mtbf: 420, reliability: 'Fair' },
  { rank: 5, machine: 'POLISHING-7A', score: 62, mttr: 210, mtbf: 285, reliability: 'Poor' },
  { rank: 6, machine: 'CURVE-GEN-3B', score: 58, mttr: 245, mtbf: 245, reliability: 'Poor' },
];

export function StationMaintenanceAnalysis({ sidebarCollapsed, onNavigate }: StationMaintenanceAnalysisProps) {
  const [viewMode, setViewMode] = useState<'focus' | 'compare'>('compare');
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [timeRange, setTimeRange] = useState('last-30-days');

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
              <h2 className="text-2xl font-semibold text-white mb-1">Maintenance Analysis</h2>
              <p className="text-sm text-slate-400">
                Comprehensive maintenance intelligence, reliability analysis, and performance optimization
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                <Calendar className="w-4 h-4 mr-1" />
                Export Report
              </Button>
              <Button
                size="sm"
                className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] font-medium"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI Insights
              </Button>
            </div>
          </div>

          {/* KPI Snapshot - Maintenance Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Average MTTR */}
            <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-cyan-300/80 uppercase">
                  Avg MTTR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">175</div>
                <p className="text-xs text-cyan-300/60">minutes</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-3.8% vs last week</span>
                </div>
              </CardContent>
            </Card>

            {/* MTBF */}
            <Card className="bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-green-300/80 uppercase">
                  MTBF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">485</div>
                <p className="text-xs text-green-300/60">hours</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2.8% vs last week</span>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Compliance */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-blue-300/80 uppercase">
                  PM Compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">94.2%</div>
                <p className="text-xs text-blue-300/60">On-time PM</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Above target (90%)</span>
                </div>
              </CardContent>
            </Card>

            {/* Repeat Failure Rate */}
            <Card className="bg-gradient-to-br from-orange-900/40 to-orange-950/40 border-orange-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-orange-300/80 uppercase">
                  Repeat Failures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">18.5%</div>
                <p className="text-xs text-orange-300/60">Within 30 days</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2.1% vs last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Backlog */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-purple-300/80 uppercase">
                  Backlog
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">12</div>
                <p className="text-xs text-purple-300/60">Pending jobs</p>
                <div className="flex items-center gap-1 text-xs text-yellow-400 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>5 overdue</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Machine & Station Selection */}
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

                {/* Time Range */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Time Range
                  </label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="last-7-days" className="text-white">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days" className="text-white">Last 30 Days</SelectItem>
                      <SelectItem value="last-90-days" className="text-white">Last 90 Days</SelectItem>
                      <SelectItem value="custom" className="text-white">Custom Range</SelectItem>
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
              </div>
            </CardContent>
          </Card>

          {/* Machine Performance Ranking Table */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Machine Performance Ranking
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Overall reliability score based on MTTR, MTBF, and failure patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Rank</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Machine</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Score</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">MTTR (min)</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">MTBF (hrs)</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Reliability</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machineRankingData.map((item) => (
                      <tr key={item.rank} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 text-slate-300 font-semibold text-sm">
                            {item.rank}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-white font-medium">{item.machine}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden w-20">
                              <div
                                className={
                                  item.score >= 85
                                    ? 'h-full bg-green-500'
                                    : item.score >= 70
                                    ? 'h-full bg-blue-500'
                                    : 'h-full bg-red-500'
                                }
                                style={{ width: `${item.score}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-white w-8">{item.score}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-slate-300">{item.mttr}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-slate-300">{item.mtbf}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            className={
                              item.reliability === 'Excellent'
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : item.reliability === 'Good'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : item.reliability === 'Fair'
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                : 'bg-red-500/20 text-red-300 border-red-500/30'
                            }
                          >
                            {item.reliability}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                            onClick={() => onNavigate('#station-analysis')}
                          >
                            Analyze
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Performance Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* MTTR by Machine */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  MTTR Comparison by Machine
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Mean Time To Repair (minutes) - Last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={mttrByMachineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis type="category" dataKey="machine" stroke="#94a3b8" style={{ fontSize: '11px' }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="mttr" radius={[0, 4, 4, 0]}>
                      {mttrByMachineData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.status === 'high' ? '#ef4444' :
                            entry.status === 'normal' ? '#f59e0b' :
                            '#22c55e'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* MTBF by Machine */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  MTBF Comparison by Machine
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Mean Time Between Failures (hours) - Last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={mtbfByMachineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis type="category" dataKey="machine" stroke="#94a3b8" style={{ fontSize: '11px' }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="mtbf" radius={[0, 4, 4, 0]}>
                      {mtbfByMachineData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.status === 'good' ? '#22c55e' :
                            entry.status === 'normal' ? '#f59e0b' :
                            '#ef4444'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Frequency Analysis */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Maintenance Frequency by Type
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                PM (Preventive), CM (Corrective), PdM (Predictive) - Last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
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
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="pm" stackId="a" fill="#22c55e" name="PM" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cm" stackId="a" fill="#ef4444" name="CM" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pdm" stackId="a" fill="#8b5cf6" name="PdM" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Technician Performance Analysis */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Technician Performance Analysis
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Workforce efficiency and completion metrics - Last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Technician</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Team</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Jobs Completed</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Avg Time (min)</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Efficiency</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicianPerformanceData.map((tech, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 pr-4">
                          <span className="text-sm text-white font-medium">{tech.name}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                            {tech.team}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-slate-300">{tech.jobs}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-slate-300">{tech.avgTime}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden w-20">
                              <div
                                className={
                                  tech.efficiency >= 90
                                    ? 'h-full bg-green-500'
                                    : tech.efficiency >= 85
                                    ? 'h-full bg-blue-500'
                                    : 'h-full bg-yellow-500'
                                }
                                style={{ width: `${tech.efficiency}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-white w-10">{tech.efficiency}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            className={
                              tech.efficiency >= 90
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : tech.efficiency >= 85
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            }
                          >
                            {tech.efficiency >= 90 ? 'Excellent' : tech.efficiency >= 85 ? 'Good' : 'Fair'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & Trend Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* MTTR Trend */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-400" />
                  MTTR Trend Analysis
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Weekly trend - Last 9 weeks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={mttrTrendData}>
                    <defs>
                      <linearGradient id="mttrTrendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="period" stroke="#94a3b8" style={{ fontSize: '11px' }} />
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
                      fill="url(#mttrTrendGradient)"
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

            {/* MTBF Trend */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  MTBF Trend Analysis
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Weekly trend - Last 9 weeks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={mtbfTrendData}>
                    <defs>
                      <linearGradient id="mtbfTrendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="period" stroke="#94a3b8" style={{ fontSize: '11px' }} />
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
                      dataKey="mtbf"
                      stroke="#22c55e"
                      fill="url(#mtbfTrendGradient)"
                      name="MTBF (hrs)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                      name="Target"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Failure Type Distribution */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  Failure Type Distribution
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Root cause breakdown - Last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={failureTypeData}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={false}
                      >
                        {failureTypeData.map((entry, index) => (
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
                    {failureTypeData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-sm text-slate-300">{item.type}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Downtime by Station */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-400" />
                  Downtime by Station
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Total maintenance downtime hours - Last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={downtimeByStationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="station" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="hours" fill="#ef4444" radius={[4, 4, 0, 0]}>
                      {downtimeByStationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.hours > 20 ? '#ef4444' : entry.hours > 10 ? '#f59e0b' : '#22c55e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar - AI Maintenance Intelligence */}
        <div className="w-96 border-l border-white/10 bg-[#0f1623] p-6 overflow-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Maintenance Intelligence</h3>
              <p className="text-xs text-slate-400">AI-powered insights & analysis</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="space-y-4 mb-6">
            {/* Performance Improvement Alert */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-green-300 mb-2">Performance Improving</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    MTTR has decreased by 22% over the past 8 weeks, from 225 minutes to 175 minutes. You're now below the target of 180 minutes.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current MTTR:</span>
                      <span className="text-green-400 font-semibold">175 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target:</span>
                      <span className="text-white">180 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Improvement:</span>
                      <span className="text-green-400 font-semibold">-5 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Machine Alert */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-300 mb-2">Critical Reliability Issue</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    CURVE-GEN-3B has the lowest performance score (58) with MTBF of only 245 hours. This machine requires immediate attention.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">MTBF:</span>
                      <span className="text-red-400 font-semibold">245 hrs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">MTTR:</span>
                      <span className="text-red-400 font-semibold">245 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Failures (30d):</span>
                      <span className="text-red-400 font-semibold">23 events</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                    onClick={() => onNavigate('#station-analysis')}
                  >
                    Investigate Machine
                  </Button>
                </div>
              </div>
            </div>

            {/* Recurring Failure Pattern */}
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-orange-300 mb-2">Recurring Failure Detected</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Mechanical failures account for 40% (42 events) of all failures. Spindle bearing issues are the most common root cause.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mechanical:</span>
                      <span className="text-red-400">42 events</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Electrical:</span>
                      <span className="text-orange-400">28 events</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Software:</span>
                      <span className="text-yellow-400">15 events</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Performance Insight */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">Top Performer Recognition</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Choi Da-eun (Team C) achieved 94% efficiency with the lowest average repair time (155 min) across 22 completed jobs.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Efficiency:</span>
                      <span className="text-green-400 font-semibold">94%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Avg Time:</span>
                      <span className="text-cyan-400">155 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Jobs Completed:</span>
                      <span className="text-white">22</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Base Recommendation */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-purple-300 mb-2">Knowledge Base Insight</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    For spindle bearing failures on CURVE-GEN machines, recommended procedure is KB-MNT-045: "Precision Bearing Replacement Protocol".
                  </p>
                  <div className="text-xs text-slate-400 mb-2">
                    This procedure includes alignment verification and vibration testing post-installation.
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                  >
                    View Procedure
                  </Button>
                </div>
              </div>
            </div>

            {/* PM Compliance Success */}
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">PM Compliance Excellent</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Your team achieved 94.2% PM compliance, exceeding the 90% target. This proactive approach is reducing unplanned downtime.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current:</span>
                      <span className="text-green-400 font-semibold">94.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target:</span>
                      <span className="text-white">90.0%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Variance:</span>
                      <span className="text-green-400">+4.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Investigation Recommendation */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-300 mb-2">Investigation Area</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Repeat failure rate increased to 18.5% (+2.1%). Focus investigation on CURVE GENERATING and POLISHING stations.
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current Rate:</span>
                      <span className="text-yellow-400">18.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target:</span>
                      <span className="text-white">&lt; 15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Suggested Action:</span>
                      <span className="text-green-400">Root cause analysis</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-white/10 pt-4">
            <label className="text-xs text-slate-400 uppercase mb-2 block">
              Ask Maintenance Intelligence
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g., Why is MTBF low for CURVE-GEN-3B?"
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
              Ask about KPIs, machine comparisons, failures, or repair procedures
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
