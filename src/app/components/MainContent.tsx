import { 
  Activity, 
  Users, 
  Wrench, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Factory,
  Target,
  Clock,
  Package,
  Sparkles,
  Send,
  Bot,
  User,
  ChevronRight,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface MainContentProps {
  sidebarCollapsed: boolean;
  onNavigate?: (page: string) => void;
}

// Sample data for visualizations
const productionRateTrend = [
  { hour: '06:00', rate: 242, target: 280 },
  { hour: '07:00', rate: 255, target: 280 },
  { hour: '08:00', rate: 268, target: 280 },
  { hour: '09:00', rate: 275, target: 280 },
  { hour: '10:00', rate: 262, target: 280 },
  { hour: '11:00', rate: 258, target: 280 },
  { hour: '12:00', rate: 248, target: 280 },
  { hour: '13:00', rate: 264, target: 280 },
];

const productionLossByProcess = [
  { process: 'CURVE GEN', loss: 142, percentage: 35 },
  { process: 'POLISHING', loss: 98, percentage: 24 },
  { process: 'LASER ENGR', loss: 76, percentage: 19 },
  { process: 'ALLOY BLK', loss: 52, percentage: 13 },
  { process: 'AUTO TAPE', loss: 36, percentage: 9 },
];

const downtimeByStation = [
  { station: 'CURVE-GEN-3B', downtime: 52, incidents: 3 },
  { station: 'POLISHING-7A', downtime: 38, incidents: 2 },
  { station: 'LASER-ENGR-2C', downtime: 28, incidents: 1 },
  { station: 'ALLOY-BLK-5D', downtime: 22, incidents: 1 },
];

const activeMaintenanceJobs = [
  { id: 'MWO-2401-089', machine: 'CURVE-GEN-3B', issue: 'Spindle bearing replacement', technician: 'Lee Min-ho', status: 'In Progress', elapsed: '1h 25m' },
  { id: 'MWO-2401-090', machine: 'POLISHING-7A', issue: 'Coolant pump failure', technician: 'Choi Da-eun', status: 'Waiting Parts', elapsed: '0h 45m' },
];

const runningWorkorders = [
  { id: 'WO-2024-1156', product: 'RX-Progressive-1.67', qty: 150, completed: 112, target: '14:30', status: 'On Track' },
  { id: 'WO-2024-1157', product: 'SV-Single-1.50', qty: 200, completed: 98, target: '15:00', status: 'Delayed' },
  { id: 'WO-2024-1158', product: 'RX-Bifocal-1.60', qty: 100, completed: 87, target: '16:00', status: 'On Track' },
];

// AI chat messages
const sampleChatMessages = [
  {
    id: 1,
    role: 'user',
    content: 'Why is production rate lower than last shift?',
    timestamp: '13:24',
  },
  {
    id: 2,
    role: 'assistant',
    content: `**Production Rate Analysis - Current Shift vs Previous**

The current shift production rate is running 8.2% below the previous shift. Here are the key factors:

**Primary Contributors:**
1. **Extended Downtime on CURVE-GEN-3B** (52 minutes)
   - Unplanned spindle bearing failure at 11:15
   - Resulted in ~35 units of lost production
   - Repair still in progress (MWO-2401-089)

2. **Delayed Workorder WO-2024-1157** 
   - 51% completion (98/200 units)
   - 25 minutes behind schedule
   - Material flow bottleneck from upstream process

3. **Reduced Staffing**
   - 2 operators on leave today
   - Shift coverage at 92% vs 100% yesterday

**Impact Summary:**
• Lost production time: 78 minutes (across 3 incidents)
• Estimated units lost: ~58 units
• Current rate: 258 units/hr vs 280 target (-7.9%)

**Recommendation:** Priority focus on CURVE-GEN-3B repair completion. Once online, projected recovery to 270+ units/hr in next 2 hours.`,
    timestamp: '13:24',
  },
];

export function MainContent({ sidebarCollapsed, onNavigate }: MainContentProps) {
  const [messages, setMessages] = useState(sampleChatMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

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

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-hidden transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex">
        {/* Main Dashboard Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-1">Overview Dashboard</h2>
                <p className="text-sm text-slate-400">
                  Real-time operational intelligence for production and maintenance
                </p>
              </div>
              <Button
                onClick={() => setIsCopilotOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                size="sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Copilot
              </Button>
            </div>

            {/* KPI Snapshot - Enterprise Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {/* Production Rate */}
              <Card 
                className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-800/30 cursor-pointer hover:border-cyan-600/50 transition-colors"
                onClick={() => handleNavigate('#production-performance')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium text-cyan-300/80 uppercase">
                      Production Rate
                    </CardDescription>
                    <Factory className="w-4 h-4 text-cyan-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-1">258</div>
                  <p className="text-xs text-cyan-300/60 mb-2">units/hour</p>
                  <div className="flex items-center gap-1 text-xs">
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                    <span className="text-red-400">7.9% vs last shift</span>
                  </div>
                </CardContent>
              </Card>

              {/* OEE */}
              <Card 
                className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-800/30 cursor-pointer hover:border-amber-600/50 transition-colors"
                onClick={() => handleNavigate('#production-performance')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium text-amber-300/80 uppercase">
                      OEE
                    </CardDescription>
                    <Target className="w-4 h-4 text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-1">72.4%</div>
                  <p className="text-xs text-amber-300/60 mb-2">Overall Equipment</p>
                  <div className="flex items-center gap-1 text-xs">
                    <Minus className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-400">-2.1% vs yesterday</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Rate */}
              <Card 
                className="bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-800/30 cursor-pointer hover:border-green-600/50 transition-colors"
                onClick={() => handleNavigate('#scrap-analysis')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium text-green-300/80 uppercase">
                      Quality Rate
                    </CardDescription>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-1">97.8%</div>
                  <p className="text-xs text-green-300/60 mb-2">First Pass Yield</p>
                  <div className="flex items-center gap-1 text-xs">
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">+0.4% vs yesterday</span>
                  </div>
                </CardContent>
              </Card>

              {/* Open Maintenance Workorders */}
              <Card 
                className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30 cursor-pointer hover:border-purple-600/50 transition-colors"
                onClick={() => handleNavigate('#station-maintenance-tracking')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium text-purple-300/80 uppercase">
                      Open MWOs
                    </CardDescription>
                    <Wrench className="w-4 h-4 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-1">8</div>
                  <p className="text-xs text-purple-300/60 mb-2">Maintenance Jobs</p>
                  <div className="flex items-center gap-1 text-xs">
                    <Activity className="w-3 h-3 text-purple-400" />
                    <span className="text-purple-400">2 in progress</span>
                  </div>
                </CardContent>
              </Card>

              {/* Average MTTR */}
              <Card 
                className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/30 cursor-pointer hover:border-blue-600/50 transition-colors"
                onClick={() => handleNavigate('#station-maintenance-analysis')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium text-blue-300/80 uppercase">
                      Avg MTTR
                    </CardDescription>
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-1">2.4h</div>
                  <p className="text-xs text-blue-300/60 mb-2">Mean Time To Repair</p>
                  <div className="flex items-center gap-1 text-xs">
                    <ArrowDownRight className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">-18% vs last week</span>
                  </div>
                </CardContent>
              </Card>

              {/* Critical Downtime Events */}
              <Card 
                className="bg-gradient-to-br from-red-900/40 to-red-950/40 border-red-800/30 cursor-pointer hover:border-red-600/50 transition-colors"
                onClick={() => handleNavigate('#station-maintenance-analysis')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium text-red-300/80 uppercase">
                      Critical Events
                    </CardDescription>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-1">3</div>
                  <p className="text-xs text-red-300/60 mb-2">Today's Incidents</p>
                  <div className="flex items-center gap-1 text-xs">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span className="text-red-400">1 active now</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Operational Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Production Operations */}
              <Card className="bg-[#141b2e] border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-white">Production Operations</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Active workorders and status</CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      onClick={() => handleNavigate('#workorder-tracking')}
                    >
                      View All
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {runningWorkorders.map((wo) => (
                      <div key={wo.id} className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">{wo.id}</span>
                              {wo.status === 'On Track' ? (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                  On Track
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                                  Delayed
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mb-2">{wo.product}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span>Qty: {wo.qty}</span>
                              <span>•</span>
                              <span>Completed: {wo.completed} ({Math.round((wo.completed / wo.qty) * 100)}%)</span>
                              <span>•</span>
                              <span>Target: {wo.target}</span>
                            </div>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${wo.status === 'On Track' ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${(wo.completed / wo.qty) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Running</p>
                      <p className="text-lg font-semibold text-green-400">10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Delayed</p>
                      <p className="text-lg font-semibold text-red-400">2</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Bottleneck</p>
                      <p className="text-lg font-semibold text-amber-400">CURVE GEN</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Operations */}
              <Card className="bg-[#141b2e] border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-white">Maintenance Operations</CardTitle>
                      <CardDescription className="text-xs text-slate-400">Active jobs and machine status</CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      onClick={() => handleNavigate('#station-maintenance-tracking')}
                    >
                      View All
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeMaintenanceJobs.map((job) => (
                      <div key={job.id} className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">{job.id}</span>
                              {job.status === 'In Progress' ? (
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                  In Progress
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                                  Waiting Parts
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mb-1">{job.machine} • {job.issue}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>Technician: {job.technician}</span>
                              <span>•</span>
                              <span>Elapsed: {job.elapsed}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Active Jobs</p>
                      <p className="text-lg font-semibold text-blue-400">2</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Under Maint.</p>
                      <p className="text-lg font-semibold text-amber-400">2 machines</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 mb-1">Waiting Parts</p>
                      <p className="text-lg font-semibold text-red-400">1</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Visualization & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Production Rate Trend */}
              <Card className="bg-[#141b2e] border-white/10">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-white">Production Rate Trend</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Today's hourly performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsLineChart data={productionRateTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="#64748b"
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis 
                        stroke="#64748b"
                        style={{ fontSize: '10px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#00d4ff" 
                        strokeWidth={2}
                        name="Actual Rate"
                        dot={{ fill: '#00d4ff', r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#fbbf24" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Target"
                        dot={false}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                  <div className="mt-3 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded">
                    <p className="text-xs text-cyan-300">
                      Peak performance at 09:00 (275 units/hr). Current gap to target: 22 units/hr.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Production Loss by Process */}
              <Card className="bg-[#141b2e] border-white/10">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-white">Production Loss by Process</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Today's bottleneck analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={productionLossByProcess} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        type="number"
                        stroke="#64748b"
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis 
                        type="category"
                        dataKey="process"
                        stroke="#64748b"
                        style={{ fontSize: '10px' }}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}
                      />
                      <Bar dataKey="loss" name="Units Lost" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="text-xs text-red-300">
                      CURVE GENERATING accounts for 35% of total production loss (142 units).
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Downtime by Station */}
              <Card className="bg-[#141b2e] border-white/10">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-white">Downtime by Station</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Top contributors - Today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {downtimeByStation.map((station, idx) => (
                      <div key={station.station}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white">{station.station}</span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                              {station.incidents} events
                            </Badge>
                            <span className="text-sm font-semibold text-amber-400">{station.downtime} min</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500"
                            style={{ width: `${(station.downtime / 52) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                    <p className="text-xs text-amber-300">
                      Total downtime: 140 minutes across 7 incidents. CURVE-GEN-3B requires attention.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Trend */}
              <Card className="bg-[#141b2e] border-white/10">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-white">Maintenance Performance</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Weekly MTTR and backlog trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Avg MTTR</p>
                      <p className="text-2xl font-semibold text-blue-400 mb-1">2.4h</p>
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <TrendingDown className="w-3 h-3" />
                        <span>-18% vs last week</span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                      <p className="text-xs text-slate-400 mb-1">Open Backlog</p>
                      <p className="text-2xl font-semibold text-purple-400 mb-1">8</p>
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <TrendingDown className="w-3 h-3" />
                        <span>-3 vs last week</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Completed this week</span>
                      <span className="font-semibold text-green-400">24 jobs</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Avg response time</span>
                      <span className="font-semibold text-cyan-400">18 min</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Parts availability</span>
                      <span className="font-semibold text-amber-400">87%</span>
                    </div>
                  </div>
                  <div className="mt-4 p-2 bg-green-500/10 border border-green-500/30 rounded">
                    <p className="text-xs text-green-300">
                      Maintenance performance improving. MTTR reduced by 18% through better parts management.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* AI Operations Copilot Panel */}
        <div
          className={`absolute inset-y-0 right-0 z-20 w-96 max-w-[calc(100vw-2rem)] border-l border-white/10 bg-[#0f1623] flex flex-col shadow-2xl shadow-black/40 transition-transform duration-300 ease-out ${
            isCopilotOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
          aria-hidden={!isCopilotOpen}
        >
          {/* Copilot Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Operations Copilot</h3>
                  <p className="text-xs text-slate-400">
                    Your intelligent operations assistant
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsCopilotOpen(false)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-slate-400 hover:bg-[#1e293b] hover:text-white"
                aria-label="Close AI Copilot"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Insights */}
            <div className="p-3 bg-[#141b2e] border border-white/10 rounded-lg">
              <p className="text-xs font-medium text-slate-400 mb-2">Quick Insights:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">CURVE-GEN-3B downtime impacting production by ~35 units</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Quality rate improved +0.4% vs yesterday</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <TrendingDown className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">MTTR reduced by 18% this week</span>
                </div>
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
                    message.role === 'user' ? 'bg-slate-700' : 'bg-cyan-500/20'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-3 h-3 text-slate-300" />
                    ) : (
                      <Bot className="w-3 h-3 text-cyan-400" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white">
                        {message.role === 'user' ? 'You' : 'Copilot'}
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
              <p className="text-xs text-slate-400 mb-2">Ask the Copilot:</p>
              <div className="space-y-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                  onClick={() => setInputMessage('Which machine is causing the most downtime?')}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Top downtime machine
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                  onClick={() => setInputMessage('Is maintenance affecting output?')}
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Maintenance impact
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                  onClick={() => setInputMessage('Show OEE breakdown')}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  OEE analysis
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
                placeholder="Ask about KPIs, trends, or issues..."
                className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 text-xs h-9"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 px-3"
                size="sm"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              AI-powered operational intelligence
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
