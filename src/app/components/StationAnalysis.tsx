import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sparkles,
  Send,
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Gauge,
  Target,
  BarChart3,
  Timer,
  Play,
  Pause,
  Ban,
  CheckCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';

interface StationAnalysisProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

export function StationAnalysis({ sidebarCollapsed, onNavigate }: StationAnalysisProps) {
  const [viewMode, setViewMode] = useState<'focus' | 'compare'>('focus');
  const [selectedStation, setSelectedStation] = useState('curve-gen-3b');
  const [selectedMachines, setSelectedMachines] = useState<string[]>(['curve-gen-3b']);

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
            <h2 className="text-2xl font-semibold text-white mb-1">Station Analysis</h2>
            <p className="text-sm text-slate-400">
              Deep-dive performance analysis at station and machine level
            </p>
          </div>

          {/* Station & Machine Selection */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Station Group */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Station Group
                  </label>
                  <Select defaultValue="surfacing">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="surfacing" className="text-white">Surfacing</SelectItem>
                      <SelectItem value="coating" className="text-white">Coating</SelectItem>
                      <SelectItem value="inspection" className="text-white">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Process Stage */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Process Stage
                  </label>
                  <Select defaultValue="curve-generating">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="auto-taping" className="text-white">AUTO TAPING</SelectItem>
                      <SelectItem value="alloy-blocking" className="text-white">ALLOY BLOCKING</SelectItem>
                      <SelectItem value="curve-generating" className="text-white">CURVE GENERATING</SelectItem>
                      <SelectItem value="polishing" className="text-white">POLISHING</SelectItem>
                      <SelectItem value="laser-engraving" className="text-white">LASER ENGRAVING</SelectItem>
                      <SelectItem value="unblocking" className="text-white">UNBLOCKING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Machine Selection */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Machine
                  </label>
                  <Select value={selectedStation} onValueChange={setSelectedStation}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="curve-gen-3a" className="text-white">CURVE GEN 3-A</SelectItem>
                      <SelectItem value="curve-gen-3b" className="text-white">CURVE GEN 3-B</SelectItem>
                      <SelectItem value="curve-gen-3c" className="text-white">CURVE GEN 3-C</SelectItem>
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
                      className={viewMode === 'focus' ? 'bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] flex-1' : 'bg-[#1e293b] hover:bg-[#2a3650] text-slate-300 flex-1'}
                      onClick={() => setViewMode('focus')}
                    >
                      Focus
                    </Button>
                    <Button
                      size="sm"
                      className={viewMode === 'compare' ? 'bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] flex-1' : 'bg-[#1e293b] hover:bg-[#2a3650] text-slate-300 flex-1'}
                      onClick={() => setViewMode('compare')}
                    >
                      Compare
                    </Button>
                  </div>
                </div>
              </div>

              {/* Compare Mode Machine Selection */}
              {viewMode === 'compare' && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Select Machines to Compare
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30">
                      CURVE GEN 3-A
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30">
                      CURVE GEN 3-B (current)
                    </Badge>
                    <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 cursor-pointer hover:bg-slate-500/30">
                      CURVE GEN 3-C
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {/* Cycle Time */}
            <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-cyan-300/80 uppercase">
                  Avg Cycle Time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">142s</div>
                <p className="text-xs text-cyan-300/60">Target: 120s</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18% variance</span>
                </div>
              </CardContent>
            </Card>

            {/* Throughput */}
            <Card className="bg-gradient-to-br from-teal-900/40 to-teal-950/40 border-teal-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-teal-300/80 uppercase">
                  Throughput
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">182</div>
                <p className="text-xs text-teal-300/60">units/hr • Target: 210</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-13% vs target</span>
                </div>
              </CardContent>
            </Card>

            {/* Utilization */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-purple-300/80 uppercase">
                  Utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">72%</div>
                <p className="text-xs text-purple-300/60">Active time</p>
                <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>28% idle/blocked</span>
                </div>
              </CardContent>
            </Card>

            {/* Efficiency */}
            <Card className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-amber-300/80 uppercase">
                  Efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">87%</div>
                <p className="text-xs text-amber-300/60">Performance rate</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2% vs yesterday</span>
                </div>
              </CardContent>
            </Card>

            {/* Production Loss */}
            <Card className="bg-gradient-to-br from-red-900/40 to-red-950/40 border-red-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-red-300/80 uppercase">
                  Production Loss
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">-28</div>
                <p className="text-xs text-red-300/60">units/hr attributed</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Line bottleneck</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Process Timeline */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">Production Process Timeline</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                CURVE GENERATING 3-B • Workorder states over time (last 4 hours)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Timeline Header */}
                <div className="flex items-center gap-3">
                  <div className="w-32 text-xs text-slate-400">Time</div>
                  <div className="flex-1 flex justify-between text-xs text-slate-500">
                    <span>10:00</span>
                    <span>11:00</span>
                    <span>12:00</span>
                    <span>13:00</span>
                    <span>14:00 (Now)</span>
                  </div>
                </div>

                {/* WO-2025-0124 */}
                <div className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <span className="text-xs font-medium text-white">WO-2025-0124</span>
                    <p className="text-xs text-slate-500">Rx Surf - Batch A</p>
                  </div>
                  <div className="flex-1 h-12 bg-[#1e293b] rounded relative overflow-hidden">
                    {/* Active state */}
                    <div className="absolute left-[0%] w-[35%] h-full bg-green-500/40 border-l-2 border-green-500 flex items-center px-2">
                      <Play className="w-3 h-3 text-green-400 mr-1" />
                      <span className="text-xs text-green-300 font-medium">Active</span>
                    </div>
                    {/* Waiting state */}
                    <div className="absolute left-[35%] w-[15%] h-full bg-amber-500/40 border-l-2 border-amber-500 flex items-center px-2">
                      <Pause className="w-3 h-3 text-amber-400 mr-1" />
                      <span className="text-xs text-amber-300 font-medium">Waiting</span>
                    </div>
                    {/* Active state */}
                    <div className="absolute left-[50%] w-[30%] h-full bg-green-500/40 border-l-2 border-green-500 flex items-center px-2">
                      <Play className="w-3 h-3 text-green-400 mr-1" />
                      <span className="text-xs text-green-300 font-medium">Active</span>
                    </div>
                    {/* Blocked state */}
                    <div className="absolute left-[80%] w-[20%] h-full bg-red-500/40 border-l-2 border-red-500 flex items-center px-2">
                      <Ban className="w-3 h-3 text-red-400 mr-1" />
                      <span className="text-xs text-red-300 font-medium">Blocked</span>
                    </div>
                  </div>
                </div>

                {/* WO-2025-0122 */}
                <div className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <span className="text-xs font-medium text-white">WO-2025-0122</span>
                    <p className="text-xs text-slate-500">Rx Surf - Batch B</p>
                  </div>
                  <div className="flex-1 h-12 bg-[#1e293b] rounded relative overflow-hidden">
                    {/* Waiting state */}
                    <div className="absolute left-[0%] w-[25%] h-full bg-amber-500/40 border-l-2 border-amber-500 flex items-center px-2">
                      <Pause className="w-3 h-3 text-amber-400 mr-1" />
                      <span className="text-xs text-amber-300 font-medium">Waiting</span>
                    </div>
                    {/* Active state */}
                    <div className="absolute left-[25%] w-[55%] h-full bg-green-500/40 border-l-2 border-green-500 flex items-center px-2">
                      <Play className="w-3 h-3 text-green-400 mr-1" />
                      <span className="text-xs text-green-300 font-medium">Active</span>
                    </div>
                    {/* Delayed state */}
                    <div className="absolute left-[80%] w-[20%] h-full bg-orange-500/40 border-l-2 border-orange-500 flex items-center px-2">
                      <AlertTriangle className="w-3 h-3 text-orange-400 mr-1" />
                      <span className="text-xs text-orange-300 font-medium">Delayed</span>
                    </div>
                  </div>
                </div>

                {/* WO-2025-0118 */}
                <div className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <span className="text-xs font-medium text-white">WO-2025-0118</span>
                    <p className="text-xs text-slate-500">Rx Surf - Batch C</p>
                  </div>
                  <div className="flex-1 h-12 bg-[#1e293b] rounded relative overflow-hidden">
                    {/* Active state */}
                    <div className="absolute left-[15%] w-[45%] h-full bg-green-500/40 border-l-2 border-green-500 flex items-center px-2">
                      <Play className="w-3 h-3 text-green-400 mr-1" />
                      <span className="text-xs text-green-300 font-medium">Active</span>
                    </div>
                    {/* Blocked state */}
                    <div className="absolute left-[60%] w-[25%] h-full bg-red-500/40 border-l-2 border-red-500 flex items-center px-2">
                      <Ban className="w-3 h-3 text-red-400 mr-1" />
                      <span className="text-xs text-red-300 font-medium">Blocked</span>
                    </div>
                    {/* Completed state */}
                    <div className="absolute left-[85%] w-[15%] h-full bg-blue-500/40 border-l-2 border-blue-500 flex items-center px-2">
                      <CheckCircle className="w-3 h-3 text-blue-400 mr-1" />
                      <span className="text-xs text-blue-300 font-medium">Done</span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="pt-3 border-t border-white/10 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500/40 border border-green-500 rounded"></div>
                    <span className="text-xs text-slate-400">Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-amber-500/40 border border-amber-500 rounded"></div>
                    <span className="text-xs text-slate-400">Waiting</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500/40 border border-red-500 rounded"></div>
                    <span className="text-xs text-slate-400">Blocked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500/40 border border-orange-500 rounded"></div>
                    <span className="text-xs text-slate-400">Delayed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500/40 border border-blue-500 rounded"></div>
                    <span className="text-xs text-slate-400">Completed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cycle Time Trend */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Cycle Time Trend</CardTitle>
                <CardDescription className="text-xs text-slate-400">Average cycle time by hour (today)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-12">06:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '95%' }}></div>
                    </div>
                    <span className="text-xs text-white w-12 text-right">118s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-12">08:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: '142%' }}></div>
                    </div>
                    <span className="text-xs text-red-400 w-12 text-right">162s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-12">10:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '108%' }}></div>
                    </div>
                    <span className="text-xs text-white w-12 text-right">135s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-12">12:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '98%' }}></div>
                    </div>
                    <span className="text-xs text-white w-12 text-right">122s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-12">14:00</span>
                    <div className="flex-1 mx-3 h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: '118%' }}></div>
                    </div>
                    <span className="text-xs text-orange-400 w-12 text-right font-medium">142s</span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Target</span>
                      <span className="text-sm font-medium text-white">120s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cycle Time Distribution */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Cycle Time Distribution</CardTitle>
                <CardDescription className="text-xs text-slate-400">Frequency by cycle time range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">90-110s</span>
                      <span className="text-xs text-green-400 font-medium">8%</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">110-130s</span>
                      <span className="text-xs text-cyan-400 font-medium">42%</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">130-150s</span>
                      <span className="text-xs text-amber-400 font-medium">28%</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '28%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">150-170s</span>
                      <span className="text-xs text-orange-400 font-medium">18%</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: '18%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">170s+</span>
                      <span className="text-xs text-red-400 font-medium">4%</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: '4%' }}></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Std Deviation</span>
                      <span className="text-sm font-medium text-white">±22s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delay Frequency by Process */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Delay Frequency</CardTitle>
                <CardDescription className="text-xs text-slate-400">By root cause category (last 7 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Tool Wear</span>
                      <span className="text-xs text-red-400 font-medium">24 events</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Material Queue</span>
                      <span className="text-xs text-orange-400 font-medium">18 events</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Setup Change</span>
                      <span className="text-xs text-amber-400 font-medium">12 events</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Calibration</span>
                      <span className="text-xs text-yellow-400 font-medium">8 events</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-yellow-500" style={{ width: '33%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Other</span>
                      <span className="text-xs text-slate-400 font-medium">5 events</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-slate-500" style={{ width: '21%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Production Loss Attribution */}
          <div className="mt-6">
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Production Loss Attribution</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Impact breakdown for CURVE GENERATING 3-B (today)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-slate-400">Tool Wear Delay</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">-18</p>
                    <p className="text-xs text-red-300">units/hr • 64% of loss</p>
                  </div>
                  <div className="bg-orange-950/30 rounded-lg p-4 border border-orange-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-slate-400">Blocked State</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-400">-6</p>
                    <p className="text-xs text-orange-300">units/hr • 21% of loss</p>
                  </div>
                  <div className="bg-amber-950/30 rounded-lg p-4 border border-amber-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Pause className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-slate-400">Waiting State</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">-3</p>
                    <p className="text-xs text-amber-300">units/hr • 11% of loss</p>
                  </div>
                  <div className="bg-yellow-950/30 rounded-lg p-4 border border-yellow-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-slate-400">Other Factors</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">-1</p>
                    <p className="text-xs text-yellow-300">units/hr • 4% of loss</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right AI Copilot Panel - Root Cause Mode */}
        <div className="w-96 bg-[#0f1623] border-l border-white/10 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-semibold text-white">AI Root Cause Analysis</h3>
            </div>
            <p className="text-xs text-slate-400">Station-level bottleneck identification and engineering insights</p>
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
                    CURVE GENERATING 3-B is the primary bottleneck. Cycle time is 18% above target (142s vs 120s). Root cause: tool wear on spindle assembly.
                  </p>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">2 minutes ago</span>
              </div>
            </div>

            {/* AI Insight Card - Root Cause */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 border-purple-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white">Root Cause: Tool Wear</CardTitle>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Critical</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-purple-300 font-medium">Cycle Time Variance Analysis</span>
                  <p className="text-sm text-slate-200 mt-1">
                    Tool wear detected after 2,847 cycles (92% of rated life). Causing 22s additional cycle time per unit. Standard deviation increased from ±8s to ±22s.
                  </p>
                </div>
                <div>
                  <span className="text-xs text-purple-300 font-medium">Engineering Action</span>
                  <p className="text-sm text-slate-200 mt-1">
                    Replace spindle tool during next shift change (18:00). Estimated downtime: 45 min. Recovery: +18 units/hr.
                  </p>
                </div>
                <div>
                  <span className="text-xs text-purple-300 font-medium">Scheduling Recommendation</span>
                  <p className="text-sm text-slate-200 mt-1">
                    Reduce tool replacement interval from 3,000 to 2,800 cycles to prevent future variance spikes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-300">Confidence</span>
                  <div className="flex-1 h-2 bg-[#1e293b] rounded overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '94%' }}></div>
                  </div>
                  <span className="text-xs text-white">94%</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Secondary Insight */}
            <Card className="bg-gradient-to-br from-amber-900/30 to-amber-950/30 border-amber-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white">Secondary Factor: Material Queue</CardTitle>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Medium</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-amber-300 font-medium">Blocking Events</span>
                  <p className="text-sm text-slate-200 mt-1">
                    18 blocking events detected today (avg 12 min each). Upstream ALLOY BLOCKING backup causing material queue delays.
                  </p>
                </div>
                <div>
                  <span className="text-xs text-amber-300 font-medium">Scheduling Optimization</span>
                  <p className="text-sm text-slate-200 mt-1">
                    Adjust batch sizes to reduce WIP accumulation. Current batch: 85 units. Recommended: 60 units.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Message */}
            <div className="flex gap-3 justify-end">
              <div className="flex-1 max-w-[80%]">
                <div className="bg-[#00d4ff]/20 rounded-lg p-3 border border-[#00d4ff]/30">
                  <p className="text-sm text-slate-200">
                    What's the best time to replace the tool?
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
              Why is cycle time increasing?
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <Timer className="w-4 h-4 mr-2" />
              Variance root cause analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              Optimization recommendations
            </Button>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about station performance..."
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
